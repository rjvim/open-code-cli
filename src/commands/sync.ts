// src/commands/sync.ts

import { Command } from "commander";
import { getRepoInfo, downloadAndExtractRepo } from "../utils/repo";
import { logger } from "../utils/logger";
import fs from "fs-extra";
import path from "path";
import { prepareDestination } from "../utils/destination";

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

export async function validateSource(source: string) {
  logger.info("Validating source...");

  try {
    const url = new URL(source);

    // Check if URL is a GitHub repository
    if (url.hostname !== "github.com") {
      throw new Error(
        "Invalid GitHub URL: Only GitHub repositories are supported"
      );
    }

    const repoInfo = await getRepoInfo(url);
    if (!repoInfo) {
      throw new Error(
        "Invalid GitHub URL: Unable to parse repository information"
      );
    }

    return repoInfo;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid GitHub URL: ${error.message}`);
    }
    throw new Error("Invalid GitHub URL");
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
