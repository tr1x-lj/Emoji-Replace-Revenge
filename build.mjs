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
const LEGACY_DIR = "dist/builds-legacy/emojireplace";

await mkdir(OUT_DIR, { recursive: true });
await mkdir(LEGACY_DIR, { recursive: true });

// Bunny-native build: repo.json based, installed via "Add Repository"
// if/when that UI is available.
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

await cp("manifest.json", `${OUT_DIR}/manifest.json`);
await cp("repo.json", "dist/repo.json");

// Legacy Vendetta-compat build: single-URL install via the "Install a
// plugin" button. That loader does `vendetta=>{return ${plugin.js}}`, so
// the file must be a bare expression, not a `var x = ...;` statement -
// build with a globalName then strip the assignment wrapper off.
await build({
    entryPoints: ["src/legacy.ts"],
    bundle: true,
    outfile: `${LEGACY_DIR}/index.js`,
    format: "iife",
    globalName: "__legacy_plugin",
    target: "es2020",
    minify: true,
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    logLevel: "info",
});

const legacyRaw = await readFile(`${LEGACY_DIR}/index.js`, "utf8");
const stripped = legacyRaw.replace(/^var __legacy_plugin=/, "").replace(/;\s*$/, "");
await writeFile(`${LEGACY_DIR}/index.js`, stripped);

await writeFile(`${LEGACY_DIR}/manifest.json`, JSON.stringify({
    name: "EmojiReplace",
    description: "Replaces Discord's default emoji with a different provider's (Apple, Google, etc), ported from DevilBro's BetterDiscord theme.",
    authors: [{ name: "Derty" }],
    main: "index.js",
    hash: "1.0.0",
}, null, 4));

console.log("Built dist/ - ready to host (e.g. via GitHub Pages).");
console.log("Bunny repo install:  dist/repo.json");
console.log("Legacy single-URL install: dist/builds-legacy/emojireplace/ (paste that folder's URL, trailing slash optional)");
