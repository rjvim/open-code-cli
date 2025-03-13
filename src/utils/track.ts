// src/utils/track.ts
import fs from "fs-extra";
import path from "path";
import type { RepoInfo } from "./repo";

interface SyncConfig {
  source: string;
  repository: RepoInfo;
  lastSynced: string;
  version: string;
}

export async function trackSync(
  source: string,
  repoInfo: RepoInfo,
  destination: string
): Promise<void> {
  const configPath = path.join(destination, ".open-code.json");
  const now = new Date().toISOString();

  let config: SyncConfig;

  if (fs.existsSync(configPath)) {
    config = fs.readJsonSync(configPath);
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
