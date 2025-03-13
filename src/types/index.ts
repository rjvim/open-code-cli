// src/types/index.ts

/**
 * Core configuration for the open-code project
 */
export interface OpenCodeConfig {
  /** Version of the configuration format */
  version: string;
  /** Directory where components are stored */
  componentDir: string;
  /** List of tracked repositories */
  repositories: Repository[];
}

/**
 * Repository information for tracking
 */
export interface Repository {
  /** Name of the repository (for reference) */
  name: string;
  /** URL to the GitHub repository */
  url: string;
  /** Branch to sync from */
  branch: string;
  /** Optional file path within repository to sync from */
  filePath?: string;
}

/**
 * Information about a specific GitHub repository
 * Used when interacting with GitHub API
 */
export interface RepoInfo {
  /** GitHub username/organization */
  username: string;
  /** Repository name */
  name: string;
  /** Branch name */
  branch: string;
  /** File path within the repository */
  filePath: string;
}

/**
 * Sync tracking information stored in .open-code.json
 */
export interface SyncConfig {
  /** Source repository URL */
  source: string;
  /** Repository information */
  repository: RepoInfo;
  /** ISO timestamp of last sync */
  lastSynced: string;
  /** Configuration version */
  version: string;
}

/**
 * Options for the pull command
 */
export interface SyncOptions {
  /** Create destination directory if it doesn't exist */
  create?: boolean;
}

/**
 * Options for the init command
 */
export interface InitOptions {
  /** Directory where components will be stored */
  componentDir?: string;
}

/**
 * Options for command execution context
 */
export interface CommandOptions {
  /** Whether to run silently (no output) */
  silent?: boolean;
}
