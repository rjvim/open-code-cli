// tests/utils/destination.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import { prepareDestination } from "../../src/utils/destination";

// Mock fs-extra properly with default export
vi.mock("fs-extra", () => {
  return {
    default: {
      existsSync: vi.fn(),
      ensureDirSync: vi.fn(),
      statSync: vi.fn().mockReturnValue({
        isDirectory: vi.fn(),
      }),
    },
    existsSync: vi.fn(),
    ensureDirSync: vi.fn(),
    statSync: vi.fn().mockReturnValue({
      isDirectory: vi.fn(),
    }),
  };
});

// Import fs after mocking
import fs from "fs-extra";

describe("prepareDestination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates directory if it doesn't exist and createIfMissing is true", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(prepareDestination("/new/path", true)).resolves.toEqual(
      path.resolve("/new/path")
    );
    expect(fs.ensureDirSync).toHaveBeenCalledWith(path.resolve("/new/path"));
  });

  it("throws error if path doesn't exist and createIfMissing is false", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(prepareDestination("/new/path", false)).rejects.toThrow(
      "Destination path does not exist"
    );
  });

  it("returns existing directory path", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);

    await expect(prepareDestination("/existing/path")).resolves.toEqual(
      path.resolve("/existing/path")
    );
  });

  it("throws error for existing path that is not a directory", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);

    await expect(prepareDestination("/invalid/file.txt")).rejects.toThrow(
      "Destination path is not a directory"
    );
  });
});
