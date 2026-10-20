/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

const { configure } = require("quasar/wrappers");
const path = require("node:path");

module.exports = configure((/* ctx */) => ({
	// eslint: {
	// fix: true,
	// include: [],
	// exclude: [],
	// rawOptions: {},
	// warnings: true,
	// errors: true
	// },

	// https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
	preFetch: true,

	// app boot file (/src/boot)
	// --> boot files are part of "main.js"
	// https://v2.quasar.dev/quasar-cli-vite/boot-files
	boot: ["axios", "auth", "bus"],

	// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
	css: ["app.scss"],

	// https://github.com/quasarframework/quasar/tree/dev/extras
	extras: [
		// 'ionicons-v4',
		// 'mdi-v5',
		// 'fontawesome-v6',
		// 'eva-icons',
		// 'themify',
		// 'line-awesome',
		// 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

		"roboto-font", // optional, you are not bound to it
		"material-icons", // optional, you are not bound to it
	],

	// Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
	build: {
		env: require("dotenv").config().parsed,
		target: {
			// Minimum browsers for vue-pdf-embed's bundled pdf.js 6, which
			// needs Promise.withResolvers (Chrome 119+) and Promise.try
			// (Chrome 128+, Firefox 134+, Safari 18.2+) on its worker
			// messaging hot path. See vite-preload-helper-shim.js.
			browser: ["es2022", "edge128", "firefox134", "chrome128", "safari18.2"],
			node: "node16",
		},

		vueRouterMode: "history", // available values: 'hash', 'history'
		// vueRouterBase,
		// vueDevtools,
		// vueOptionsAPI: false,

		// rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

		publicPath: "/",
		// analyze: true,
		// env: {},
		// rawDefine: {}
		// ignorePublicFolder: true,
		// minify: false,
		// polyfillModulePreload: true,
		// distDir

		// extendViteConf (viteConf) {},
		// viteVuePluginOptions: {},
		extendViteConf(viteConf) {
			// Shim for the `vite/preload-helper` virtual module, which Vite 2
			// injects for dynamic `import()` calls (e.g. inside vue-pdf-embed's
			// bundled pdf.js) but never provides itself. Without this alias the
			// build fails in `vite:resolve` because pnpm hoisting exposes a
			// vite 5 copy whose `exports` map rejects the subpath. See
			// vite-preload-helper-shim.js. Remove once Vite >= 3 is used.
			viteConf.resolve = viteConf.resolve || {};
			const alias = viteConf.resolve.alias || [];
			const entries = Array.isArray(alias)
				? alias
				: Object.entries(alias).map(([find, replacement]) => ({
						find,
						replacement,
					}));
			entries.push({
				find: "vite/preload-helper",
				replacement: path.join(__dirname, "vite-preload-helper-shim.js"),
			});
			viteConf.resolve.alias = entries;
		},

		// vitePlugins: [
		//   [ 'package-name', { ..options.. } ]
		// ]
	},

	// Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
	devServer: {
		// https: true
		open: true, // opens browser window automatically
	},

	// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
	framework: {
		config: {},

		// iconSet: 'material-icons', // Quasar icon set
		// lang: 'en-US', // Quasar language pack

		// For special cases outside of where the auto-import strategy can have an impact
		// (like functional components as one of the examples),
		// you can manually specify Quasar components/directives to be available everywhere:
		//
		// components: [],
		// directives: [],

		// Quasar plugins
		plugins: ["Notify", "Dialog"],
	},

	// animations: 'all', // --- includes all animations
	// https://v2.quasar.dev/options/animations
	animations: [],

	// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#property-sourcefiles
	// sourceFiles: {
	//   rootComponent: 'src/App.vue',
	//   router: 'src/router/index',
	//   store: 'src/store/index',
	//   registerServiceWorker: 'src-pwa/register-service-worker',
	//   serviceWorker: 'src-pwa/custom-service-worker',
	//   pwaManifestFile: 'src-pwa/manifest.json',
	//   electronMain: 'src-electron/electron-main',
	//   electronPreload: 'src-electron/electron-preload'
	// },

	// https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
	ssr: {
		// ssrPwaHtmlFilename: 'offline.html', // do NOT use index.html as name!
		// will mess up SSR

		// extendSSRWebserverConf (esbuildConf) {},
		// extendPackageJson (json) {},

		pwa: false,

		// manualStoreHydration: true,
		// manualPostHydrationTrigger: true,

		prodPort: 3000, // The default port that the production server should use
		// (gets superseded if process.env.PORT is specified at runtime)

		middlewares: [
			"render", // keep this as last one
		],
	},

	// https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
	pwa: {
		workboxMode: "generateSW", // or 'injectManifest'
		injectPwaMetaTags: true,
		swFilename: "sw.js",
		manifestFilename: "manifest.json",
		useCredentialsForManifestTag: false,
		// useFilenameHashes: true,
		// extendGenerateSWOptions (cfg) {}
		// extendInjectManifestOptions (cfg) {},
		// extendManifestJson (json) {}
		// extendPWACustomSWConf (esbuildConf) {}
	},

	// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
	cordova: {
		// noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
	},

	// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
	capacitor: {
		hideSplashscreen: true,
	},

	// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
	electron: {
		// extendElectronMainConf (esbuildConf)
		// extendElectronPreloadConf (esbuildConf)

		// specify the debugging port to use for the Electron app when running in development mode
		inspectPort: 5858,

		bundler: "packager", // 'packager' or 'builder'

		packager: {
			// https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
			// OS X / Mac App Store
			// appBundleId: '',
			// appCategoryType: '',
			// osxSign: '',
			// protocol: 'myapp://path',
			// Windows only
			// win32metadata: { ... }
		},

		builder: {
			// https://www.electron.build/configuration/configuration

			appId: "r2-explorer-dashboard",
		},
	},

	// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
	bex: {
		contentScripts: ["my-content-script"],

		// extendBexScriptsConf (esbuildConf) {}
		// extendBexManifestJson (json) {}
	},
}));
