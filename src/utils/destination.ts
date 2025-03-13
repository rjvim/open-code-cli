import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";
import { OpenCodeError } from "./custom-error";
import { DESTINATION_PATH_MISSING, DESTINATION_NOT_DIRECTORY } from "./errors";

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
  }

  logger.info(`Destination prepared: ${destination}`);

  return destination;
}
