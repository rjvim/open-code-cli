import path from "path";
import fs from "fs-extra";
import { cosmiconfig } from "cosmiconfig";
import {
  sourceRepoConfigSchema,
  localTrackingSchema,
  type SourceRepoConfig,
  type LocalTracking,
} from "./schema";

const CONFIG_NAME = "open-code";
const LOCAL_CONFIG_FILENAME = ".open-code.local.json";

// Create a cosmiconfig explorer for finding the source repo config
const explorer = cosmiconfig(CONFIG_NAME, {
  searchPlaces: [
    ".open-code.json",
    ".open-code.yaml",
    ".open-code.yml",
    ".open-code.js",
    ".open-code.cjs",
    "package.json",
  ],
});

/**
 * Get the source repository configuration
 */
export async function getSourceRepoConfig(
  cwd: string
): Promise<SourceRepoConfig | null> {
  try {
    const result = await explorer.search(cwd);

    if (!result) {
      return null;
    }

    return sourceRepoConfigSchema.parse(result.config);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid configuration: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create a new source repository configuration
 */
export async function createSourceRepoConfig(
  cwd: string,
  config: SourceRepoConfig
): Promise<void> {
  const configPath = path.join(cwd, ".open-code.json");

  // Check if config file already exists
  if (await fs.pathExists(configPath)) {
    throw new Error("Configuration file already exists");
  }

  await fs.writeJSON(configPath, config, { spaces: 2 });
}

/**
 * Update the source repository configuration
 */
export async function updateSourceRepoConfig(
  cwd: string,
  updates: Partial<SourceRepoConfig>
): Promise<SourceRepoConfig> {
  const configPath = path.join(cwd, ".open-code.json");

  // Check if config file exists
  if (!(await fs.pathExists(configPath))) {
    throw new Error("Configuration file not found");
  }

  const config = await fs.readJSON(configPath);
  const updatedConfig = { ...config, ...updates };

  // Validate the updated config
  const validatedConfig = sourceRepoConfigSchema.parse(updatedConfig);

  await fs.writeJSON(configPath, validatedConfig, { spaces: 2 });

  return validatedConfig;
}

/**
 * Get the local tracking configuration
 */
export async function getLocalTracking(
  cwd: string
): Promise<LocalTracking | null> {
  const localConfigPath = path.join(cwd, LOCAL_CONFIG_FILENAME);

  if (!(await fs.pathExists(localConfigPath))) {
    return null;
  }

  try {
    const config = await fs.readJSON(localConfigPath);
    return localTrackingSchema.parse(config);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid local configuration: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create a new local tracking configuration
 */
export async function createLocalTracking(cwd: string): Promise<LocalTracking> {
  const localConfigPath = path.join(cwd, LOCAL_CONFIG_FILENAME);

  const defaultConfig: LocalTracking = {
    lastSync: new Date().toISOString(),
    components: [],
  };

  await fs.writeJSON(localConfigPath, defaultConfig, { spaces: 2 });

  return defaultConfig;
}

/**
 * Update the local tracking configuration
 */
export async function updateLocalTracking(
  cwd: string,
  updates: Partial<LocalTracking>
): Promise<LocalTracking> {
  const localConfigPath = path.join(cwd, LOCAL_CONFIG_FILENAME);

  let currentConfig: LocalTracking;

  if (await fs.pathExists(localConfigPath)) {
    currentConfig = await fs.readJSON(localConfigPath);
  } else {
    currentConfig = {
      lastSync: new Date().toISOString(),
      components: [],
    };
  }

  const updatedConfig = {
    ...currentConfig,
    ...updates,
    lastSync: new Date().toISOString(),
  };

  // Validate the updated config
  const validatedConfig = localTrackingSchema.parse(updatedConfig);

  await fs.writeJSON(localConfigPath, validatedConfig, { spaces: 2 });

  return validatedConfig;
}

/**
 * Add a component to local tracking
 */
export async function addComponentToTracking(
  cwd: string,
  component: LocalTracking["components"][0]
): Promise<LocalTracking> {
  const tracking =
    (await getLocalTracking(cwd)) || (await createLocalTracking(cwd));

  const existingIndex = tracking.components.findIndex(
    (c) =>
      c.name === component.name && c.repositoryName === component.repositoryName
  );

  if (existingIndex !== -1) {
    // Update existing component
    tracking.components[existingIndex] = {
      ...tracking.components[existingIndex],
      ...component,
      lastSynced: new Date().toISOString(),
    };
  } else {
    // Add new component
    tracking.components.push({
      ...component,
      lastSynced: new Date().toISOString(),
    });
  }

  return updateLocalTracking(cwd, tracking);
}

/**
 * Find a component in local tracking
 */
export async function findTrackedComponent(
  cwd: string,
  name: string,
  repositoryName?: string
): Promise<LocalTracking["components"][0] | null> {
  const tracking = await getLocalTracking(cwd);

  if (!tracking) {
    return null;
  }

  const component = tracking.components.find((c) => {
    if (repositoryName) {
      return c.name === name && c.repositoryName === repositoryName;
    }
    return c.name === name;
  });

  return component || null;
}

/**
 * Mark a component as customized in local tracking
 */
export async function markComponentAsCustomized(
  cwd: string,
  name: string,
  repositoryName: string
): Promise<void> {
  const tracking = await getLocalTracking(cwd);

  if (!tracking) {
    throw new Error("Local tracking not found");
  }

  const component = tracking.components.find(
    (c) => c.name === name && c.repositoryName === repositoryName
  );

  if (!component) {
    throw new Error(`Component ${name} not found in tracking`);
  }

  component.customized = true;

  await updateLocalTracking(cwd, tracking);
}
