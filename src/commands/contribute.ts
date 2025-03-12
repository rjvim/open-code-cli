import path from "path";
import fs from "fs-extra";
import { Command } from "commander";
import prompts from "prompts";
import {
  getSourceRepoConfig,
  getLocalTracking,
  findTrackedComponent,
} from "../utils/config";
import {
  cloneRepository,
  createGitHubFork,
  createBranch,
  pushChanges,
  createPullRequest,
  isGitHubCliAuthenticated,
  authenticateWithGitHubCli,
} from "../utils/git";
import { contributeOptionsSchema } from "../utils/schema";
import { highlighter, logger, spinner, handleError } from "../utils/logger";
import { runDetectChanges } from "./detect-changes";

export const contribute = new Command()
  .name("contribute")
  .description("contribute changes back to source repositories")
  .argument("[components...]", "components to contribute")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-m, --message <message>", "message for the pull request")
  .option(
    "--skip-auth",
    "skip GitHub authentication (use existing token)",
    false
  )
  .action(async (components, opts) => {
    try {
      const options = contributeOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        components: components.length ? components : undefined,
        message: opts.message,
        skipAuth: opts.skipAuth,
      });

      await runContribute(options);
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });

export async function runContribute(options: {
  cwd: string;
  components?: string[];
  message?: string;
  skipAuth?: boolean;
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

  // Detect changes if no components specified
  let componentsToContribute = options.components;
  if (!componentsToContribute?.length) {
    // Detect changes first
    logger.info("Detecting changes to components...");
    const changes = await runDetectChanges({ cwd: options.cwd });

    const modifiedComponents = changes
      .filter((result) => result.hasChanges)
      .map((result) => result.component.name);

    if (modifiedComponents.length === 0) {
      logger.success("No modified components found.");
      process.exit(0);
    }

    // Prompt user to select components to contribute
    const { components } = await prompts({
      type: "multiselect",
      name: "components",
      message: "Select components to contribute:",
      hint: "Space to select. A to toggle all. Enter to submit.",
      instructions: false,
      choices: modifiedComponents.map((name) => ({
        title: name,
        value: name,
      })),
    });

    if (!components?.length) {
      logger.warn("No components selected.");
      process.exit(0);
    }

    componentsToContribute = components;
  }

  // Authenticate with GitHub
  const authSpinner = spinner("Authenticating with GitHub").start();

  let token: string;

  if (options.skipAuth) {
    const isAuthenticated = await isGitHubCliAuthenticated();

    if (!isAuthenticated) {
      authSpinner.fail("GitHub CLI not authenticated");
      logger.error(
        "You must be authenticated with GitHub CLI or provide a token."
      );
      process.exit(1);
    }

    token = await authenticateWithGitHubCli();
  } else {
    const isAuthenticated = await isGitHubCliAuthenticated();

    if (isAuthenticated) {
      token = await authenticateWithGitHubCli();
    } else {
      authSpinner.stop();

      const { token: inputToken } = await prompts({
        type: "password",
        name: "token",
        message: "GitHub personal access token:",
        validate: (value) => (value ? true : "Token is required"),
      });

      if (!inputToken) {
        logger.error("Token is required.");
        process.exit(1);
      }

      token = inputToken;
    }
  }

  authSpinner.succeed("Authenticated with GitHub");

  // Process each component
  for (const componentName of componentsToContribute) {
    const componentSpinner = spinner(
      `Processing component ${highlighter.info(componentName)}`
    ).start();

    // Find component in tracking
    const component = await findTrackedComponent(options.cwd, componentName);

    if (!component) {
      componentSpinner.fail(
        `Component ${highlighter.info(componentName)} not found in tracking`
      );
      continue;
    }

    // Find repository
    const repo = config.repositories.find(
      (r) => r.name === component.repositoryName
    );

    if (!repo) {
      componentSpinner.fail(
        `Repository ${highlighter.info(component.repositoryName)} not found in configuration`
      );
      continue;
    }

    // Get component source
    const componentDir = path.resolve(
      options.cwd,
      config.componentDirectories?.base || "./components"
    );

    const localComponentPath = path.join(componentDir, component.path);

    if (!(await fs.pathExists(localComponentPath))) {
      componentSpinner.fail(
        `Local component ${highlighter.info(componentName)} not found`
      );
      continue;
    }

    // Fork repository if needed
    componentSpinner.text = `Creating fork of ${highlighter.info(repo.name)}`;

    try {
      // Try to create a fork
      const forkUrl = await createGitHubFork(repo.url, token);

      // Clone the fork
      componentSpinner.text = `Cloning fork of ${highlighter.info(repo.name)}`;
      const { dir: forkDir } = await cloneRepository(forkUrl);

      // Create branch
      const branchName = `open-code/${componentName}-${Date.now()}`;
      await createBranch(forkDir, branchName);

      // Copy modified component to fork
      const repoComponentPath = path.join(forkDir, component.originalPath);
      await fs.ensureDir(path.dirname(repoComponentPath));
      await fs.copy(localComponentPath, repoComponentPath, { overwrite: true });

      // Create commit message
      const commitMessage =
        options.message ||
        `Update ${componentName} component\n\nUpdated by open-code-cli`;

      // Push changes
      componentSpinner.text = `Pushing changes to ${highlighter.info(branchName)}`;
      await pushChanges(forkDir, branchName, commitMessage);

      // Create pull request
      componentSpinner.text = `Creating pull request for ${highlighter.info(componentName)}`;
      const prUrl = await createPullRequest(
        repo.url,
        forkUrl,
        token,
        `Update ${componentName} component`,
        commitMessage,
        branchName
      );

      componentSpinner.succeed(
        `Created pull request for ${highlighter.info(componentName)}`
      );

      logger.success(`Pull request: ${highlighter.info(prUrl)}`);
    } catch (error) {
      componentSpinner.fail(
        `Failed to create pull request for ${highlighter.info(componentName)}`
      );
      logger.error(`Error: ${(error as Error).message}`);
    }
  }

  logger.break();
  logger.success("Contribution process completed.");
}
