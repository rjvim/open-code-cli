import { Command } from "commander";
import fs from "fs-extra";
import { spinner } from "../utils/spinner";
import { logger } from "../utils/logger";
import { validateSource } from "../utils/validate-source";
import { OpenCodeConfig, InitOptions, Repository } from "../types";
import { OpenCodeError } from "../utils/custom-error";
import { INVALID_COMPONENT_DIR, INVALID_REPO_PARAMETER } from "../utils/errors";

export async function registerInitCommand(program: Command): Promise<void> {
  program
    .command("init")
    .description("Initialize a new open-code project")
    .argument("[repo]", "GitHub repository URL (optional)")
    .option(
      "-c, --component-dir <dir>",
      "Directory for components",
      "components"
    )
    .action(init);
}

export async function init(
  repo?: string,
  options: InitOptions = {}
): Promise<void> {
  const initSpinner = spinner("Initializing open-code project...");
  initSpinner.start();

  // Validate repo parameter if provided
  if (repo !== undefined && (typeof repo !== "string" || repo.trim() === "")) {
    initSpinner.fail("Invalid repository parameter");
    throw new OpenCodeError(
      INVALID_REPO_PARAMETER,
      "Repository parameter must be a valid string"
    );
  }

  // Validate component directory
  if (options.componentDir && typeof options.componentDir !== "string") {
    initSpinner.fail("Invalid component directory");
    throw new OpenCodeError(
      INVALID_COMPONENT_DIR,
      "Component directory must be a valid string"
    );
  }

  try {
    // Create configuration
    const config: OpenCodeConfig = {
      version: "1.0.0",
      componentDir: options.componentDir || "components",
      repositories: [],
    };

    // Add repository if provided
    if (repo) {
      const repoInfo = await validateSource(repo);
      const repository: Repository = {
        name: repoInfo.name,
        url: repo,
        branch: repoInfo.branch,
        filePath: repoInfo.filePath,
      };
      config.repositories.push(repository);
    }

    // Write config file
    fs.writeJSONSync(".open-code.json", config, { spaces: 2 });

    // Create component directory
    fs.ensureDirSync(config.componentDir);

    initSpinner.succeed("Project initialized successfully");
    logger.info(`Configuration saved to .open-code.json`);

    if (!repo) {
      logger.info(
        "No repository specified. You can add one later with 'open-code add-repo <url>'"
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    initSpinner.fail(`Initialization failed: ${errorMessage}`);
    throw error;
  }
}
