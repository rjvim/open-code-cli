import path from "path";
import os from "os";
import fs from "fs-extra";
import simpleGit, { SimpleGit } from "simple-git";
import { execa } from "execa";
import { Component } from "./schema";

// Create a temporary directory for cloning repos
export async function createTempDir(prefix = "open-code-"): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

// Clone a repository to a temporary directory
export async function cloneRepository(
  repoUrl: string,
  branch = "main"
): Promise<{ git: SimpleGit; dir: string }> {
  const tempDir = await createTempDir();
  const git = simpleGit();

  await git.clone(repoUrl, tempDir, ["--depth", "1", "--branch", branch]);

  return {
    git: simpleGit(tempDir),
    dir: tempDir,
  };
}

// Get the current commit hash of a repository
export async function getCurrentCommitHash(repoPath: string): Promise<string> {
  const git = simpleGit(repoPath);
  const log = await git.log({ maxCount: 1 });

  if (!log.latest) {
    throw new Error("Failed to get current commit hash");
  }

  return log.latest.hash;
}

// Check if a directory is a git repository
export async function isGitRepository(dir: string): Promise<boolean> {
  try {
    const git = simpleGit(dir);
    await git.revparse(["--is-inside-work-tree"]);
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize a git repository if it doesn't exist
export async function initRepositoryIfNeeded(dir: string): Promise<SimpleGit> {
  const isRepo = await isGitRepository(dir);

  if (!isRepo) {
    const git = simpleGit(dir);
    await git.init();
    return git;
  }

  return simpleGit(dir);
}

// Create a GitHub fork of a repository
export async function createGitHubFork(
  repoUrl: string,
  token: string
): Promise<string> {
  // Extract owner and repo from URL
  const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (!urlMatch) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const [, owner, repo] = urlMatch;

  // Use GitHub API to create a fork
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/forks`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create fork: ${await response.text()}`);
  }

  const data = await response.json();
  return data.html_url;
}

// Check if local component has changes compared to its source
export async function hasComponentChanges(
  component: Component,
  sourceRepoDir: string,
  localComponentDir: string
): Promise<boolean> {
  const sourcePath = path.join(sourceRepoDir, component.path);
  const localPath = path.join(localComponentDir, component.path);

  // Check if local component exists
  if (!(await fs.pathExists(localPath))) {
    return false;
  }

  // Compare directories recursively
  const sourceFiles = await fs.readdir(sourcePath);
  const localFiles = await fs.readdir(localPath);

  if (sourceFiles.length !== localFiles.length) {
    return true;
  }

  for (const file of sourceFiles) {
    const sourceFilePath = path.join(sourcePath, file);
    const localFilePath = path.join(localPath, file);

    if (!(await fs.pathExists(localFilePath))) {
      return true;
    }

    const sourceStats = await fs.stat(sourceFilePath);
    const localStats = await fs.stat(localFilePath);

    if (sourceStats.isDirectory() && localStats.isDirectory()) {
      const hasChanges = await hasComponentChanges(
        { ...component, path: path.join(component.path, file) },
        sourceRepoDir,
        localComponentDir
      );

      if (hasChanges) {
        return true;
      }
    } else if (sourceStats.isFile() && localStats.isFile()) {
      const sourceContent = await fs.readFile(sourceFilePath, "utf8");
      const localContent = await fs.readFile(localFilePath, "utf8");

      if (sourceContent !== localContent) {
        return true;
      }
    } else {
      // One is a file, the other is a directory
      return true;
    }
  }

  return false;
}

// Create a GitHub pull request
export async function createPullRequest(
  sourceRepoUrl: string,
  forkRepoUrl: string,
  token: string,
  title: string,
  body: string,
  branch: string
): Promise<string> {
  // Extract owner and repo from URLs
  const sourceUrlMatch = sourceRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  const forkUrlMatch = forkRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (!sourceUrlMatch || !forkUrlMatch) {
    throw new Error("Invalid GitHub URLs");
  }

  const [, sourceOwner, sourceRepo] = sourceUrlMatch;
  const [, forkOwner] = forkUrlMatch;

  // Create pull request
  const response = await fetch(
    `https://api.github.com/repos/${sourceOwner}/${sourceRepo}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        head: `${forkOwner}:${branch}`,
        base: "main",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create pull request: ${await response.text()}`);
  }

  const data = await response.json();
  return data.html_url;
}

// Push changes to a repository
export async function pushChanges(
  repoDir: string,
  branch: string,
  message: string
): Promise<void> {
  const git = simpleGit(repoDir);

  await git.add(".");
  await git.commit(message);
  await git.push("origin", branch, ["--set-upstream"]);
}

// Check if user has GitHub CLI installed and is authenticated
export async function isGitHubCliAuthenticated(): Promise<boolean> {
  try {
    await execa("gh", ["auth", "status"]);
    return true;
  } catch (error) {
    return false;
  }
}

// Authenticate with GitHub using GitHub CLI
export async function authenticateWithGitHubCli(): Promise<string> {
  try {
    const { stdout } = await execa("gh", ["auth", "token"]);
    return stdout.trim();
  } catch (error) {
    throw new Error("Failed to authenticate with GitHub CLI");
  }
}

// Create a new branch
export async function createBranch(
  repoDir: string,
  branchName: string
): Promise<void> {
  const git = simpleGit(repoDir);

  await git.checkoutLocalBranch(branchName);
}
