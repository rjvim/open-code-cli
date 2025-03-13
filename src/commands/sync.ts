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

export async function registerSyncCommand(program: Command): Promise<void> {
  program
    .command("sync")
    .description("Sync code from a GitHub repository")
    .argument("<source>", "GitHub repository URL")
    .argument("<destination>", "Local destination path")
    .option(
      "-c, --create",
      "Create destination directory if it doesn't exist",
      false
    )
    .action(sync);
}

export async function sync(
  source: string,
  destination: string,
  options: SyncOptions
): Promise<void> {
  logger.info("Starting sync...");

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
      syncSpinner.succeed("Sync completed successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      syncSpinner.fail(`Sync failed: ${errorMessage}`);
      throw error;
    }

    logger.success("Sync completed successfully");
  } catch (error: any) {
    logger.error(`Sync failed: ${error.message}`);
    throw error;
  }
}
