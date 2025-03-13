import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import { prepareDestination } from "../../src/utils/destination";
import {
  DESTINATION_PATH_MISSING,
  DESTINATION_NOT_DIRECTORY,
} from "../../src/utils/errors";

vi.mock("fs-extra", () => ({
  default: {
    existsSync: vi.fn(),
    ensureDirSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(), // Add this mock
  },
}));

import fs from "fs-extra";

describe("prepareDestination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readdirSync).mockReturnValue([]); // Mock empty directory
  });

  it("creates directory if missing and createIfMissing is true", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(prepareDestination("/new/path", true)).resolves.toEqual(
      path.resolve("/new/path")
    );
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.resolve("/new/path"));
  });

  it("throws DESTINATION_PATH_MISSING when path missing and createIfMissing false", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(prepareDestination("/new/path", false)).rejects.toThrow(
      expect.objectContaining({
        code: DESTINATION_PATH_MISSING,
      })
    );
  });

  it("returns existing directory path", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);

    await expect(prepareDestination("/existing/path")).resolves.toEqual(
      path.resolve("/existing/path")
    );
  });

  it("throws DESTINATION_NOT_DIRECTORY for non-directory path", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);

    await expect(prepareDestination("/invalid/file.txt")).rejects.toThrow(
      expect.objectContaining({
        code: DESTINATION_NOT_DIRECTORY,
      })
    );
  });
});
