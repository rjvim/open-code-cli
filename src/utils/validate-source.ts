import { getRepoInfo } from "./repo";
import { logger } from "./logger";
import { OpenCodeError } from "./custom-error";
import {
  INVALID_GITHUB_URL,
  GITHUB_URL_PARSE_ERROR,
  NON_GITHUB_URL,
} from "./errors";

export async function validateSource(source: string) {
  logger.info("Validating source...");

  if (!source || source.trim() === "") {
    throw new OpenCodeError(INVALID_GITHUB_URL, "GitHub URL cannot be empty");
  }

  try {
    const url = new URL(source);

    if (url.protocol !== "https:") {
      throw new OpenCodeError(
        INVALID_GITHUB_URL,
        "GitHub URL must use HTTPS protocol"
      );
    }

    if (url.hostname !== "github.com") {
      throw new OpenCodeError(
        NON_GITHUB_URL,
        "Invalid GitHub URL: Only GitHub repositories are supported"
      );
    }

    const repoInfo = await getRepoInfo(url);
    if (!repoInfo) {
      throw new OpenCodeError(
        GITHUB_URL_PARSE_ERROR,
        "Invalid GitHub URL: Unable to parse repository information"
      );
    }

    logger.info(
      `Valid GitHub repository: ${repoInfo.username}/${repoInfo.name}`
    );

    return repoInfo;
  } catch (error) {
    if (error instanceof OpenCodeError) {
      throw error;
    }
    throw new OpenCodeError(
      INVALID_GITHUB_URL,
      `Invalid GitHub URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
