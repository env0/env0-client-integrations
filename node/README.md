# @env0/cli [![License](https://img.shields.io/npm/l/@env0/cli?color=blue)](https://github.com/env0/env0-client-integrations/blob/master/LICENSE) [![Version](https://img.shields.io/npm/v/@env0/cli)](https://www.npmjs.com/package/@env0/cli) [![Downloads](https://img.shields.io/npm/dw/@env0/cli)](https://www.npmjs.com/package/@env0/cli) [![CI](https://github.com/env0/env0-client-integrations/workflows/CI/badge.svg?branch=master)](https://github.com/env0/env0-client-integrations/actions?query=workflow%3ACI+branch%3Amaster)

The official command-line tool for the [env0](https://www.env0.com) platform.

It lets you deploy, destroy, and manage environments as code from your terminal, and also exposes grouped commands for managing agents.

---

- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration & authentication](#configuration--authentication)
- [Commands](#commands)
  - [deploy](#env0-deploy)
  - [destroy](#env0-destroy)
  - [approve](#env0-approve)
  - [cancel](#env0-cancel)
  - [agents](#env0-agents-grouped-commands)
  - [configure](#env0-configure)
- [Arguments](#arguments)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Development](#development)

---

## Installation

```bash
yarn global add @env0/cli
# or
npm install -g @env0/cli
```

Requires **Node 18+**.

---

## Quick start

1. **Configure credentials and defaults** (one time):

   ```bash
   env0 configure
   ```

   This will interactively prompt for:

   - API key / secret
   - Organization ID
   - Default project / environment / blueprint

   Values are saved to `~/.env0/config.json` and automatically reused.

2. **Run a deployment**:

   ```bash
   env0 deploy -o <organizationId> -p <projectId> -b <blueprintId> -e <environmentName>
   ```

3. **Get help at any time**:

   ```bash
   env0 --help
   env0 agents --help
   ```

---

## Configuration & authentication

The CLI reads configuration from three places, in this order of precedence (highest first):

1. **Explicit CLI flags** (e.g. `-o`, `-p`)
2. **Environment variables** (e.g. `ENV0_API_KEY`)
3. **Configuration file** at `~/.env0/config.json`

Authentication is normally provided via **configure** or environment variables:

- Run `env0 configure` to set:

  - `apiKey`, `apiSecret`
  - `organizationId`, `projectId`, `environmentName`, `blueprintId`

- Or set env vars (see [Environment variables](#environment-variables)).

Runtime commands (like `deploy`, `destroy`, `approve`, `cancel`, `agents list`) no longer accept `apiKey` / `apiSecret` flags; they always resolve credentials from config/env.

---

## Commands

You can always see the latest list and options via:

```bash
env0 --help
```

### `env0 deploy`

Deploys an environment.

Examples:

```bash
env0 deploy -o <organizationId> -p <projectId> -b <blueprintId> -e <environmentName>
env0 deploy -o <org> -p <proj> -b <bp> -e <env> -r main -v stage=dev -u tfvar=value
```

Key options:

- `-o, --organizationId` – env0 Organization ID (required)
- `-p, --projectId` – env0 Project ID (required)
- `-b, --blueprintId` – Blueprint to deploy (required for new environments)
- `-e, --environmentName` – Environment name
- `--environmentId` – Environment ID (takes precedence over name)
- `-r, --revision` – Git revision (branch/tag/commit)
- `-v, --environmentVariables` – Environment variables (`NAME=value`)
- `-q, --sensitiveEnvironmentVariables` – Sensitive environment variables
- `-u, --terraformVariables` – Terraform variables (`NAME=value`)
- `-a, --requiresApproval` – `true`/`false`
- `-z, --skipStateRefresh` – Skip state refresh on destroy plan
- `-t, --targets` – Partial apply targets list

### `env0 destroy`

Destroys an environment.

```bash
env0 destroy -o <organizationId> -p <projectId> -e <environmentName>
```

Uses `requiresApproval` / `skipStateRefresh` to control behavior.

### `env0 approve`

Approves a deployment that is waiting for user approval.

```bash
env0 approve -o <organizationId> -p <projectId> -e <environmentName>
```

### `env0 cancel`

Cancels a deployment that is waiting for user approval.

```bash
env0 cancel -o <organizationId> -p <projectId> -e <environmentName>
```

### `env0 agents` (grouped commands)

`agents` is a **group** command. Use:

```bash
env0 agents --help
```

to see all agents-related subcommands. Currently supported:

- **`env0 agents list`** – List agents for an organization.

  ```bash
  env0 agents list -o <organizationId>
  ```

Future commands (e.g. `agents delete`, `agents update`) will follow the same pattern.

### `env0 configure`

Configures env0 CLI options.

- **Interactive** (no flags):

  ```bash
  env0 configure
  ```

- **Non-interactive** (flags):

  ```bash
  env0 configure -k <apiKey> -s <apiSecret> -o <organizationId> -p <projectId> -e <environmentName> -b <blueprintId>
  ```

Options you pass here are merged with existing config and written to `~/.env0/config.json`.

### `env0 version` / `env0 help`

- `env0 --version` or `env0 version` – print CLI version.
- `env0 --help` or `env0 help` – show global help.

---

## Arguments

Most arguments are shared across commands. Below is a quick reference (see `env0 --help` for the canonical list).

- **API Key / Secret** (used via config/env)

  - `apiKey` – env0 API Key
  - `apiSecret` – env0 API Secret

- **Core identifiers**

  - `organizationId` (`-o`) – env0 Organization ID
  - `projectId` (`-p`) – env0 Project ID
  - `environmentName` (`-e`) – environment name
  - `environmentId` – environment ID
  - `blueprintId` (`-b`) – blueprint ID

- **Deployment configuration**
  - `workspaceName` (`-w`)
  - `environmentVariables` (`-v`)
  - `sensitiveEnvironmentVariables` (`-q`)
  - `terraformVariables` (`-u`)
  - `revision` (`-r`)
  - `requiresApproval` (`-a`)
  - `skipStateRefresh` (`-z`)
  - `targets` (`-t`)

---

## Environment variables

Supported env vars:

- `ENV0_API_KEY`
- `ENV0_API_SECRET`
- `ENV0_ORGANIZATION_ID`
- `ENV0_PROJECT_ID`
- `ENV0_BLUEPRINT_ID`
- `ENV0_ENVIRONMENT_NAME`
- `ENV0_ENVIRONMENT_ID`

These are read by the config manager and merged with the config file and CLI flags.

You can also override the API endpoint for development:

```bash
export ENV0_API_URL=https://api-server
# default is https://api.env0.com
```

---

## Project structure

Relevant files for the CLI behavior:

- `bin/cli.js` – Node entrypoint (`env0` binary) that loads `src/main.js`.
- `src/main.js` – Top-level CLI flow: parses the main command, handles internal commands
  (`help`, `version`, `configure`), routes grouped commands (e.g. `agents <subcommand>`),
  and invokes `run-command`.
- `src/commands/run-command.js` – Shared orchestration for runtime commands:
  reads config, validates required options, initializes deploy utils when needed, and
  calls the specific command handler.
- `src/config/commands.js` – Central command registry:
  - `handler` – function implementing the command
  - `requiredOptions` – which options must be present
  - `useDeployUtils` – whether to initialize deploy utilities
  - `options` – CLI option schema passed to `command-line-args`
  - `help` – descriptions and examples used in `--help`
- `src/config/arguments.js` – Shared argument definitions (names, aliases, descriptions, groups).
- `src/commands/*` – Individual command handlers (`deploy`, `destroy`, `approve`, `cancel`, `configure`, agents commands, etc.).
- `src/commands/help.js` – Renders help output using `command-line-usage`, including the grouped
  `agents` help when invoked as `env0 agents --help`.

This structure is designed so adding new commands (including new `agents <subcommand>`s) is primarily
a matter of wiring them into `config/commands.js` and providing a handler.

---

## Development

Clone the repo and work from the `node` directory:

```bash
git clone https://github.com/env0/env0-client-integrations.git
cd env0-client-integrations/node

# install deps (npm, yarn, or pnpm)
pnpm install

# run tests
pnpm test

# run lint
pnpm lint
```

During development you can point the CLI at a custom env0 API URL:

```bash
export ENV0_API_URL=https://api-server
env0 configure
```

## API Reference & blog

- API Reference: https://docs.env0.com/reference
- Blog: https://www.env0.com/blog/introducing-the-env0-cli
