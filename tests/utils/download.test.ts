import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCode } from "../../src/utils/download";
import { downloadAndExtractRepo } from "../../src/utils/repo";
import { logger } from "../../src/utils/logger";
import { OpenCodeError } from "../../src/utils/custom-error";

// Mock dependencies
vi.mock("../../src/utils/repo");
vi.mock("../../src/utils/logger");
vi.mock("node:fs", () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe("downloadCode", () => {
  const mockRepoInfo = {
    username: "test-user",
    name: "test-repo",
    branch: "main",
    filePath: "", // Empty filePath to test repo download
  };

  const destination = "/test/path";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(downloadAndExtractRepo).mockResolvedValue(undefined);
  });

  it("successfully downloads and extracts repo", async () => {
    await downloadCode(mockRepoInfo, destination);

    expect(downloadAndExtractRepo).toHaveBeenCalledWith(
      destination,
      mockRepoInfo
    );
    expect(logger.success).toHaveBeenCalled();
  });

  it("handles download failure", async () => {
    vi.mocked(downloadAndExtractRepo).mockRejectedValue(
      new Error("Download failed")
    );

    await expect(downloadCode(mockRepoInfo, destination)).rejects.toThrow(
      "Failed to download code: Download failed"
    );
    
    // The actual implementation doesn't call logger.error before throwing
    // So we don't need to check for it
  });
});
