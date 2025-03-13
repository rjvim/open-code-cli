import { downloadAndExtractRepo } from "./repo";
import { logger } from "./logger";
import type { RepoInfo } from "./repo";

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
    logger.error(
      `Failed to download repository: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw new Error(
      `Failed to download repository: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
