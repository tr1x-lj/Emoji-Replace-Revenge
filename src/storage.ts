declare const bunny: any;

export const PROVIDERS = [
    "Apple",
    "BlobMoji",
    "Facebook",
    "Google",
    "Huawei",
    "JoyPixels",
    "Microsoft",
    "Microsoft-3D",
    "OpenMoji",
    "Samsung",
    "Samsung-Old",
    "Toss",
    "WhatsApp",
] as const;

export type Provider = typeof PROVIDERS[number];

interface EmojiReplaceStorage {
    provider?: Provider;
}

let storage: EmojiReplaceStorage | null = null;

// bunny.plugin.createStorage() ties the file to this plugin's own
// plugins/storage/<id>.json automatically - confirmed from Revenge's
// createBunnyPluginApi(). It returns an Observable-backed proxy: writing
// to a property persists it (debounced) and re-renders any component
// that called useObservable on it.
export function getStorage(): EmojiReplaceStorage {
    if (!storage) storage = bunny.plugin.createStorage<EmojiReplaceStorage>();
    return storage;
}

export function getProvider(): Provider {
    return getStorage().provider ?? "Apple";
}

export function setProvider(provider: Provider) {
    getStorage().provider = provider;
}
