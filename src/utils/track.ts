import fs from "fs-extra";
import path from "path";
import { RepoInfo, SyncConfig } from "../types";
import { logger } from "./logger";

export async function trackSync(
  source: string,
  repoInfo: RepoInfo,
  destination: string
): Promise<void> {
  logger.info(`Tracking sync information for ${repoInfo.name}`);

  const configPath = path.join(destination, ".open-code.json");
  const now = new Date().toISOString();

  let config: SyncConfig;

  if (fs.existsSync(configPath)) {
    config = fs.readJsonSync(configPath) as SyncConfig;
    config.lastSynced = now;
  } else {
    config = {
      source,
      repository: repoInfo,
      lastSynced: now,
      version: "1.0.0",
    };
  }

  fs.writeJsonSync(configPath, config, { spaces: 2 });
}
