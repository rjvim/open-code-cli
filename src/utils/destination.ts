// src/utils/destination.ts

import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";

/**
 * Prepares the destination directory by validating and creating it if needed
 *
 * @param destination Path to prepare
 * @param createIfMissing Whether to create the directory if it doesn't exist
 * @returns Prepared destination path
 * @throws Error if path doesn't exist (and createIfMissing is false) or is not a directory
 */
export async function prepareDestination(
  destination: string,
  createIfMissing: boolean = true
): Promise<string> {
  destination = path.resolve(destination);

  if (!fs.existsSync(destination)) {
    if (createIfMissing) {
      logger.info(`Creating directory: ${destination}`);
      fs.ensureDirSync(destination);
    } else {
      throw new Error(`Destination path does not exist: ${destination}`);
    }
  } else {
    const stats = fs.statSync(destination);
    if (!stats.isDirectory()) {
      throw new Error(`Destination path is not a directory: ${destination}`);
    }
  }

  return destination;
}
