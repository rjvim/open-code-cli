#!/usr/bin/env node
import { Command } from "commander";
import { green } from "kleur/colors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerSyncCommand } from "./commands/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const program = new Command()
    .name("open-code")
    .description(
      "CLI tool for synchronizing and contributing to component-based codebases"
    )
    .version(
      packageJson.version,
      "-v, --version",
      "display the version number"
    );

  // Add more commands here in the future

  await registerSyncCommand(program);

  program.parse();

  // If no arguments provided, show version
  if (process.argv.length <= 2) {
    console.log(`open-code-cli version: ${green(packageJson.version)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
