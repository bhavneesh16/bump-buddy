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


## 📦 Usage

dep-watchdog [packages...] [options]


To Check all installed dependencies:
dep-watchdog


To Check specific packages:
dep-watchdog react axios


To Update all outdated packages:
dep-watchdog --update


To Update specific packages:
dep-watchdog react --update



To Check a project in a specific path:
dep-watchdog --path ../my-project


To Dry run (simulate updates):
dep-watchdog --update --dry-run



To Output in JSON format:
dep-watchdog --json











