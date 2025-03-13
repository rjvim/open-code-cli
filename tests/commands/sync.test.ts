// tests/commands/sync.test.ts

import { describe, it, expect, vi } from "vitest";
import { validateSource } from "../../src/commands/sync";

describe("sync command", () => {
  describe("validateSource", () => {
    it("validates correct GitHub URL format", async () => {
      const validUrl =
        "https://github.com/vercel/examples/tree/main/solutions/blog";
      await expect(validateSource(validUrl)).resolves.toEqual({
        username: "vercel",
        name: "examples",
        branch: "main",
        filePath: "solutions/blog",
      });
    });

    it("throws error for invalid GitHub URL", async () => {
      const invalidUrl = "https://invalid-url.com";
      await expect(validateSource(invalidUrl)).rejects.toThrow(
        "Invalid GitHub URL"
      );
    });
  });
});
