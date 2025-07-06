#!/usr/bin/env node
/** @format */

import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";
import Table from "cli-table3";
import chalk from "chalk";
import ora from "ora";

// Supported file extensions for checking unsed npm modules
const fileExtensions = [".js", ".jsx", ".ts", ".tsx"];

// -------------------------
// Argument Parser
// -------------------------

function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		path: process.cwd(),
		packages: [],
		update: false,
		dryRun: false,
		json: false,
		unsed: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (args.includes("--help") || args.includes("-h")) {
			printHelp();
			process.exit(0);
		} else if (arg === "--path" || arg === "-p") {
			options.path = path.resolve(args[i + 1]);
			i++;
		} else if (arg === "--unused") {
			options.unsed = true;
		} else if (arg === "--update" || arg === "-u") {
			options.update = true;
		} else if (arg === "--dry-run" || arg === "-d") {
			options.dryRun = true;
		} else if (arg === "--json") {
			options.json = true;
		} else {
			options.packages.push(arg);
		}
	}

	return options;
}

// -------------------------
// Print Help to Console dep-watching usage
// -------------------------

function printHelp() {
	console.log(`
  🐶 bump-buddy — A CLI tool to check and update npm package versions
  
  Usage:
	bump-buddy [packages...] [options]
  
  Examples:
	bump-buddy
	bump-buddy react axios
	bump-buddy --update
	bump-buddy react --update
	bump-buddy --path ../app
	bump-buddy --update --dry-run
	bump-buddy --unused
	bump-buddy --path ../app --unused
	bump-buddy --json
  
  Options:
	-p, --path <dir>     Path to the project directory
	-u, --update         Automatically update outdated packages
	-d, --dry-run        Show what would be updated, but don't update
	--json               Output result as JSON
	--unused             Check for unsed dependencies
	-h, --help           Show this help message
  `);
}

// -------------------------
// Helpers
// -------------------------

function getLocalPackages(projectPath, onlyDep = false) {
	const pkgPath = path.join(projectPath, "package.json");

	if (!fs.existsSync(pkgPath)) {
		console.error(chalk.red(`❌ No package.json found in: ${projectPath}`));
		process.exit(1);
	}

	const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
	if (onlyDep) {
		return {
			...pkgJson.dependencies,
		};
	} else {
		return {
			...pkgJson.dependencies,
			...pkgJson.devDependencies,
		};
	}
}

function fetchLatestVersion(pkgName) {
	return new Promise((resolve, reject) => {
		https
			.get(`https://registry.npmjs.org/${pkgName}`, (res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () => {
					try {
						const json = JSON.parse(data);
						// console.log("\n\n api call >> ", json["dist-tags"]);
						resolve(json["dist-tags"].latest);
					} catch (err) {
						// console.log("api error >> ", err);
						reject(err);
					}
				});
			})
			.on("error", reject);
	});
}

// -------------------------
// To Check for Unsed Dependencies
// -------------------------

let allFiles = [];
let processedCount = 0;
const usedModules = new Set();

function checkUnsedDependencies(projectPath, checkUnusedFlag) {
	if (!checkUnusedFlag) return;
	const allInstalled = getLocalPackages(projectPath, true);
	const localPackages = Object.keys(allInstalled);
	// console.log("test >> ", localPackages);
	// console.log("test >> ", checkUnusedFlag);

	collectFiles(projectPath);
	console.log(chalk.cyan(`\n🔍 Scanned directory: ${projectPath}`));
	console.log(chalk.cyan(`📁 Started Scanning ${allFiles.length} files...`));
	const spinner = ora(
		chalk.cyan(`📁 Scanning ${allFiles.length} files...`)
	).start();

	const totalFiles = allFiles.length;

	for (const file of allFiles) {
		const content = fs.readFileSync(file, "utf8");
		findImports(content);

		processedCount++;
		const percent = ((processedCount / totalFiles) * 100).toFixed(1);
		spinner.text = chalk.cyan(
			`Scanning files... ${percent}% (${processedCount}/${totalFiles})`
		);
		spinner.render();
	}

	spinner.stopAndPersist({
		symbol: "✅",
		text: chalk.cyan(spinner.text), // keep it visible
	});

	const unusedDevDeps = localPackages.filter((dep) => !usedModules.has(dep));

	console.log(chalk.cyan("📦 Unused Dependencies:"));
	if (unusedDevDeps.length === 0) {
		console.log(chalk.green("✅ None found!"));
	} else {
		unusedDevDeps.forEach((dep) => console.log(chalk.red(`- ${dep}`)));
	}

	process.exit(0);
}

// Collect all relevant source files first
function collectFiles(dir) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			if (
				file === "node_modules" ||
				file === "dist" ||
				file === "build" ||
				file.startsWith(".")
			)
				continue;
			collectFiles(fullPath);
		} else if (fileExtensions.includes(path.extname(file))) {
			allFiles.push(fullPath);
		}
	}
}

// Extract imports
function findImports(content) {
	const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
	const importRegex = /import(?:[\s\S]*?)from ['"`]([^'"`]+)['"`]/g;

	let match;
	while ((match = requireRegex.exec(content)) !== null) {
		const pkg = getPackageName(match[1]);
		if (pkg) usedModules.add(pkg);
	}

	while ((match = importRegex.exec(content)) !== null) {
		const pkg = getPackageName(match[1]);
		if (pkg) usedModules.add(pkg);
	}
}

// Get top-level package name
function getPackageName(importPath) {
	if (importPath.startsWith(".") || path.isAbsolute(importPath)) return null;
	const parts = importPath.split("/");
	return importPath.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

// -------------------------
// Main Logic
// -------------------------

async function checkPackages(
	projectPath,
	packagesToCheck,
	shouldUpdate,
	dryRun,
	jsonOutput,
	checkUnused
) {
	// To check for unused dependencies
	checkUnsedDependencies(projectPath, checkUnused);

	const localPackages = getLocalPackages(projectPath);
	const allInstalled = Object.keys(localPackages);
	const targetPackages =
		packagesToCheck.length === 0 ? allInstalled : packagesToCheck;

	const results = [];
	const outdatedPackages = [];

	console.log(chalk.cyan(`\n📁 Checking packages in: ${projectPath}\n`));

	const spinner = ora(
		chalk.cyan(`Checking versions... (0/${targetPackages.length} - 0%)\n`)
	).start();

	const batchSize = 25;
	const total = targetPackages.length;
	let completed = 0;

	// Batch runner using Promise.allSettled
	async function processBatch(batch) {
		const fetchTasks = batch.map((pkg) => {
			const currentVersion = localPackages[pkg];

			if (!currentVersion) {
				completed++;
				spinner.text = chalk.cyan(
					`Checking versions... (${completed}/${total} - ${Math.floor(
						(completed / total) * 100
					)}%)`
				);
				return Promise.resolve({
					name: pkg,
					installed: null,
					latest: null,
					status: "not-installed",
				});
			}

			return fetchLatestVersion(pkg)
				.then((latest) => {
					const cleanVersion = currentVersion.replace(/^[\^~]/, "");
					const status = cleanVersion === latest ? "up-to-date" : "outdated";

					if (status === "outdated") {
						outdatedPackages.push({ name: pkg, latest });
					}

					return {
						name: pkg,
						installed: cleanVersion,
						latest,
						status,
					};
				})
				.catch((err) => ({
					name: pkg,
					installed: currentVersion || null,
					latest: null,
					status: "error",
					error: err.message,
				}))
				.finally(() => {
					completed++;
					spinner.text = chalk.cyan(
						`Checking versions... (${completed}/${total} - ${Math.floor(
							(completed / total) * 100
						)}%)`
					);
				});
		});

		const settled = await Promise.allSettled(fetchTasks);
		for (const res of settled) {
			if (res.status === "fulfilled") {
				results.push(res.value);
			} else {
				// This shouldn't happen since we're catching errors inside the task
				console.error(chalk.red(`Unexpected error: ${res.reason}`));
			}
		}
	}

	// Process all batches
	for (let i = 0; i < total; i += batchSize) {
		const batch = targetPackages.slice(i, i + batchSize);
		await processBatch(batch);
	}

	spinner.succeed(chalk.cyan("Checking versions Done.\n\n"));

	// JSON output
	if (jsonOutput) {
		console.log(JSON.stringify(results, null, 2));
		process.exit(0);
	}

	// Table output
	const table = new Table({
		head: [
			chalk.gray("Package"),
			chalk.gray("Installed"),
			chalk.gray("Latest"),
			chalk.gray("Status"),
		],
		colWidths: [30, 15, 15, 20],
	});

	results.forEach(({ name, installed, latest, status }) => {
		const s = {
			"up-to-date": chalk.green("✔ Up-to-date"),
			outdated: chalk.red("✖ Outdated"),
			"not-installed": chalk.yellow("Not Installed"),
			error: chalk.red("Error"),
		}[status];

		table.push([name, installed || "-", latest || "-", s]);
	});

	console.log(table.toString());
	console.log("\n\n");

	// Update logic
	if (shouldUpdate && outdatedPackages.length > 0) {
		console.log(
			chalk.yellow(
				`\n🔧 ${dryRun ? "Dry run:" : "Updating"} outdated packages...\n`
			)
		);

		for (const { name, latest } of outdatedPackages) {
			if (dryRun) {
				console.log(`⬆️ Would update ${name} → ${latest}`);
			} else {
				try {
					console.log(`⬆️ Installing ${name}@${latest}...`);
					execSync(`npm install ${name}@${latest}`, {
						cwd: projectPath,
						stdio: "inherit",
					});
				} catch (err) {
					console.error(chalk.red(`Failed to update ${name}: ${err.message}`));
				}
			}
		}

		console.log(
			dryRun
				? chalk.cyan("\n🧪 Dry run complete. No changes were made.\n")
				: chalk.green("\n✅ Update complete.\n")
		);
	} else if (shouldUpdate) {
		console.log(chalk.green("\n✔ All packages are already up-to-date.\n"));
	}
}

// -------------------------
// Run CLI
// -------------------------

const options = parseArgs();
checkPackages(
	options.path,
	options.packages,
	options.update,
	options.dryRun,
	options.json,
	options.unsed
);
