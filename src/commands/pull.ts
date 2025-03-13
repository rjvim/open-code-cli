import { Command } from "commander";
import { logger } from "../utils/logger";
import { prepareDestination } from "../utils/destination";
import { validateSource } from "../utils/validate-source";
import { downloadCode } from "../utils/download";
import { trackSync } from "../utils/track";
import { spinner } from "../utils/spinner";
import { SyncOptions, RepoInfo } from "../types";
import { OpenCodeError } from "../utils/custom-error";
import {
  INVALID_DESTINATION_PARAMETER,
  INVALID_SOURCE_PARAMETER,
} from "../utils/errors";

export async function registerPullCommand(program: Command): Promise<void> {
  program
    .command("pull")
    .description("Sync code from a GitHub repository")
    .argument("<source>", "GitHub repository URL")
    .argument("<destination>", "Local destination path")
    .option(
      "-c, --create",
      "Create destination directory if it doesn't exist",
      false
    )
    .action(pull);
}

export async function pull(
  source: string,
  destination: string,
  options: SyncOptions
): Promise<void> {
  logger.info("Starting pull...");

  // Validate source parameter
  if (!source || typeof source !== "string") {
    throw new OpenCodeError(
      INVALID_SOURCE_PARAMETER,
      "Source parameter must be a valid string"
    );
  }

  // Validate destination parameter
  if (!destination || typeof destination !== "string") {
    throw new OpenCodeError(
      INVALID_DESTINATION_PARAMETER,
      "Destination parameter must be a valid string"
    );
  }

  try {
    const repoInfo: RepoInfo = await validateSource(source);
    const validDestination: string = await prepareDestination(
      destination,
      options.create
    );

    const syncSpinner = spinner("Downloading repository...");
    syncSpinner.start();
    try {
      await downloadCode(repoInfo, validDestination);
      syncSpinner.text = "Tracking sync information...";
      await trackSync(source, repoInfo, validDestination);
      syncSpinner.succeed("Pull completed successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      syncSpinner.fail(`Pull failed: ${errorMessage}`);
      throw error;
    }

    logger.success("Pull completed successfully");
  } catch (error: any) {
    logger.error(`Pull failed: ${error.message}`);
    throw error;
  }
}
