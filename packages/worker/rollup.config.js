import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import bundleSize from "rollup-plugin-bundle-size";
import copy from "rollup-plugin-copy";

export default defineConfig({
	input: "src/index.ts",
	output: [
		{ format: "cjs", file: "dist/index.js" },
		{ format: "es", file: "dist/index.mjs" },
	],
	plugins: [
		typescript({
			sourceMap: false,
			filterRoot: "src",
		}),
		terser(),
		bundleSize(),
		copy({
			targets: [
				{
					src: ["../LICENSE", "../README.md"],
					dest: ".",
				},
			],
		}),
	],
	external: [
		"itty-router",
		"zod",
		"@cloudflare/itty-router-openapi",
		"postal-mime",
	],
});
