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
        version: "1.0.0",
        files: {
          [mockRepoInfo.filePath]: {
            source: mockSource,
            repository: mockRepoInfo,
            lastSynced: expect.any(String),
          },
        },
      },
      { spaces: 2 }
    );
  });

  it("updates existing sync tracking file with new format", async () => {
    const existingConfig = {
      version: "1.0.0",
      files: {
        "components/existing": {
          source: "https://github.com/test-user/test-repo",
          repository: {
            username: "test-user",
            name: "test-repo",
            branch: "main",
            filePath: "components/existing",
          },
          lastSynced: "2024-01-01",
        },
      },
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readJsonSync).mockReturnValue(existingConfig);

    await trackSync(mockSource, mockRepoInfo, mockPath);

    expect(fs.writeJsonSync).toHaveBeenCalledWith(
      path.join(mockPath, ".open-code.json"),
      {
        version: "1.0.0",
        files: {
          "components/existing": existingConfig.files["components/existing"],
          [mockRepoInfo.filePath]: {
            source: mockSource,
            repository: mockRepoInfo,
            lastSynced: expect.any(String),
          },
        },
      },
      { spaces: 2 }
    );
  });

  it("migrates from old format to new format", async () => {
    const oldFormatConfig = {
      source: "https://github.com/test-user/test-repo",
      repository: {
        username: "test-user",
        name: "test-repo",
        branch: "main",
        filePath: "components/old",
      },
      lastSynced: "2024-01-01",
      version: "1.0.0",
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readJsonSync).mockReturnValue(oldFormatConfig);

    await trackSync(mockSource, mockRepoInfo, mockPath);

    expect(fs.writeJsonSync).toHaveBeenCalledWith(
      path.join(mockPath, ".open-code.json"),
      {
        version: "1.0.0",
        files: {
          "components/old": {
            source: oldFormatConfig.source,
            repository: oldFormatConfig.repository,
            lastSynced: oldFormatConfig.lastSynced,
          },
          [mockRepoInfo.filePath]: {
            source: mockSource,
            repository: mockRepoInfo,
            lastSynced: expect.any(String),
          },
        },
      },
      { spaces: 2 }
    );
  });
});
