import path from "path";
import fs from "fs-extra";
import { Command } from "commander";
import prompts from "prompts";
import {
  getSourceRepoConfig,
  getLocalTracking,
  addComponentToTracking,
} from "../utils/config";
import { cloneRepository, getCurrentCommitHash } from "../utils/git";
import { syncOptionsSchema, type Component } from "../utils/schema";
import { highlighter, logger, spinner, handleError } from "../utils/logger";

export const sync = new Command()
  .name("sync")
  .description("sync components from source repositories")
  .argument("[components...]", "components to sync")
  .option(
    "-r, --repo <repo>",
    "repository name to sync from (if multiple repositories configured)"
  )
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-f, --force", "force overwrite of existing components", false)
  .action(async (components, opts) => {
    try {
      const options = syncOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        components: components.length ? components : undefined,
        repo: opts.repo,
        force: opts.force,
      });

      await runSync(options);
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });

export async function runSync(options: {
  cwd: string;
  components?: string[];
  repo?: string;
  force?: boolean;
}): Promise<void> {
  // Get configuration
  const config = await getSourceRepoConfig(options.cwd);
  if (!config) {
    logger.error(`No configuration found at ${highlighter.info(options.cwd)}.`);
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

  // Select repository
  let selectedRepo = config.repositories[0];
  if (options.repo) {
    selectedRepo =
      config.repositories.find((r) => r.name === options.repo) ||
      config.repositories[0];
    if (!selectedRepo) {
      logger.error(`Repository ${highlighter.info(options.repo)} not found.`);
      process.exit(1);
    }
  } else if (config.repositories.length > 1) {
    const { repo } = await prompts({
      type: "select",
      name: "repo",
      message: "Select a repository to sync from:",
      choices: config.repositories.map((repo) => ({
        title: repo.name,
        value: repo.name,
      })),
    });

    if (!repo) {
      logger.error("No repository selected.");
      process.exit(1);
    }

    selectedRepo = config.repositories.find((r) => r.name === repo)!;
  }

  // Select components
  let componentsToSync: Component[] = [];

  if (options.components?.length) {
    // Filter requested components
    componentsToSync = selectedRepo.components.filter((component) =>
      options.components!.includes(component.name)
    );

    // Check if all requested components were found
    const notFound = options.components.filter(
      (name) => !componentsToSync.find((c) => c.name === name)
    );

    if (notFound.length > 0) {
      logger.warn(
        `The following components were not found: ${notFound.join(", ")}`
      );
    }
  } else {
    // Prompt for components
    const { components } = await prompts({
      type: "multiselect",
      name: "components",
      message: "Select components to sync:",
      hint: "Space to select. A to toggle all. Enter to submit.",
      instructions: false,
      choices: selectedRepo.components.map((component) => ({
        title: component.name,
        value: component.name,
        description: component.description,
      })),
    });

    if (!components?.length) {
      logger.warn("No components selected.");
      process.exit(0);
    }

    componentsToSync = selectedRepo.components.filter((component) =>
      components.includes(component.name)
    );
  }

  if (componentsToSync.length === 0) {
    logger.warn("No components to sync.");
    process.exit(0);
  }

  // Clone the repository
  const cloneSpinner = spinner(
    `Cloning repository ${highlighter.info(selectedRepo.url)}`
  ).start();

  const { dir: repoDir, git } = await cloneRepository(
    selectedRepo.url,
    selectedRepo.branch
  );

  const commitHash = await getCurrentCommitHash(repoDir);

  cloneSpinner.succeed(
    `Cloned repository ${highlighter.info(selectedRepo.name)} at commit ${highlighter.info(commitHash.substring(0, 8))}`
  );

  // Sync each component
  const componentDir = path.resolve(
    options.cwd,
    config.componentDirectories?.base || "./components"
  );

  await fs.ensureDir(componentDir);

  const syncedComponents: string[] = [];
  const skippedComponents: string[] = [];

  for (const component of componentsToSync) {
    const componentSpinner = spinner(
      `Syncing component ${highlighter.info(component.name)}`
    ).start();

    // Get the component source path and target path
    const sourcePath = path.join(repoDir, component.path);
    const targetPath = path.join(componentDir, component.name);

    // Check if source exists
    if (!(await fs.pathExists(sourcePath))) {
      componentSpinner.fail(
        `Component ${highlighter.info(component.name)} not found at ${highlighter.info(component.path)}`
      );
      continue;
    }

    // Check if target exists and handle overwrite
    const targetExists = await fs.pathExists(targetPath);

    if (targetExists && !options.force) {
      // Check if the component is already tracked
      const trackedComponent = tracking.components.find(
        (c) =>
          c.name === component.name && c.repositoryName === selectedRepo.name
      );

      // If component is customized, prompt for overwrite
      if (trackedComponent?.customized) {
        componentSpinner.stop();

        const { overwrite } = await prompts({
          type: "confirm",
          name: "overwrite",
          message: `Component ${highlighter.info(component.name)} has been customized. Overwrite?`,
          initial: false,
        });

        if (!overwrite) {
          skippedComponents.push(component.name);
          componentSpinner.fail(
            `Skipped ${highlighter.info(component.name)} (customized)`
          );
          continue;
        }

        componentSpinner.start(
          `Syncing component ${highlighter.info(component.name)}`
        );
      }
    }

    // Copy component
    try {
      await fs.copy(sourcePath, targetPath, {
        overwrite: options.force,
        recursive: true,
      });

      // Update tracking
      await addComponentToTracking(options.cwd, {
        name: component.name,
        repositoryName: selectedRepo.name,
        version: commitHash,
        path: component.name,
        originalPath: component.path,
        lastSynced: new Date().toISOString(),
        customized: false,
      });

      syncedComponents.push(component.name);
      componentSpinner.succeed(
        `Synced component ${highlighter.info(component.name)}`
      );
    } catch (error) {
      componentSpinner.fail(
        `Failed to sync component ${highlighter.info(component.name)}`
      );
      logger.error(`Error: ${(error as Error).message}`);
    }
  }

  // Summary
  logger.break();

  if (syncedComponents.length > 0) {
    logger.success(
      `Synced ${syncedComponents.length} component${syncedComponents.length > 1 ? "s" : ""}: ${syncedComponents.join(", ")}`
    );
  }

  if (skippedComponents.length > 0) {
    logger.warn(
      `Skipped ${skippedComponents.length} component${skippedComponents.length > 1 ? "s" : ""}: ${skippedComponents.join(", ")}`
    );
  }

  logger.break();
  logger.info(`Components are synced to ${highlighter.info(componentDir)}`);
}
