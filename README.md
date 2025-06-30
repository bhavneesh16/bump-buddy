<!-- @format -->

# 🐶 dep-watchdog

> A simple CLI tool to check, audit, and update outdated npm packages in your JavaScript or React project.

---

## ✨ Features

- ✅ Check versions of all or specific npm packages
- 🔧 Update outdated packages automatically
- 📦 Works in any Node.js / React project
- 📁 Supports custom project paths
- 🧪 Dry-run mode to preview updates
- 📊 JSON or table output
- ⚙️ CI/CD friendly

---

## 📦 Installation

Install globally:

```bash
npm install -g dep-watchdog

```

## dep-watchdog Usage

To Check all installed dependencies:

```bash
dep-watchdog

```

To Check a project in a specific path:

```bash
dep-watchdog --path ../my-project

```

To Check specific packages:

```bash
dep-watchdog react axios

```

To Update all outdated packages:

```bash
dep-watchdog --update

```

To Update specific packages:

```bash
dep-watchdog react --update

```

To Dry run (simulate updates):

```bash
dep-watchdog --update --dry-run

```

To Output in JSON format:

```bash
dep-watchdog --json

```

### 📊 Example Output

```text
📁 Checking packages in: ./my-app

┌───────────────┬────────────┬────────────┬───────────────┐
│ Package       │ Installed  │ Latest     │ Status        │
├───────────────┼────────────┼────────────┼───────────────┤
│ react         │ 18.2.0     │ 18.2.0     │ ✔ Up-to-date  │
│ axios         │ 1.5.1      │ 1.6.3      │ ✖ Outdated    │
└───────────────┴────────────┴────────────┴───────────────┘

```

## 🆘 CLI Help

To see available commands and options:

```bash
dep-watchdog --help

```

| Flag        | Alias | Description                                  |
| ----------- | ----- | -------------------------------------------- |
| `--path`    | `-p`  | Path to the project directory                |
| `--update`  | `-u`  | Automatically install latest versions        |
| `--dry-run` | `-d`  | Show what would be updated (no changes made) |
| `--json`    |       | Output results as JSON                       |
| `--help`    |       | Show usage info                              |
