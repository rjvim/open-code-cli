import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";
import { OpenCodeError } from "./custom-error";
import {
  DESTINATION_PATH_MISSING,
  DESTINATION_NOT_DIRECTORY,
  DESTINATION_NOT_EMPTY,
  INVALID_DESTINATION_PARAMETER,
} from "./errors";

export async function prepareDestination(
  destination: string,
  createIfMissing: boolean = true,
  allowNonEmpty: boolean = true // Default to true to maintain backward compatibility
): Promise<string> {
  // Validate input parameter
  if (!destination || typeof destination !== "string") {
    throw new OpenCodeError(
      INVALID_DESTINATION_PARAMETER,
      "Destination must be a valid string"
    );
  }

  destination = path.resolve(destination);

  if (!fs.existsSync(destination)) {
    if (createIfMissing) {
      logger.info(`Creating directory: ${destination}`);
      fs.ensureDirSync(destination);
    } else {
      throw new OpenCodeError(
        DESTINATION_PATH_MISSING,
        `Destination path does not exist: ${destination}`
      );
    }
  } else {
    const stats = fs.statSync(destination);
    if (!stats.isDirectory()) {
      throw new OpenCodeError(
        DESTINATION_NOT_DIRECTORY,
        `Destination path is not a directory: ${destination}`
      );
    }

    // Only check emptiness if explicitly required
    if (!allowNonEmpty) {
      const contents = fs.readdirSync(destination);
      if (contents.length > 0) {
        throw new OpenCodeError(
          DESTINATION_NOT_EMPTY,
          `Destination directory is not empty: ${destination}`
        );
      }
    }
  }

  logger.info(`Destination prepared: ${destination}`);

  return destination;
}
