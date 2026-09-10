# EmojiReplace for Revenge

Ports DevilBro's BetterDiscord theme ["EmojiReplace"](https://github.com/mwittrien/BetterDiscordAddons/tree/master/Themes/EmojiReplace)
to [Revenge](https://github.com/revenge-mod/revenge-bundle), so standard
unicode emoji render using a different provider's art (Apple, Google,
WhatsApp, etc) instead of Discord's default set. Custom server emoji are
left untouched.

Unlike Rain, Revenge genuinely supports installing plugins from a URL at
runtime — this repo is built to be hosted and added that way, no custom
app build required.

## One-time setup before it'll actually work

Every part of this plugin is built from real, confirmed Revenge/Discord
APIs (`bunny.api.patcher`, `bunny.metro.findByPropsLazy`,
`bunny.metro.common.TableRadioGroup`, `bunny.plugin.createStorage`, all
verified against Revenge's actual source) except one: the exact name of
the internal Discord function that turns an emoji into a render URL. That
function lives in Discord's own compiled app bundle, not in any mod's
source, so it can't be found by reading code — only by inspecting it at
runtime.

1. In `src/index.ts`, uncomment `debugListEmojiUtilsKeys();` inside
   `start()`.
2. Build (`npm run build`), host, install (see below), and check
   Discord's log output (adb logcat on Android, or the Safari/Xcode
   console if using RevengeTweak on iOS) for
   `[EmojiReplace] EmojiUtils keys: [...]`.
3. Find the URL-getter in that list — likely named `getURL`,
   `getEmojiURL`, or similar.
4. Set `URL_FN_NAME` in `src/index.ts` to the real name.
5. Comment the debug line back out, rebuild, and push.

Until this is set correctly, the plugin loads and shows a toast saying it
couldn't find the function — it won't crash anything, it just won't do
anything either.

## Build

```
npm install
npm run build
```

This produces `dist/builds/emojireplace/index.js` (the bundled plugin, an
IIFE matching exactly how Revenge's loader evaluates external plugins)
and `dist/repo.json` + `dist/builds/emojireplace/manifest.json`.

## Host it

The included GitHub Actions workflow (`.github/workflows/deploy.yml`)
builds and deploys `dist/` to GitHub Pages automatically on every push to
`main`. After your first push:

1. Go to the repo's Settings → Pages
2. Set Source to "GitHub Actions"
3. Wait for the workflow to finish (check the Actions tab)
4. Your repo.json will be live at
   `https://<your-username>.github.io/<repo-name>/repo.json`

## Install in Revenge

1. Open Discord (with Revenge running)
2. Settings → Plugins → Plugin Browser
3. "Add Repository"
4. Paste the full `repo.json` URL from above
5. Find "EmojiReplace" in the list and install it

## How it works

- `providers.ts` fetches the same per-category CSS files the original
  theme's `base/<Provider>.css` imports from `mwittrien.github.io`,
  parses `shortcode -> png url` pairs out of them, and caches the result
  per provider.
- `index.ts` patches the emoji URL function. For standard unicode emoji
  it converts the surrogate to a shortcode using Discord's own
  `convertSurrogateToName` (confirmed to exist via
  `findByPropsLazy("convertSurrogateToName")`, the same module Revenge's
  and Rain's own emoji-related code already resolves), looks it up in the
  cached map, and returns the replacement URL. Custom guild emoji pass
  through untouched.
- `settings.tsx` is a provider picker built with Revenge's own
  `TableRadioGroup`/`TableRadioRow` components (confirmed from
  `src/metro/common/components.ts`), so it matches the native settings
  look.

## Credit

Emoji mapping and image assets are DevilBro's, from the original
[EmojiReplace BetterDiscord theme](https://github.com/mwittrien/BetterDiscordAddons/tree/master/Themes/EmojiReplace).
This repo only ports the *mechanism* to Revenge's plugin API; it fetches
the image data live from the original theme's hosting rather than
bundling it.
