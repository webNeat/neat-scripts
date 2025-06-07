# Jisr – Technical Guide

This document provides a comprehensive technical overview of the Jisr project for developers and contributors. It covers the architecture, implementation details, conventions, tools, and workflows used in the project.

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Core Concepts](#4-core-concepts)
5. [Protocol Specification](#5-protocol-specification)
6. [VS Code Extension](#6-vs-code-extension)
7. [Node.js Helper Library](#7-nodejs-helper-library)
8. [Development Workflow](#8-development-workflow)
9. [Testing](#9-testing)
10. [Conventions and Best Practices](#10-conventions-and-best-practices)
11. [Build and Deployment](#11-build-and-deployment)
12. [Roadmap](#12-roadmap)

## 1. Project Overview

Jisr ("bridge" in Arabic) is a system that enables external executables (scripts, binaries, etc.) to drive VS Code. A script sends requests for editor context (workspace path, active file, selections) through STDOUT and receives responses as JSON through STDIN.

The design is editor-agnostic and aims to support additional editors beyond VS Code.

## 2. Architecture

The Jisr architecture consists of three main components:

1. **VS Code Extension**: The core component that integrates with VS Code, registers commands, and manages communication with external scripts.
2. **Shared Schemas**: TypeScript interfaces that define the communication protocol between the extension and external scripts.
3. **Helper Libraries**: Language-specific libraries that simplify writing Jisr scripts (currently Node.js is implemented).

x
## 3. Repository Structure

```
/ (monorepo root)
├─ extensions/          # Editor integrations
│  └─ vscode/           # VS Code extension implementation
├─ libs/                # Helper libraries for script authors
│  └─ nodejs/           # Node.js helper to read context / emit commands
├─ schemas/             # Single-source TypeScript interfaces (Context, Commands)
├─ story/               # Design narrative & history (not required at runtime)
└─ LLM.md   # ← YOU ARE HERE
```

### Monorepo Benefits

- Shared TypeScript interfaces ensure consistency across packages
- Independent development and versioning of components
- Simplified dependency management
- Workspace symlinks during development avoid cross-package tooling friction

## 4. Core Concepts

### Context

The context represents the current state of the editor that can be requested by a script. It includes:

- `workspace_path`: Absolute path of the first workspace folder (may be empty)
- `file_path`: Absolute path of the active file (may be empty)
- `selections`: Array of selections with 1-based line/column positions

Scripts request context by sending a `context` command through STDOUT, and receive the context as a response through STDIN.

### Commands

Commands are actions that can be executed by the extension. Each command has a specific input structure and output type.

### Protocol

The communication protocol defines how data flows between the extension and external scripts:
1. Scripts send commands as JSON objects, one per line, through STDOUT
2. Extension sends responses as JSON objects through STDIN
3. Error handling through STDERR (currently not aggregated, but available for scripts to use)

## 5. Protocol Specification

### Shared Types

The protocol is defined by TypeScript interfaces in `schemas/interfaces.ts`:

```ts
interface Position  { line: number; col: number }
interface Selection { start: Position; end: Position }

// Data sent *to* the external script
interface Context {
  workspace_path: string
  file_path: string
  selections: Selection[]
}

// Commands accepted *from* the external script
interface Commands {
  "context": {
    input: {};
    output: Context
  };
  "files.open": {
    input: { file_path: string };
    output: void
  };
  "notifications.info": {
    input: { message: string };
    output: void
  };
  "notifications.warning": {
    input: { message: string };
    output: void
  };
  "notifications.error": {
    input: { message: string };
    output: void
  };
  "inputs.select": {
    input: {
      title?: string;
      multiple?: boolean;
      placeholder?: string;
      insertion_separator?: string;
      choices: Array<string | { label: string; description?: string }>;
    };
    output: string[];
  };
}
```

### Versioning

The protocol is versioned implicitly by git history. Breaking changes require bumping the extension major version and coordinating library updates.

### Communication Format

1. **STDOUT**: Any number of lines, each containing valid JSON representing either:
   - A string VS Code command ID
   - An object `{ "command": string; "args"?: any }`
2. **STDIN**: JSON responses to commands sent by the script
3. **STDERR**: Free-form error output (available for scripts to use but not currently aggregated by the extension)

## 6. VS Code Extension

### Entry Point

The extension's entry point is `src/index.ts`:

```ts
import * as vscode from 'vscode'
import { run_script } from './run_script'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('jisr.run_script', run_script))
}

export function deactivate() {}
```

### Command Execution

The extension uses a modular command system defined in `src/api/`:

1. Each command is registered in `src/api/index.ts`
2. Individual command implementations are in separate files under `src/api/`
3. The `define` function registers command handlers
4. The `execute` function runs commands with proper error handling

### Core Commands

| Command | File | Responsibility |
|---------|------|----------------|
| `jisr.run_script` | `src/run_script.ts` | Main entry point that spawns external scripts |
| `context` | `src/api/context.ts` | Provides current editor context |
| `files.open` | `src/api/files.ts` | Opens a file by absolute path |
| `notifications.*` | `src/api/notifications.ts` | Shows info/warning/error messages |
| `inputs.select` | `src/api/inputs.ts` | Shows QuickPick selections |

### Implementation Details

#### Script Execution (`src/run_script.ts`)

1. Saves the active file if present
2. Spawns the external script as a child process
3. Script sends commands/requests through STDOUT
4. Extension reads STDOUT line-by-line and parses JSON commands
5. Extension executes commands and sends responses through STDIN
6. Script receives responses through STDIN

#### API Framework (`src/api/api.ts`)

1. Provides `define` function to register command handlers
2. Provides `execute` function to run commands with type safety
3. Handles error propagation and response formatting

## 7. Node.js Helper Library

### Purpose

The Node.js helper library (`libs/nodejs`) simplifies writing Jisr scripts in Node.js by providing:

1. Typed access to editor context
2. Type-safe command emission
3. Testable I/O streams

### API

The library provides two main functions:

```ts
// Read editor context
async function context(): Promise<Context>

// Emit a command to the extension
function command<K extends keyof Commands>(name: K, args: Commands[K]['input'])
```

### Implementation

#### Context Reading (`src/index.ts`)

1. Sends a `context` command request to the extension via `stdout`.
2. Reads the JSON response from `stdin`.
3. Caches the promise to ensure the request is only sent once.
4. Returns the context on success or rejects on error.

#### Command Emission (`src/index.ts`)

1. Serializes command name and arguments to STDOUT
2. Formats output as expected by the extension

#### Testable I/O (`src/env.ts`)

1. Swappable I/O streams for testing
2. Default implementations use Node.js process streams
3. Provides `setEnv` and `resetEnv` for test configuration

### Example Usage

```ts
import { context, command } from '@jisr/nodejs'

async function main() {
  const ctx = await context()
  if (!ctx.file_path) return
  command('notifications.info', { message: 'Hello from script!' })
}
main()
```

## 8. Development Workflow

### Initial Setup

1. Clone the repository
2. Install dependencies in each package:
   ```bash
   cd extensions/vscode && npm install
   cd libs/nodejs && npm install
   ```

### Development Process

1. Run `npm run build` in `extensions/vscode` to compile TypeScript
2. Use `code .` and press `F5` to debug the extension
3. Add/modify shared types only in `schemas/interfaces.ts`
4. Copy updated interfaces to each package:
   ```bash
   cp schemas/interfaces.ts extensions/vscode/src/interfaces.ts
   cp schemas/interfaces.ts libs/nodejs/src/interfaces.ts
   ```

### Adding New Commands

1. Update `schemas/interfaces.ts` to define the new command
2. Implement handler under `extensions/vscode/src/api/`
3. Register in `src/api/index.ts`
4. Add tests in `tests/api/`
5. Declare in `package.json > contributes.commands` if it's a user-facing command

## 9. Testing

### Test Framework

- **Mocha** as the test framework
- **@vscode/test-cli** for VS Code integration testing
- Custom utilities for mocking VS Code APIs

### Test Configuration

Test configuration is in `.vscode-test.mjs`:

```js
export default defineConfig({
  workspaceFolder: path.resolve('./tests-workspace'),
  files: ['./tests-dist/bootstrap.js', 'tests-dist/**/*.test.js'],
})
```

### Test Structure

```
tests/
├─ bootstrap.ts        # Test environment setup
├─ run_script.test.ts  # Main functionality tests
├─ commands/           # Command-specific tests
│  ├─ files.open.test.ts
│  ├─ notifications.test.ts
│  └─ inputs.select.test.ts
└─ utils/              # Test utilities
   ├─ editor.ts
   ├─ notifications.ts
   ├─ quick_pick.ts
   ├─ test_script.ts
   └─ workspace.ts
```

### Test Utilities

#### Bootstrap (`tests/bootstrap.ts`)

1. Activates the extension before all tests
2. Mocks VS Code notification APIs
3. Sets up a clean workspace before each test
4. Cleans up workspace files between tests

#### Script Testing (`tests/utils/test_script.ts`)

1. Simulates external script execution
2. Captures and verifies script arguments
3. Mocks STDIN/STDOUT communication
4. Verifies command execution flow

### Writing Tests

1. Use the `test_script` utility for script behavior testing
2. Mock VS Code APIs using provided utilities
3. Use the dedicated test workspace (`tests-workspace/`)
4. Verify both success and error cases

Example test:

```ts
it('runs the script and passes the args', async () => {
  const script = test_script(workspace.file_path('script.js'))
  script.receives_args(['foo', 'bar'])
  await script.test(['foo', 'bar'])
})
```

## 10. Conventions and Best Practices

### Code Organization

1. **Modular Commands**: Each command has its own file under `src/api/`
2. **Shared Interfaces**: All protocol definitions in `schemas/interfaces.ts`
3. **Separation of Concerns**: Extension logic separated from command implementations
4. **Consistent Naming**: Commands follow `namespace.action` pattern

### TypeScript Conventions

1. **Strict Typing**: All functions and variables are explicitly typed
2. **Interface Definitions**: Shared types defined as interfaces
3. **Generic Constraints**: Type-safe command handling using generics
4. **Error Handling**: Consistent error response format

### Testing Conventions

1. **Before Hooks**: Use `before` for extension activation, `beforeEach` for cleanup
2. **Mocking**: Mock VS Code APIs rather than relying on actual implementation
3. **Isolation**: Each test gets a clean workspace
4. **Verification**: Check both inputs received and outputs produced

### Documentation

1. **Inline Comments**: Explain non-obvious implementation details
2. **README Updates**: Document user-facing changes
3. **Story Files**: Capture design decisions and evolution
4. **Example Scripts**: Provide usage examples in multiple languages

## 11. Build and Deployment

### Building

#### VS Code Extension

```bash
npm run build        # Compiles TypeScript to JavaScript
npm run build:tests  # Compiles tests
```

#### Node.js Library

```bash
npm run build        # Uses tsup to build multiple formats
```

### Testing

```bash
npm test             # Builds and runs all tests
npm run pretest      # Pre-test build steps
```

### Publishing

Standard VS Code extension packaging using `vsce`:

1. Update version in `package.json`
2. Ensure all tests pass
3. Package with `vsce package`
4. Publish with `vsce publish`

## 12. Roadmap

### Short-term

- Expand built-in command set (overlays, completions, etc.)
- Strengthen error handling and logging for long-running scripts
- Improve test coverage and documentation

### Long-term

- Provide compiled helpers in more languages (Python, Go, Rust, etc.)
- Formal versioning of the protocol with JSON Schema
- Centralized marketplace for community scripts
- CI pipeline for automated testing and deployment

### Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request with description

For major changes, open an issue first to discuss the approach.
