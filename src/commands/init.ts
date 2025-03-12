import path from "path";
import fs from "fs-extra";
import { Command } from "commander";
import prompts from "prompts";
import { highlighter, logger, spinner, handleError } from "../utils/logger";
import {
  createSourceRepoConfig,
  getSourceRepoConfig,
  createLocalTracking,
} from "../utils/config";
import { cloneRepository, initRepositoryIfNeeded } from "../utils/git";
import { initOptionsSchema, type SourceRepoConfig } from "../utils/schema";

export const init = new Command()
  .name("init")
  .description("initialize your project and create configuration")
  .option("--repo <repo>", "URL of the source repository to initialize from")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-f, --force", "force overwrite of existing configuration.", false)
  .option("--component-dir <componentDir>", "directory for storing components")
  .action(async (opts) => {
    try {
      const options = initOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        repo: opts.repo,
        force: opts.force,
        componentDir: opts.componentDir,
      });

      await runInit(options);

      logger.success("Project initialization completed.");
      logger.break();
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });

export async function runInit(options: {
  cwd: string;
  repo?: string;
  force?: boolean;
  componentDir?: string;
}): Promise<void> {
  // Check if project already has a configuration
  const existingConfig = await getSourceRepoConfig(options.cwd);

  if (existingConfig && !options.force) {
    logger.error(
      `A configuration already exists at ${highlighter.info(options.cwd)}.`
    );
    logger.error(`Use ${highlighter.info("--force")} to overwrite it.`);
    process.exit(1);
  }

  let repoUrl = options.repo;
  let componentDir = options.componentDir;

  // If no repo provided, prompt for it
  if (!repoUrl) {
    const { repo } = await prompts({
      type: "text",
      name: "repo",
      message: "Enter the URL of the source repository:",
      validate: (value) => {
        if (!value) return "Repository URL is required";
        if (!value.startsWith("http")) {
          return "Please enter a valid URL (starting with http/https)";
        }
        return true;
      },
    });

    if (!repo) {
      logger.error("Repository URL is required.");
      process.exit(1);
    }

    repoUrl = repo;
  }

  // If no component directory provided, prompt for it or use default
  if (!componentDir) {
    const { dir } = await prompts({
      type: "text",
      name: "dir",
      message: "Where do you want to store your components?",
      initial: "./components",
    });

    componentDir = dir || "./components";
  }

  const initSpinner = spinner(
    `Initializing project with repository ${highlighter.info(repoUrl)}`
  ).start();

  // Complete the init.ts file
  try {
    // Clone the repository to a temporary directory
    const { dir: repoDir } = await cloneRepository(repoUrl);

    // Check for components in the repository
    const componentsFound = await fs.pathExists(
      path.join(repoDir, "components")
    );

    if (!componentsFound) {
      initSpinner.warn("No components directory found in the repository.");
    }

    // Create component directory if it doesn't exist
    const absoluteComponentDir = path.resolve(options.cwd, componentDir);
    await fs.ensureDir(absoluteComponentDir);

    // Initialize git repository if needed
    await initRepositoryIfNeeded(options.cwd);

    // Create configuration
    const config: SourceRepoConfig = {
      name: "open-code",
      repositories: [
        {
          name: path.basename(repoUrl, ".git"),
          url: repoUrl,
          branch: "main",
          components: [],
        },
      ],
      componentDirectories: {
        base: componentDir,
      },
    };

    // Discover components if they exist
    if (componentsFound) {
      const components = await fs.readdir(path.join(repoDir, "components"));

      for (const component of components) {
        const componentPath = path.join("components", component);
        if (await fs.pathExists(path.join(repoDir, componentPath))) {
          config.repositories[0].components.push({
            name: component,
            path: componentPath,
            description: `${component} component`,
          });
        }
      }
    }

    // Create the configuration file
    await createSourceRepoConfig(options.cwd, config);

    // Create local tracking
    await createLocalTracking(options.cwd);

    initSpinner.succeed("Project initialized successfully");
  } catch (error) {
    initSpinner.fail("Failed to initialize project");
    throw error;
  }
}
