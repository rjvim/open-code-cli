// src/__tests__/init.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSourceRepoConfig, createSourceRepoConfig } from "../utils/config";
import { runInit } from "../commands/init";
import fs from "fs-extra";
import path from "path";

// Mock dependencies
vi.mock("fs-extra");
vi.mock("../utils/git", () => ({
  cloneRepository: vi.fn().mockResolvedValue({ dir: "/tmp/repo-clone" }),
  initRepositoryIfNeeded: vi.fn().mockResolvedValue({}),
}));
vi.mock("../utils/config", () => ({
  getSourceRepoConfig: vi.fn(),
  createSourceRepoConfig: vi.fn().mockResolvedValue(undefined),
  createLocalTracking: vi.fn().mockResolvedValue({}),
}));
vi.mock("prompts", () => ({
  default: vi
    .fn()
    .mockResolvedValue({
      repo: "https://github.com/test/repo.git",
      dir: "./components",
    }),
}));

describe("init command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mock("process", () => ({
      exit: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize a new project with default settings", async () => {
    // Mock filesystem
    vi.mocked(fs.pathExists).mockResolvedValueOnce(true);
    vi.mocked(fs.readdir).mockResolvedValueOnce(["button", "card"]);

    vi.mocked(getSourceRepoConfig).mockResolvedValueOnce(null);

    await runInit({
      cwd: "/test",
      repo: "https://github.com/test/repo.git",
      componentDir: "./components",
    });

    expect(createSourceRepoConfig).toHaveBeenCalledWith(
      "/test",
      expect.objectContaining({
        repositories: expect.arrayContaining([
          expect.objectContaining({
            name: "repo",
            url: "https://github.com/test/repo.git",
          }),
        ]),
      })
    );
  });
});
