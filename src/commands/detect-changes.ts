import path from "path";
import fs from "fs-extra";
import { Command } from "commander";
import { diffLines } from "diff";
import { 
  getSourceRepoConfig, 
  getLocalTracking, 
  markComponentAsCustomized 
} from "../utils/config";
import { cloneRepository } from "../utils/git";
import { detectChangesOptionsSchema, type ChangeDetectionResult } from "../utils/schema";
import { highlighter, logger, spinner, handleError } from "../utils/logger";

/**
 * Detect changes between two component directories
 */
async function detectComponentChanges(
  sourcePath: string,
  targetPath: string
): Promise<ChangeDetectionResult["changes"]> {
  const changes: ChangeDetectionResult["changes"] = [];
  
  // Get all files in both directories
  const sourceFiles = await fs.glob("**/*", { 
    cwd: sourcePath, 
    nodir: true,
    absolute: false 
  });
  
  const targetFiles = await fs.glob("**/*", { 
    cwd: targetPath, 
    nodir: true,
    absolute: false 
  });
  
  // Check for modified files
  for (const file of sourceFiles) {
    if (targetFiles.includes(file)) {
      const sourceContent = await fs.readFile(path.join(sourcePath, file), "utf8");
      const targetContent = await fs.readFile(path.join(targetPath, file), "utf8");
      
      if (sourceContent !== targetContent) {
        // Compute diff statistics
        const diff = diffLines(sourceContent, targetContent);
        
        let additions = 0;
        let deletions = 0;
        
        diff.forEach(part => {
          if (part.added) {
            additions += part.count || 0;
          } else if (part.removed) {
            deletions += part.count || 0;
          }
        });
        
        changes.push({
          filePath: file,
          additions,
          deletions,
          diff: formatDiff(diff),
        });
      }
    }
  }
  
  // Check for added files
  for (const file of targetFiles) {
    if (!sourceFiles.includes(file)) {
      changes.push({
        filePath: file,
        additions: 1,
        deletions: 0,
        diff: "New file added",
      });
    }
  }
  
  return changes;
}

/**
 * Format diff for display
 */
function formatDiff(diff: ReturnType<typeof diffLines>): string {
  return diff
    .map(part => {
      const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
      return part.value
        .split("\n")
        .filter(Boolean)
        .map(line => prefix + line)
        .join("\n");
    })
    .join("\n");
}

export const detectChanges = new Command()
  .name("detect-changes")
  .description("detect changes to synced components")
  .argument("[components...]", "components to check")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (components, opts) => {
    try {
      const options = detectChangesOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        components: components.length ? components : undefined,
      });

      await runDetectChanges(options);
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });

export async function runDetectChanges(options: {
  cwd: string;
  components?: string[];
}): Promise<ChangeDetectionResult[]> {
  // Get configuration
  const config = await getSourceRepoConfig(options.cwd);
  if (!config) {
    logger.error(
      `No configuration found at ${highlighter.info(options.cwd)}.`
    );
    logger.error(
      `Run ${highlighter.info("open-code init")} to create a configuration.`
    );
    process.exit(1);
  }

  // Get local tracking
  const tracking = await getLocalTracking(options.cwd);
  if (!tracking) {
    logger.error(
      `No local tracking found at ${highlighter.info(options.cwd)}.`
    );
    logger.error(
      `Run ${highlighter.info("open-code init")} to create local tracking.`
    );
    process.exit(1);
  }

  // Filter components to check
  let componentsToCheck = tracking.components;
  if (options.components?.length) {
    componentsToCheck = tracking.components.filter(component => 
      options.components!.includes(component.name)
    );

    // Check if all requested components were found
    const notFound = options.components.filter(
      name => !componentsToCheck.find(c => c.name === name)
    );

    if (notFound.length > 0) {
      logger.warn(
        `The following components were not found: ${notFound.join(", ")}`
      );
    }
  }

  if (componentsToCheck.length === 0) {
    logger.warn("No components to check.");
    process.exit(0);
  }

  // Group components by repository
  const componentsByRepo: Record<string, typeof componentsToCheck> = {};
  componentsToCheck.forEach(component => {
    if (!componentsByRepo[component.repositoryName]) {
      componentsByRepo[component.repositoryName] = [];
    }
    componentsByRepo[component.repositoryName].push(component);
  });

  // Check each repository
  const results: ChangeDetectionResult[] = [];

  for (const [repoName, components] of Object.entries(componentsByRepo)) {
    // Get repo info
    const repo = config.repositories.find(r => r.name === repoName);
    
    if (!repo) {
      logger.error(
        `Repository ${highlighter.info(repoName)} not found in configuration.`
      );
      continue;
    }

    // Clone the repository
    const cloneSpinner = spinner(
      `Cloning repository ${highlighter.info(repo.url)}`
    ).start();

    try {
      const { dir: repoDir } = await cloneRepository(repo.url, repo.branch);
      cloneSpinner.succeed(
        `Cloned repository ${highlighter.info(repo.name)}`
      );

      // Check each component
      for (const component of components) {
        const detectSpinner = spinner(
          `Checking component ${highlighter.info(component.name)}`
        ).start();

        const componentDir = path.resolve(
          options.cwd,
          config.componentDirectories?.base || "./components"
        );

        const localComponentPath = path.join(componentDir, component.path);
        const repoComponentPath = path.join(repoDir, component.originalPath);

        if (!(await fs.pathExists(localComponentPath))) {
          detectSpinner.fail(
            `Local component ${highlighter.info(component.name)} not found`
          );
          continue;
        }

        if (!(await fs.pathExists(repoComponentPath))) {
          detectSpinner.fail(
            `Repository component ${highlighter.info(component.name)} not found`
          );
          continue;
        }

        // Compare files
        const changes = await detectComponentChanges(
          repoComponentPath,
          localComponentPath
        );

        if (changes.length > 0) {
          detectSpinner.succeed(
            `Component ${highlighter.info(component.name)} has been modified`
          );

          // Mark component as customized
          await markComponentAsCustomized(options.cwd, component.name, component.repositoryName);

          results.push({
            component,
            hasChanges: true,
            changes,
          });

          // Display changes
          logger.break();
          logger.info(`Changes in ${highlighter.info(component.name)}:`);
          
          for (const change of changes) {
            logger.info(`  ${change.filePath} (${change.additions} additions, ${change.deletions} deletions)`);
          }
        } else {
          detectSpinner.succeed(
            `Component ${highlighter.info(component.name)} is unchanged`
          );
          
          results.push({
            component,
            hasChanges: false,
          });
        }
      }
    } catch (error) {
      cloneSpinner.fail(
        `Failed to clone repository ${highlighter.info(repo.name)}`
      );
      logger.error(`Error: ${(error as Error).message}`);
    }
  }

  // Summary
  logger.break();

  const changedComponents = results.filter(result => result.hasChanges);
  const unchangedComponents = results.filter(result => !result.hasChanges);

  if (changedComponents.length > 0) {
    logger.warn(
      `${changedComponents.length} component${changedComponents.length > 1 ? "s" : ""} modified: ${changedComponents.map(r => r.component.name).join(", ")}`
    );
  }

  if (unchangedComponents.length > 0) {
    logger.success(
      `${unchangedComponents.length} component${unchangedComponents.length > 1 ? "s" : ""} unchanged: ${unchangedComponents.map(r => r.component.name).join(", ")}`
    );
  }

  logger.break();
  
  if (changedComponents.length > 0) {
    logger.info(
      `Use ${highlighter.info("open-code contribute")} to submit your changes as pull requests`
    );
  }

  return results;