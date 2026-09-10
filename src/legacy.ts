// This targets Revenge's legacy "polymanifest" single-URL install path
// (the "Install a plugin" button) - confirmed from src/core/vendetta/plugins.ts.
// That runtime is DIFFERENT from the bunny.* one in index.ts: it passes a
// `vendetta` object (not `bunny`), and expects {onLoad, onUnload}
// (not {start, stop}). The eval wrapper is `vendetta=>{return ${plugin.js}}`,
// meaning the bundle must be a bare expression, not a `var x = ...`
// statement - build.mjs strips the globalName assignment to make that work.

declare const vendetta: any;

const { instead } = vendetta.patcher;
const { findByProps } = vendetta.metro;
const { showToast } = vendetta.metro.common.toasts;
const { React, ReactNative } = vendetta.metro.common;
const { ScrollView, View, Text, TouchableOpacity } = ReactNative;

const PROVIDERS = [
    "Apple", "BlobMoji", "Facebook", "Google", "Huawei", "JoyPixels",
    "Microsoft", "Microsoft-3D", "OpenMoji", "Samsung", "Samsung-Old",
    "Toss", "WhatsApp",
] as const;
type Provider = typeof PROVIDERS[number];

const BASE = "https://mwittrien.github.io/BetterDiscordAddons/Themes/EmojiReplace";
const CATEGORIES = ["people", "nature", "food", "activity", "travel", "objects", "symbols", "flags"];
const RULE_RE = /\/\*\s*([a-z0-9_]+)\s*\*\/[\s\S]*?content:\s*url\("([^"]+)"\)\s*!important;/g;

const mapCache = new Map<Provider, Map<string, string>>();

async function fetchCategory(provider: Provider, category: string): Promise<[string, string][]> {
    const res = await fetch(`${BASE}/src/${provider}/${category}.css`);
    const text = await res.text();
    const pairs: [string, string][] = [];
    for (const match of text.matchAll(RULE_RE)) pairs.push([match[1], match[2]]);
    return pairs;
}

async function loadEmojiMap(provider: Provider): Promise<Map<string, string>> {
    if (mapCache.has(provider)) return mapCache.get(provider)!;
    const map = new Map<string, string>();
    const results = await Promise.allSettled(CATEGORIES.map(c => fetchCategory(provider, c)));
    for (const r of results) if (r.status === "fulfilled") for (const [n, u] of r.value) map.set(n, u);
    mapCache.set(provider, map);
    return map;
}

const EmojiUtils = findByProps("convertSurrogateToName");

// STEP 2 from the README - verify this against your build's debug log.
const URL_FN_NAME = "getURL";

function debugListEmojiUtilsKeys() {
    console.log("[EmojiReplace] EmojiUtils keys:", Object.keys(EmojiUtils ?? {}));
    showToast(`EmojiReplace: logged ${Object.keys(EmojiUtils ?? {}).length} keys`);
}

let unpatch: (() => void) | null = null;
let emojiMap: Map<string, string> | null = null;

function patchEmojiURL() {
    if (typeof EmojiUtils?.[URL_FN_NAME] !== "function") {
        showToast(`EmojiReplace: EmojiUtils.${URL_FN_NAME} not found`);
        return () => {};
    }
    return instead(URL_FN_NAME, EmojiUtils, (args: any[], orig: (...a: any[]) => any) => {
        const emoji = args[0];
        const surrogate = typeof emoji === "string" ? emoji : emoji?.surrogates ?? emoji?.name;
        if (!surrogate || (typeof emoji === "object" && emoji?.id)) return orig(...args);
        const shortcode: string | undefined = EmojiUtils?.convertSurrogateToName?.(surrogate)?.replace(/:/g, "");
        if (!shortcode || !emojiMap) return orig(...args);
        return emojiMap.get(shortcode) ?? orig(...args);
    });
}

function Settings() {
    const storage = vendetta.plugin.storage;
    const [provider, setProviderState] = React.useState<Provider>(storage.provider ?? "Apple");
    const [loading, setLoading] = React.useState(false);

    const select = async (p: Provider) => {
        setLoading(true);
        try {
            emojiMap = await loadEmojiMap(p);
            storage.provider = p;
            setProviderState(p);
        } finally {
            setLoading(false);
        }
    };

    return React.createElement(ScrollView, { style: { flex: 1, padding: 12 } },
        PROVIDERS.map((p: Provider) =>
            React.createElement(TouchableOpacity, {
                key: p,
                onPress: () => select(p),
                style: { paddingVertical: 12, flexDirection: "row", justifyContent: "space-between" },
            },
                React.createElement(Text, {}, p),
                provider === p && React.createElement(Text, {}, loading ? "…" : "✓")
            )
        )
    );
}

export default {
    async onLoad() {
        const storage = vendetta.plugin.storage;
        const provider: Provider = storage.provider ?? "Apple";

        try {
            emojiMap = await loadEmojiMap(provider);
        } catch (e) {
            console.error("[EmojiReplace] Failed to load emoji map", e);
            showToast("EmojiReplace: failed to load emoji pack");
        }

        // Uncomment once to find the real URL_FN_NAME, then remove.
        // debugListEmojiUtilsKeys();

        unpatch = patchEmojiURL();
    },
    onUnload() {
        unpatch?.();
        unpatch = null;
        emojiMap = null;
    },
    settings: Settings,
};
