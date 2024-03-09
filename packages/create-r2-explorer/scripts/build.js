const { build, context } = require("esbuild");
const { cp } = require("fs/promises");

const run = async () => {
	const argv = process.argv.slice(2);
	const watchMode = argv[0] === "--watch";

	const config = {
		entryPoints: ["./src/cli.ts"],
		bundle: true,
		outdir: "./dist",
		platform: "node",
		format: "cjs",
	};

	const runBuild = async () => {
		await build(config);
		await build({...config, outdir: undefined, outfile: '../worker/bin/r2-explorer.js'});
	};

	const runWatch = async () => {
		let ctx = await context(config);
		await ctx.watch();
		console.log("Watching...");
	};

	if (watchMode) {
		await runWatch();
	} else {
		await runBuild();
	}
};

run().catch((error) => {
	console.error(error);
	process.exit(1);
});
