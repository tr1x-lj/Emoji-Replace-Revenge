// Bundles src/index.ts into dist/builds/emojireplace/index.js as an IIFE
// with globalName "plugin" - this matches exactly how Revenge's own loader
// evaluates external plugins (see src/lib/addons/plugins/index.ts,
// startPlugin(): `(bunny,definePlugin)=>{${iife};return plugin?.default ?? plugin;}`).
// esbuild's --global-name=plugin output wraps the whole module exports as
// `var plugin = (() => {...})()`, so `plugin.default` resolves correctly
// since this plugin's entry does `export default definePlugin({...})`.
//
// bunny/definePlugin are never imported here - they're referenced as bare
// identifiers (see the `declare const bunny` lines in src/), which is
// exactly right: at eval time they're supplied as closure parameters by
// Revenge's loader, so they must NOT be bundled in.

import { build } from "esbuild";
import { cp, mkdir, readFile, writeFile } from "fs/promises";

const OUT_DIR = "dist/builds/emojireplace";

await mkdir(OUT_DIR, { recursive: true });

await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: `${OUT_DIR}/index.js`,
    format: "iife",
    globalName: "plugin",
    target: "es2020",
    minify: true,
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    logLevel: "info",
});

// Copy manifest.json + repo.json into place for hosting.
await cp("manifest.json", `${OUT_DIR}/manifest.json`);
await cp("repo.json", "dist/repo.json");

console.log("Built dist/ - ready to host (e.g. via GitHub Pages).");
