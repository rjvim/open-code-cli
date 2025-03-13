import { downloadAndExtractRepo } from "./repo";
import { logger } from "./logger";
import { RepoInfo } from "../types";
import { OpenCodeError } from "./custom-error";
import { DOWNLOAD_FAILED } from "./errors";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Downloads a single file from a GitHub repository
 * @param repoInfo Repository information
 * @param destination Destination directory
 */
async function downloadSingleFile(
  repoInfo: RepoInfo,
  destination: string
): Promise<void> {
  // Construct the raw file URL
  const rawFileUrl = `https://raw.githubusercontent.com/${repoInfo.username}/${repoInfo.name}/${repoInfo.branch}/${repoInfo.filePath}`;
  
  logger.info(`Downloading single file from ${rawFileUrl}`);
  
  // Download the file
  const response = await fetch(rawFileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  const fileContent = await response.text();
  
  // Create destination directory if it doesn't exist
  await fs.mkdir(destination, { recursive: true });
  
  // Write the file to the destination
  const fileName = path.basename(repoInfo.filePath);
  const destinationPath = path.join(destination, fileName);
  await fs.writeFile(destinationPath, fileContent);
  
  logger.success(`Successfully downloaded ${fileName} to ${destination}`);
}

export async function downloadCode(
  repoInfo: RepoInfo,
  destination: string
): Promise<void> {
  try {
    // Check if the URL was a blob URL (pointing to a single file)
    // This is determined by checking if filePath exists and is not empty
    if (repoInfo.filePath && repoInfo.filePath.length > 0) {
      await downloadSingleFile(repoInfo, destination);
      return;
    }
    
    // If not a single file, download the entire repository
    await downloadAndExtractRepo(destination, repoInfo);
    logger.success(
      `Successfully downloaded ${repoInfo.name} to ${destination}`
    );
  } catch (error) {
    throw new OpenCodeError(
      DOWNLOAD_FAILED,
      `Failed to download code: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
