#!/usr/bin/env node
import { Command } from "commander";
import { init } from "./commands/init";
import { sync } from "./commands/sync";
import { detectChanges } from "./commands/detect-changes";
import { contribute } from "./commands/contribute";
import { addRepo } from "./commands/add-repo";
import packageJson from "../package.json";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const program = new Command()
    .name("open-code")
    .description(
      "CLI tool for synchronizing and contributing to component-based codebases"
    )
    .version(
      packageJson.version || "0.1.0",
      "-v, --version",
      "display the version number"
    );

  program
    .addCommand(init)
    .addCommand(sync)
    .addCommand(detectChanges)
    .addCommand(contribute)
    .addCommand(addRepo);

  program.parse();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
