import { readFile, writeFile, mkdtemp, cp, rm, readdir } from "fs/promises";
import { tmpdir } from "os";
import { resolve, join } from "path";
import { chdir } from "process";
import { endSection, updateStatus, startSection } from "helpers/cli";
import { brandColor, dim } from "helpers/colors";
import {
	npmInstall,
	runCommand,
} from "helpers/command";
import { processArgument } from "helpers/interactive";
import { C_DEFAULTS } from "./cli";
import {
	chooseAccount,
	gitCommit,
	offerGit,
	offerToDeploy,
	printSummary,
	runDeploy,
	setupProjectDirectory,
} from "./common";
import type { CArgs, PagesGeneratorContext as Context } from "types";

export const runWorkersGenerator = async (args: CArgs) => {
	const { name, path } = setupProjectDirectory(args);

	const ctx: Context = {
		project: { name, path },
		args,
	};

	await copyFiles(ctx);
	await updateFiles(ctx);
	endSection("Application created");

	startSection("Installing dependencies", "Step 2 of 3");
	chdir(ctx.project.path);
	await npmInstall();
	endSection("Dependencies Installed");

	await offerToDeploy(ctx);
	await runDeploy(ctx);

	await printSummary(ctx);
};

async function getTemplate() {
	return resolve(
		// eslint-disable-next-line no-restricted-globals
		__dirname,
		"..",
		"template",
	);
}

async function copyFiles(ctx: Context) {
	const path = await getTemplate();
	const destdir = ctx.project.path;

	// copy template files
	updateStatus('Copying files from template');
	await cp(path, destdir, { recursive: true });
}

async function updateFiles(ctx: Context) {
	// build file paths
	const paths = {
		packagejson: resolve(ctx.project.path, "package.json"),
		wranglertoml: resolve(ctx.project.path, "wrangler.toml"),
	};

	// read files
	const contents = {
		packagejson: JSON.parse(await readFile(paths.packagejson, "utf-8")),
		wranglertoml: await readFile(paths.wranglertoml, "utf-8"),
	};

	// update files
	if (contents.packagejson.name === "<TBD>") {
		contents.packagejson.name = ctx.project.name;
	}
	contents.wranglertoml = contents.wranglertoml
		.replace(/^name\s*=\s*"<TBD>"/m, `name = "${ctx.project.name}"`)

	// write files
	await writeFile(
		paths.packagejson,
		JSON.stringify(contents.packagejson, null, 2)
	);
	await writeFile(paths.wranglertoml, contents.wranglertoml);
}
