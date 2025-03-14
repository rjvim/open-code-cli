#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */

import {Command} from 'commander';
import {green} from 'kleur/colors';
import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
// Import all command registrations
import {registerPullCommand} from './commands/pull';
import {registerInitCommand} from './commands/init';
// Future imports will go here

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Register all commands from an array for better modularity
const registerCommands = async (program: Command) => {
  const commandRegistrars = [
    registerPullCommand,
    registerInitCommand,
    // Add future command registrars here
  ];

  for (const register of commandRegistrars) {
    await register(program);
  }
};

async function main() {
  const program = new Command()
    .name('open-code')
    .description(
      'CLI tool for synchronizing and contributing to component-based codebases'
    )
    .version(
      packageJson.version,
      '-v, --version',
      'display the version number'
    );

  await registerCommands(program);
  program.parse();

  if (process.argv.length <= 2) {
    console.log(`open-code-cli version: ${green(packageJson.version)}`);
  }
}

main().catch((err) => {
  if (err.name === "OpenCodeError") {
    console.error(`Error: ${err.message}`);
    if (err.details) {
      console.error("Details:", err.details);
    }
  } else {
    // For unexpected errors, show a simplified message
    console.error(`Unexpected error: ${err.message}`);
    // Optionally log the full error to a file for debugging
  }
  process.exit(1);
});
