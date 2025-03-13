// tests/commands/pull.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { pull } from "../../src/commands/pull";
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

describe("pull command", () => {
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

  it("successfully pulls repository", async () => {
    await pull(mockSource, mockDest, {});

    expect(downloadCode).toHaveBeenCalledWith(mockRepoInfo, mockDest);
    expect(trackSync).toHaveBeenCalledWith(mockSource, mockRepoInfo, mockDest);
    expect(logger.success).toHaveBeenCalled();
  });

  it("handles errors during pull", async () => {
    const error = new Error("Pull failed");
    vi.mocked(downloadCode).mockRejectedValue(error);

    await expect(pull(mockSource, mockDest, {})).rejects.toThrow("Pull failed");
    expect(logger.error).toHaveBeenCalledWith("Pull failed: Pull failed");
  });
});
