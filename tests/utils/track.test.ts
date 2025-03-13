// tests/utils/track.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackSync } from "../../src/utils/track";
import fs from "fs-extra";
import path from "path";

vi.mock("fs-extra");

describe("trackSync", () => {
  const mockRepoInfo = {
    username: "test-user",
    name: "test-repo",
    branch: "main",
    filePath: "components/test",
  };

  const mockPath = "/test/path";
  const mockSource = "https://github.com/test-user/test-repo";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates new sync tracking file if none exists", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await trackSync(mockSource, mockRepoInfo, mockPath);

    expect(fs.writeJsonSync).toHaveBeenCalledWith(
      path.join(mockPath, ".open-code.json"),
      {
        source: mockSource,
        repository: mockRepoInfo,
        lastSynced: expect.any(String),
        version: "1.0.0",
      },
      { spaces: 2 }
    );
  });

  it("updates existing sync tracking file", async () => {
    const existingConfig = {
      source: mockSource,
      repository: mockRepoInfo,
      lastSynced: "2024-01-01",
      version: "1.0.0",
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readJsonSync).mockReturnValue(existingConfig);

    await trackSync(mockSource, mockRepoInfo, mockPath);

    expect(fs.writeJsonSync).toHaveBeenCalledWith(
      path.join(mockPath, ".open-code.json"),
      {
        ...existingConfig,
        lastSynced: expect.any(String),
      },
      { spaces: 2 }
    );
  });
});
