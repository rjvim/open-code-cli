import fs from "fs-extra";
import path from "path";
import { RepoInfo, SyncConfig, TrackedFile } from "../types";
import { logger } from "./logger";

export async function trackSync(
  source: string,
  repoInfo: RepoInfo,
  destination: string
): Promise<void> {
  logger.info(`Tracking sync information for ${repoInfo.name}`);

  const configPath = path.join(destination, ".open-code.json");
  const now = new Date().toISOString();
  
  // Create a key for the tracked file based on its path
  const fileKey = repoInfo.filePath;
  
  // Create tracked file entry
  const trackedFile: TrackedFile = {
    source,
    repository: repoInfo,
    lastSynced: now
  };

  let config: SyncConfig;

  if (fs.existsSync(configPath)) {
    // Load existing config
    config = fs.readJsonSync(configPath) as SyncConfig;
    
    // If the config is in the old format, migrate it
    if (!config.files) {
      const oldConfig = config as any;
      config = {
        version: oldConfig.version || "1.0.0",
        files: {}
      };
      
      // If the old config had a repository, add it as a tracked file
      if (oldConfig.repository) {
        const oldFileKey = oldConfig.repository.filePath;
        config.files[oldFileKey] = {
          source: oldConfig.source,
          repository: oldConfig.repository,
          lastSynced: oldConfig.lastSynced
        };
      }
    }
    
    // Add or update the current file
    config.files[fileKey] = trackedFile;
  } else {
    // Create new config with the current file
    config = {
      version: "1.0.0",
      files: {
        [fileKey]: trackedFile
      }
    };
  }

  fs.writeJsonSync(configPath, config, { spaces: 2 });
  logger.success(`Updated tracking information for ${path.basename(fileKey)}`);
}
