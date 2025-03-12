import { describe, it, expect } from "vitest";
import { execa } from "execa";
import packageJson from "../package.json";

describe("Version command", () => {
  it("shows the version from package.json", async () => {
    const { stdout } = await execa("node", ["./dist/index.js", "--version"]);
    expect(stdout).toBe(packageJson.version);
  });

  it("shows the version when run without arguments", async () => {
    const { stdout } = await execa("node", ["./dist/index.js"]);
    expect(stdout).toContain(packageJson.version);
  });
});
