# v0.2.0 (Thu Mar 13 2025)

#### 🚀 Enhancement

- feat: Support pulling code from GitHub blob URLs ([@rjvim](https://github.com/rjvim))
- feat: add input validation for repository and destination parameters in init and sync commands ([@rjvim](https://github.com/rjvim))
- feat: update README and implement type definitions for configuration and commands ([@rjvim](https://github.com/rjvim))
- feat: add init command for project initialization with repository validation and configuration setup ([@rjvim](https://github.com/rjvim))
- feat: enhance sync process with spinner and improved error handling for downloads ([@rjvim](https://github.com/rjvim))
- feat: expose sync function and add tests for repository synchronization ([@rjvim](https://github.com/rjvim))
- feat: implement downloadCode and trackSync utilities for syncing repositories ([@rjvim](https://github.com/rjvim))
- feat: update version command test to show help documentation when run without arguments ([@rjvim](https://github.com/rjvim))
- feat: implement validateSource function for GitHub URL validation and enhance error handling in prepareDestination ([@rjvim](https://github.com/rjvim))
- feat: implement prepareDestination utility to manage destination directory for sync command ([@rjvim](https://github.com/rjvim))
- feat: enhance validateSource function to validate GitHub repository URLs ([@rjvim](https://github.com/rjvim))
- feat: add vite-tsconfig-paths dependency and export validateSource function with tests ([@rjvim](https://github.com/rjvim))
- feat: add sync command to synchronize code from a GitHub repository ([@rjvim](https://github.com/rjvim))
- feat: add ora dependency and create spinner utility function ([@rjvim](https://github.com/rjvim))
- feat: add error constants and package info utility functions ([@rjvim](https://github.com/rjvim))
- feat: add logger and highlighter utilities with TypeScript configuration updates ([@rjvim](https://github.com/rjvim))
- feat: implement package manager detection and installation utilities ([@rjvim](https://github.com/rjvim))
- feat: add canary publish script and migrate version tests ([@rjvim](https://github.com/rjvim))

#### 🐛 Bug Fix

- fix: add picocolors dependency to resolve build error [#5](https://github.com/rjvim/open-code-cli/pull/5) ([@rjvim](https://github.com/rjvim))
- Improve Error Handling and File Tracking in open-code-cli [#4](https://github.com/rjvim/open-code-cli/pull/4) ([@rjvim](https://github.com/rjvim))
- fix: Improve error handling and file tracking in open-code-cli ([@rjvim](https://github.com/rjvim))
- fix: Improve error handling to prevent dumping full stack trace ([@rjvim](https://github.com/rjvim))
- meta: Update .windsurfrules with commit message guidelines ([@rjvim](https://github.com/rjvim))
- refactor: Rename pub:canary script to canary and format code in index.ts ([@rjvim](https://github.com/rjvim))
- fix: Update pub:canary script to include build step ([@rjvim](https://github.com/rjvim))
- fix: Rename sync to pull ([@rjvim](https://github.com/rjvim))
- refactor: Rename sync command to pull ([@rjvim](https://github.com/rjvim))
- refactor: remove tsup configuration and update build scripts to use ncc [#3](https://github.com/rjvim/open-code-cli/pull/3) ([@rjvim](https://github.com/rjvim))
- remove: delete unused changeset configuration files ([@rjvim](https://github.com/rjvim))
- add: include files in package.json and create .npmignore for build artifacts [#2](https://github.com/rjvim/open-code-cli/pull/2) ([@rjvim](https://github.com/rjvim))
- add: include files in package.json and create .npmignore for build artifacts ([@rjvim](https://github.com/rjvim))

#### ⚠️ Pushed to `main`

- Rename sync to pull ([@rjvim](https://github.com/rjvim))
- Merge branch 'main' of github.com:rjvim/open-code-cli ([@rjvim](https://github.com/rjvim))

#### Authors: 1

- Rajiv Seelam ([@rjvim](https://github.com/rjvim))

---

# v0.1.1 (Wed Mar 12 2025)

#### 🐛 Bug Fix

- Test-publish [#1](https://github.com/rjvim/open-code-cli/pull/1) ([@rjvim](https://github.com/rjvim))

#### ⚠️ Pushed to `main`

- add .env to .gitignore, update package.json with auto-related dependencies, and create .autorc configuration file ([@rjvim](https://github.com/rjvim))
- add changeset configuration and update package.json scripts for versioning and publishing ([@rjvim](https://github.com/rjvim))
- add vitest configuration, update tsup settings, and enhance package.json scripts ([@rjvim](https://github.com/rjvim))
- implement project initialization command with repository cloning and configuration setup ([@rjvim](https://github.com/rjvim))
- initialize project structure with CLI tool and configuration files ([@rjvim](https://github.com/rjvim))

#### Authors: 1

- Rajiv Seelam ([@rjvim](https://github.com/rjvim))
