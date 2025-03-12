import { z } from "zod";

/**
 * Schema for the source repo configuration file (.open-code.json)
 */
export const sourceRepoConfigSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  repositories: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      branch: z.string().default("main"),
      components: z.array(
        z.object({
          name: z.string(),
          path: z.string(),
          description: z.string().optional(),
          dependencies: z.array(z.string()).optional(),
        })
      ),
    })
  ),
  componentDirectories: z
    .object({
      base: z.string().default("./components"),
      // Optional custom directories for specific component types
      ui: z.string().optional(),
      lib: z.string().optional(),
      utils: z.string().optional(),
    })
    .optional(),
});

export type SourceRepoConfig = z.infer<typeof sourceRepoConfigSchema>;

/**
 * Schema for the local tracking file (.open-code.local.json)
 */
export const localTrackingSchema = z.object({
  $schema: z.string().optional(),
  lastSync: z.string().optional(), // ISO date string
  components: z.array(
    z.object({
      name: z.string(),
      repositoryName: z.string(),
      version: z.string(), // Git commit hash
      path: z.string(), // Local path where component is stored
      originalPath: z.string(), // Original path in the source repo
      lastSynced: z.string(), // ISO date string
      customized: z.boolean().default(false),
    })
  ),
});

export type LocalTracking = z.infer<typeof localTrackingSchema>;

/**
 * Schema for init command options
 */
export const initOptionsSchema = z.object({
  cwd: z.string(),
  repo: z.string().url().optional(),
  force: z.boolean().default(false),
  componentDir: z.string().optional(),
});

export type InitOptions = z.infer<typeof initOptionsSchema>;

/**
 * Schema for sync command options
 */
export const syncOptionsSchema = z.object({
  cwd: z.string(),
  components: z.array(z.string()).optional(),
  repo: z.string().optional(),
  force: z.boolean().default(false),
});

export type SyncOptions = z.infer<typeof syncOptionsSchema>;

/**
 * Schema for detect-changes command options
 */
export const detectChangesOptionsSchema = z.object({
  cwd: z.string(),
  components: z.array(z.string()).optional(),
});

export type DetectChangesOptions = z.infer<typeof detectChangesOptionsSchema>;

/**
 * Schema for contribute command options
 */
export const contributeOptionsSchema = z.object({
  cwd: z.string(),
  components: z.array(z.string()).optional(),
  message: z.string().optional(),
  skipAuth: z.boolean().default(false),
});

export type ContributeOptions = z.infer<typeof contributeOptionsSchema>;

/**
 * Schema for add-repo command options
 */
export const addRepoOptionsSchema = z.object({
  cwd: z.string(),
  name: z.string(),
  url: z.string().url(),
  branch: z.string().default("main"),
});

export type AddRepoOptions = z.infer<typeof addRepoOptionsSchema>;

/**
 * Component interface used throughout the application
 */
export interface Component {
  name: string;
  path: string;
  repositoryName: string;
  version?: string;
  dependencies?: string[];
  description?: string;
}

/**
 * Change detection result interface
 */
export interface ChangeDetectionResult {
  component: Component;
  hasChanges: boolean;
  changes?: {
    filePath: string;
    additions: number;
    deletions: number;
    diff: string;
  }[];
}