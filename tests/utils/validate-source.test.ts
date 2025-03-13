import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateSource } from "../../src/utils/validate-source";
import { getRepoInfo } from "../../src/utils/repo";
import {
  INVALID_GITHUB_URL,
  GITHUB_URL_PARSE_ERROR,
  NON_GITHUB_URL,
} from "../../src/utils/errors";
import { OpenCodeError } from "../../src/utils/custom-error";

vi.mock("../../src/utils/repo", () => ({
  getRepoInfo: vi.fn(),
}));

describe("validateSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates correct GitHub URL format", async () => {
    const validUrl =
      "https://github.com/vercel/examples/tree/main/solutions/blog";
    const mockRepoInfo = {
      username: "vercel",
      name: "examples",
      branch: "main",
      filePath: "solutions/blog",
    };

    vi.mocked(getRepoInfo).mockResolvedValue(mockRepoInfo);
    await expect(validateSource(validUrl)).resolves.toEqual(mockRepoInfo);
  });

  it("throws NON_GITHUB_URL error for non-GitHub URL", async () => {
    const invalidUrl = "https://gitlab.com/user/repo";
    await expect(validateSource(invalidUrl)).rejects.toThrow(
      expect.objectContaining({
        code: NON_GITHUB_URL,
      })
    );
  });

  it("throws GITHUB_URL_PARSE_ERROR when getRepoInfo returns undefined", async () => {
    const validUrl = "https://github.com/user/repo";
    vi.mocked(getRepoInfo).mockResolvedValue(undefined);

    await expect(validateSource(validUrl)).rejects.toThrow(
      expect.objectContaining({
        code: GITHUB_URL_PARSE_ERROR,
      })
    );
  });

  it("throws INVALID_GITHUB_URL for malformed URL", async () => {
    const invalidUrl = "not-a-url";
    await expect(validateSource(invalidUrl)).rejects.toThrow(
      expect.objectContaining({
        code: INVALID_GITHUB_URL,
      })
    );
  });
});
