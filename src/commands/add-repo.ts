import path from "path";
import { Command } from "commander";
import { getSourceRepoConfig, updateSourceRepoConfig } from "../utils/config";
import { cloneRepository } from "../utils/git";
import { addRepoOptionsSchema } from "../utils/schema";
import { highlighter, logger, spinner, handleError } from "../utils/logger";

export const addRepo = new Command()
  .name("add-repo")
  .description("add a new source repository")
  .option("--name <name>", "name for the repository")
  .option("--url <url>", "URL of the repository")
  .option("--branch <branch>", "branch to use", "main")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    try {
      const options = addRepoOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        name: opts.name,
        url: opts.url,
        branch: opts.branch,
      });

      await runAddRepo(options);
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });

export async function runAddRepo(options: {
  cwd: string;
  name: string;
  url: string;
  branch: string;
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

  // Check if repository with same name already exists
  if (config.repositories.some((repo) => repo.name === options.name)) {
    logger.error(
      `Repository ${highlighter.info(options.name)} already exists.`
    );
    process.exit(1);
  }

  // Clone the repository to find components
  const cloneSpinner = spinner(
    `Cloning repository ${highlighter.info(options.url)}`
  ).start();

  try {
    const { dir: repoDir } = await cloneRepository(options.url, options.branch);
    cloneSpinner.succeed(`Cloned repository ${highlighter.info(options.url)}`);

    // Find components in repository
    const findSpinner = spinner("Finding components").start();

    // Common component directories and patterns
    const patterns = [
      "components/**",
      "src/components/**",
      "lib/**",
      "src/lib/**",
      "ui/**",
      "src/ui/**",
    ];

    const componentDirs: string[] = [];

    for (const pattern of patterns) {
      const matches = await fs.glob(path.join(repoDir, pattern), {
        onlyDirectories: true,
        deep: 3,
      });

      componentDirs.push(...matches);
    }

    if (componentDirs.length === 0) {
      findSpinner.fail("No components found");
      logger.error(
        "No components found in repository. Make sure the repository has a valid component structure."
      );
      process.exit(1);
    }

    findSpinner.succeed(`Found ${componentDirs.length} components`);

    // Add repository to configuration
    const updateSpinner = spinner("Updating configuration").start();

    const updatedConfig = await updateSourceRepoConfig(options.cwd, {
      repositories: [
        ...config.repositories,
        {
          name: options.name,
          url: options.url,
          branch: options.branch,
          components: componentDirs.map((dir) => ({
            name: path.basename(dir),
            path: path.relative(repoDir, dir),
            description: `${path.basename(dir)} component`,
          })),
        },
      ],
    });

    updateSpinner.succeed("Configuration updated");

    // Show repository info
    logger.break();
    logger.success(
      `Added repository ${highlighter.info(options.name)} with ${componentDirs.length} components`
    );
    logger.break();
    logger.info(
      `Components: ${componentDirs.map((dir) => path.basename(dir)).join(", ")}`
    );
    logger.break();
    logger.info(
      `You can now use ${highlighter.info(`open-code sync --repo ${options.name}`)} to sync components from this repository`
    );
  } catch (error) {
    cloneSpinner.fail(
      `Failed to clone repository ${highlighter.info(options.url)}`
    );
    logger.error(`Error: ${(error as Error).message}`);
  }
}
