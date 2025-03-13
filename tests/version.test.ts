import { describe, it, expect } from "vitest";
import { execa } from "execa";
import packageJson from "../package.json";

describe("Version command", () => {
  it("shows help documentation when run without arguments", async () => {
    try {
      await execa("node", ["./dist/index.js"]);
    } catch (error: any) {
      // Expect error with exit code 1
      expect(error.exitCode).toBe(1);
      // Check stderr contains CLI description
      expect(error.stderr).toContain(
        "CLI tool for synchronizing and contributing to component-based codebases"
      );
      // Check stderr contains command info for pull command
      expect(error.stderr).toContain("pull [options] <source> <destination>");
    }
  });
});
