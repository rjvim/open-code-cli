// src/commands/sync.ts

import { Command } from "commander";
import { getRepoInfo, downloadAndExtractRepo } from "../utils/repo";
import { logger } from "../utils/logger";
import fs from "fs-extra";
import path from "path";
import { prepareDestination } from "../utils/destination";
import { validateSource } from "../utils/validate-source";

interface SyncConfig {
  source: string;
  repository: {
    username: string;
    name: string;
    branch: string;
    filepath: string;
  };
  lastSynced: string;
  version: string;
}

export async function registerSyncCommand(program: Command) {
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

async function sync(
  source: string,
  destination: string,
  options: { create?: boolean }
) {
  logger.info("Starting sync...");
  logger.info(`Source: ${source}`);
  logger.info(`Destination: ${destination}`);

  try {
    // Validate source
    const repoInfo = await validateSource(source);

    // Prepare destination (includes validation)
    const validDestination = await prepareDestination(
      destination,
      options.create
    );

    // Download code
    await downloadCode(repoInfo, validDestination);

    // Track sync
    await trackSync(source, repoInfo, validDestination);

    logger.success("Sync completed successfully");
  } catch (error: any) {
    logger.error(`Sync failed: ${error.message}`);
  }
}

async function downloadCode(repoInfo: any, destination: string) {
  logger.info("Downloading code...");
  // Implementation to be added
}

async function trackSync(source: string, repoInfo: any, destination: string) {
  logger.info("Tracking sync...");
  // Implementation to be added
}
