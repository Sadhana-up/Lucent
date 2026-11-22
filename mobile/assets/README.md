# Expo Logo Asset Package

Prepared from your supplied mountain/sunrise droplet logo.

## Files
- `icon.png` — 1024×1024 app icon on warm cream background
- `logo-transparent.png` — transparent logo for app UI and web
- `android-icon-foreground.png` — Android adaptive icon foreground (transparent, safe-zone sized)
- `android-icon-background.png` — Android adaptive icon background (cream)
- `android-icon-monochrome.png` — monochrome adaptive icon layer
- `splash-icon.png` — centered splash-screen logo on cream
- `logo-dark.png` — logo on dark forest-green background

## Brand colors
- Forest green: `#174A36` (approximate)
- Warm cream: `#FDF7EB`
- Pink/purple sunrise: retained from source artwork
- Dark background: `#123024`

## Expo app.json snippet
Merge these fields into your existing Expo config (don't replace unrelated settings):

```json
{
  "expo": {
    "icon": "./assets/branding/icon.png",
    "backgroundColor": "#FDF7EB",
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/branding/android-icon-foreground.png",
        "backgroundImage": "./assets/branding/android-icon-background.png",
        "monochromeImage": "./assets/branding/android-icon-monochrome.png",
        "backgroundColor": "#FDF7EB"
      }
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FDF7EB",
          "image": "./assets/branding/splash-icon.png",
          "imageWidth": 220
        }
      ]
    ]
  }
}
```

## Installation
1. Extract this zip.
2. Copy the `assets` files into your Expo project (suggested folder: `assets/branding/`).
3. Merge the configuration above into your `app.json` or `app.config.js`.
4. Run a new native build to apply icon and splash assets; a regular JS reload won't update installed app icons.

Note: The transparent version was extracted from the cream background by color-based processing. Inspect it against both light and dark backgrounds before production. The original logo artwork is raster, so these assets are PNG rather than vector SVG.
