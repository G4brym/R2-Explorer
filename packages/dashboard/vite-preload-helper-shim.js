/**
 * Build-time shim for the `vite/preload-helper` virtual module.
 *
 * Vite 2 (used via @quasar/app-vite v1) rewrites every dynamic `import()`
 * found during a production build to go through a `__vitePreload` helper
 * imported from the virtual `vite/preload-helper` module, which Vite itself
 * is supposed to provide. Vite 2.9 never handles that specifier when the
 * bare `vite` package cannot be resolved to a copy without an `exports`
 * map: here pnpm hoisting exposes vite 5 (a vitest dependency) whose
 * `exports` map has no `./preload-helper` entry, so `vite:resolve` throws
 * `Missing "./preload-helper" export in "vite" package` and the build
 * fails as soon as any bundled dependency contains a real dynamic import.
 * vue-pdf-embed does: its bundled pdf.js lazy-loads the worker
 * (`import(this.workerSrc)`) and a QuickJS sandbox the same way.
 *
 * This file mirrors the helper code Vite 2.9 generates itself (same
 * semantics; `base` matches quasar `publicPath: "/"`). It is only a
 * fallback so module resolution succeeds; source files that Vite can
 * resolve `vite` for keep working as before.
 *
 * NOTE: `__VITE_IS_MODERN__` must stay an undeclared free variable. Vite's
 * `renderChunk` replaces it with `true`/`false` in the emitted chunk, just
 * like it does for its own generated helper. Do not declare or rename it.
 *
 * Safe to delete this file (and the alias in quasar.config.js) once the
 * build uses Vite >= 3, which ships the real `vite/preload-helper` export.
 */
const scriptRel = "modulepreload";
const seen = {};
const base = "/";

export const __vitePreload = function preload(baseModule, deps) {
	// @ts-expect-error
	if (!__VITE_IS_MODERN__ || !deps || deps.length === 0) {
		return baseModule();
	}
	return Promise.all(
		// biome-ignore lint/suspicious/useIterableCallbackReturn: mirrors Vite 2.9 helper; sparse results intentional.
		deps.map((dep) => {
			// @ts-expect-error
			dep = `${base}${dep}`;
			// @ts-expect-error
			if (dep in seen) {
				return;
			}
			// @ts-expect-error
			seen[dep] = true;
			const isCss = dep.endsWith(".css");
			const cssSelector = isCss ? '[rel="stylesheet"]' : "";
			// @ts-expect-error check if the file is already preloaded by SSR markup
			if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
				return;
			}
			// @ts-expect-error
			const link = document.createElement("link");
			// @ts-expect-error
			link.rel = isCss ? "stylesheet" : scriptRel;
			if (!isCss) {
				link.as = "script";
				link.crossOrigin = "";
			}
			link.href = dep;
			// @ts-expect-error
			document.head.appendChild(link);
			if (isCss) {
				return new Promise((res, rej) => {
					link.addEventListener("load", res);
					link.addEventListener("error", () =>
						rej(new Error(`Unable to preload CSS for ${dep}`)),
					);
				});
			}
		}),
	).then(() => baseModule());
};
