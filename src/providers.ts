import { Provider } from "./storage";

const BASE = "https://mwittrien.github.io/BetterDiscordAddons/Themes/EmojiReplace";
const CATEGORIES = ["people", "nature", "food", "activity", "travel", "objects", "symbols", "flags"];
const RULE_RE = /\/\*\s*([a-z0-9_]+)\s*\*\/[\s\S]*?content:\s*url\("([^"]+)"\)\s*!important;/g;

const cache = new Map<Provider, Map<string, string>>();

async function fetchCategory(provider: Provider, category: string): Promise<[string, string][]> {
    const res = await fetch(`${BASE}/src/${provider}/${category}.css`);
    const text = await res.text();
    const pairs: [string, string][] = [];
    for (const match of text.matchAll(RULE_RE)) pairs.push([match[1], match[2]]);
    return pairs;
}

export async function loadEmojiMap(provider: Provider): Promise<Map<string, string>> {
    if (cache.has(provider)) return cache.get(provider)!;

    const map = new Map<string, string>();
    const results = await Promise.allSettled(
        CATEGORIES.map(category => fetchCategory(provider, category))
    );

    for (const result of results) {
        if (result.status === "fulfilled") {
            for (const [name, url] of result.value) map.set(name, url);
        }
    }

    cache.set(provider, map);
    return map;
}

export function clearEmojiMapCache(provider?: Provider) {
    if (provider) cache.delete(provider);
    else cache.clear();
}
