// src/commands/sync.ts

import { Command } from "commander";
import { logger } from "../utils/logger";
import { prepareDestination } from "../utils/destination";
import { validateSource } from "../utils/validate-source";
import { downloadCode } from "../utils/download";
import { trackSync } from "../utils/track";

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

  try {
    const repoInfo = await validateSource(source);
    const validDestination = await prepareDestination(
      destination,
      options.create
    );

    await downloadCode(repoInfo, validDestination);
    await trackSync(source, repoInfo, validDestination);

    logger.success("Sync completed successfully");
  } catch (error: any) {
    logger.error(`Sync failed: ${error.message}`);
    throw error;
  }
}
