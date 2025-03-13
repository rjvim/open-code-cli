// tests/commands/sync.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { sync } from "../../src/commands/sync";
import { downloadCode } from "../../src/utils/download";
import { trackSync } from "../../src/utils/track";
import { prepareDestination } from "../../src/utils/destination";
import { getRepoInfo } from "../../src/utils/repo";
import { logger } from "../../src/utils/logger";

vi.mock("../../src/utils/download");
vi.mock("../../src/utils/track");
vi.mock("../../src/utils/destination");
vi.mock("../../src/utils/repo");
vi.mock("../../src/utils/logger");

describe("sync command", () => {
  const mockSource = "https://github.com/test-user/test-repo";
  const mockDest = "/test/path";
  const mockRepoInfo = {
    username: "test-user",
    name: "test-repo",
    branch: "main",
    filePath: "components/test",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRepoInfo).mockResolvedValue(mockRepoInfo);
    vi.mocked(prepareDestination).mockResolvedValue(mockDest);
  });

  it("successfully syncs repository", async () => {
    await sync(mockSource, mockDest, {});

    expect(downloadCode).toHaveBeenCalledWith(mockRepoInfo, mockDest);
    expect(trackSync).toHaveBeenCalledWith(mockSource, mockRepoInfo, mockDest);
    expect(logger.success).toHaveBeenCalled();
  });

  it("handles errors during sync", async () => {
    const error = new Error("Sync failed");
    vi.mocked(downloadCode).mockRejectedValue(error);

    await expect(sync(mockSource, mockDest, {})).rejects.toThrow("Sync failed");
    expect(logger.error).toHaveBeenCalledWith("Sync failed: Sync failed");
  });
});
