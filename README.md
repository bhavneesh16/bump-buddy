<!-- @format -->

# 🐶 bump-buddy

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
- 🔧 Checks for unused dependencies in project

---

## 📦 Installation

Install globally:

```bash
npm install -g bump-buddy

```

## bump-buddy Usage

To Check all installed dependencies:

```bash
bump-buddy

```

To Check a project in a specific path:

```bash
bump-buddy --path ../my-project

```

To Check specific packages:

```bash
bump-buddy react axios

```

To Update all outdated packages:

```bash
bump-buddy --update

```

To Update specific packages:

```bash
bump-buddy react --update

```

To Dry run (simulate updates):

```bash
bump-buddy --update --dry-run

```

To Check for unsed dependencies:

```bash
bump-buddy --unused

```

To Check for unsed dependencies in a specific path:

```bash
bump-buddy --path ../my-project --unused

```

To Output in JSON format:

```bash
bump-buddy --json

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
bump-buddy --help

```

| Flag        | Alias | Description                                  |
| ----------- | ----- | -------------------------------------------- |
| `--path`    | `-p`  | Path to the project directory                |
| `--update`  | `-u`  | Automatically install latest versions        |
| `--dry-run` | `-d`  | Show what would be updated (no changes made) |
| `--json`    |       | Output results as JSON                       |
| `--unused`  |       | Checks for unused dependencies               |
| `--help`    | `-h`  | Show usage info                              |
