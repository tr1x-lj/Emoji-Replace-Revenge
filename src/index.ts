declare const bunny: any;
declare const definePlugin: (p: any) => any;

import { loadEmojiMap } from "./providers";
import SettingsComponent from "./settings";
import { getProvider } from "./storage";

const { instead } = bunny.api.patcher;
const { findByPropsLazy } = bunny.metro;
const { showToast } = bunny.ui.toasts;

// Same module Rain's ExpressionUtils plugin already resolves via
// findByPropsLazy("convertSurrogateToName") - this is Discord's own client
// code, identical regardless of which mod (Rain or Revenge) is patching it.
const EmojiUtils = findByPropsLazy("convertSurrogateToName");

let unpatch: (() => void) | null = null;
let emojiMap: Map<string, string> | null = null;

/**
 * STEP 1 - call this once from start() (see the commented-out line below),
 * check the Discord dev console / adb logcat for the printed key list, then
 * remove the call once you've found the real URL-getter function name.
 */
function debugListEmojiUtilsKeys() {
    try {
        const keys = Object.keys(EmojiUtils ?? {});
        console.log("[EmojiReplace] EmojiUtils keys:", keys);
        showToast(`EmojiReplace: logged ${keys.length} EmojiUtils keys to console`);
    } catch (e) {
        console.error("[EmojiReplace] Failed to inspect EmojiUtils", e);
    }
}

// STEP 2 - replace with the real function name found via the debug step.
const URL_FN_NAME = "getURL"; // <-- TODO verify against your build

function patchEmojiURL() {
    if (typeof EmojiUtils?.[URL_FN_NAME] !== "function") {
        showToast(`EmojiReplace: EmojiUtils.${URL_FN_NAME} not found - see debugListEmojiUtilsKeys()`);
        return () => {};
    }

    return instead(URL_FN_NAME, EmojiUtils, (args: any[], orig: (...a: any[]) => any) => {
        const emoji = args[0];

        // Custom guild emoji have an id - leave those alone.
        const surrogate = typeof emoji === "string" ? emoji : emoji?.surrogates ?? emoji?.name;
        if (!surrogate || (typeof emoji === "object" && emoji?.id)) {
            return orig(...args);
        }

        const shortcode: string | undefined = EmojiUtils?.convertSurrogateToName?.(surrogate)?.replace(/:/g, "");
        if (!shortcode || !emojiMap) return orig(...args);

        return emojiMap.get(shortcode) ?? orig(...args);
    });
}

export default definePlugin({
    async start() {
        // Uncomment once to find the real function name, then comment
        // back out.
        // debugListEmojiUtilsKeys();

        try {
            emojiMap = await loadEmojiMap(getProvider());
        } catch (e) {
            console.error("[EmojiReplace] Failed to load emoji map", e);
            showToast("EmojiReplace: failed to load emoji pack");
        }

        unpatch = patchEmojiURL();
    },

    stop() {
        unpatch?.();
        unpatch = null;
        emojiMap = null;
    },

    SettingsComponent,
});
