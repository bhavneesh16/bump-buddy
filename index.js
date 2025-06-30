#!/usr/bin/env node
/** @format */

import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";
import Table from "cli-table3";
import chalk from "chalk";
import ora from "ora";

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
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--path" || arg === "-p") {
			options.path = path.resolve(args[i + 1]);
			i++;
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
// Helpers
// -------------------------

function getLocalPackages(projectPath) {
	const pkgPath = path.join(projectPath, "package.json");

	if (!fs.existsSync(pkgPath)) {
		console.error(chalk.red(`❌ No package.json found in: ${projectPath}`));
		process.exit(1);
	}

	const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
	return {
		...pkgJson.dependencies,
		...pkgJson.devDependencies,
	};
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
						resolve(json["dist-tags"].latest);
					} catch (err) {
						reject(err);
					}
				});
			})
			.on("error", reject);
	});
}

// -------------------------
// Main Logic
// -------------------------

async function checkPackages(
	projectPath,
	packagesToCheck,
	shouldUpdate,
	dryRun,
	jsonOutput
) {
	const localPackages = getLocalPackages(projectPath);
	const allInstalled = Object.keys(localPackages);
	const targetPackages =
		packagesToCheck.length === 0 ? allInstalled : packagesToCheck;

	const results = [];
	const outdatedPackages = [];

	console.log(chalk.cyan(`\n📁 Checking packages in: ${projectPath}\n`));

	const spinner = ora(
		chalk.cyan(
			`Checking versions for ${targetPackages.length} package(s)...\n\n`
		)
	).start();

	for (const pkg of targetPackages) {
		const currentVersion = localPackages[pkg];

		if (!currentVersion) {
			results.push({
				name: pkg,
				installed: null,
				latest: null,
				status: "not-installed",
			});
			continue;
		}

		try {
			const latest = await fetchLatestVersion(pkg);
			const cleanVersion = currentVersion.replace(/^[\^~]/, "");

			if (cleanVersion === latest) {
				results.push({
					name: pkg,
					installed: cleanVersion,
					latest,
					status: "up-to-date",
				});
			} else {
				results.push({
					name: pkg,
					installed: cleanVersion,
					latest,
					status: "outdated",
				});
				outdatedPackages.push({ name: pkg, latest });
			}
		} catch (err) {
			results.push({
				name: pkg,
				installed: currentVersion || null,
				latest: null,
				status: "error",
				error: err.message,
			});
		}
	}

	// If JSON output requested
	if (jsonOutput) {
		console.log(JSON.stringify(results, null, 2));
		return;
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

	spinner.succeed(chalk.cyan("Checking versions Done.\n\n"));
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
	options.json
);
