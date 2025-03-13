import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCode } from "../../src/utils/download";
import { downloadAndExtractRepo } from "../../src/utils/repo";
import { logger } from "../../src/utils/logger";

// Mock dependencies
vi.mock("../../src/utils/repo");
vi.mock("../../src/utils/logger");

describe("downloadCode", () => {
  const mockRepoInfo = {
    username: "test-user",
    name: "test-repo",
    branch: "main",
    filePath: "components/test",
  };

  const destination = "/test/path";

  beforeEach(() => {
    vi.clearAllMocks();
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
      "Failed to download repository: Download failed"
    );

    expect(logger.error).toHaveBeenCalled();
  });
});
