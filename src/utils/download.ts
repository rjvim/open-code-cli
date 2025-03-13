import { downloadAndExtractRepo } from "./repo";
import { logger } from "./logger";
import { RepoInfo } from "../types";
import { OpenCodeError } from "./custom-error";
import { DOWNLOAD_FAILED } from "./errors";

export async function downloadCode(
  repoInfo: RepoInfo,
  destination: string
): Promise<void> {
  try {
    await downloadAndExtractRepo(destination, repoInfo);
    logger.success(
      `Successfully downloaded ${repoInfo.name} to ${destination}`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to download repository: ${errorMessage}`);
    throw new OpenCodeError(
      DOWNLOAD_FAILED,
      `Failed to download repository: ${errorMessage}`
    );
  }
}
