// src/commands/sync.ts

import { Command } from "commander";
import { getRepoInfo, downloadAndExtractRepo } from "../utils/repo";
import { logger } from "../utils/logger";
import fs from "fs-extra";
import path from "path";

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
    .action(sync);
}

async function sync(source: string, destination: string) {
  logger.info("Starting sync...");
  logger.info(`Source: ${source}`);
  logger.info(`Destination: ${destination}`);

  try {
    await validateSource(source);
    await prepareDestination(destination);
    await downloadCode(source, destination);
    await trackSync(source, destination);
    logger.success("Sync completed successfully");
  } catch (error) {
    logger.error("Sync failed:", error);
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

async function prepareDestination(destination: string) {
  logger.info("Preparing destination...");
}

async function downloadCode(source: string, destination: string) {
  logger.info("Downloading code...");
}

async function trackSync(source: string, destination: string) {
  logger.info("Tracking sync...");
}
