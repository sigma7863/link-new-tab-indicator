# New Tab Link Indicator

English | [日本語](README.md)

A Chrome extension that visually marks elements that open in a new tab (via target="_blank" or an inline window.open()) with a ↗ icon.
Direct links to image files are also marked with an `img` badge.

## Tech Stack

- TypeScript
- esbuild
- Bun
- Chrome Extension Manifest V3

## Install

1. Open [Releases](https://github.com/sigma7863/link-new-tab-indicator/releases/latest)
2. Download `link-new-tab-indicator.zip` from the latest release
3. Extract the ZIP file
4. Open chrome://extensions in Chrome
5. Enable Developer mode (top-right)
6. Click Load unpacked
7. Select the extracted folder

## Development

```bash
bun install
bun run build
```

After building, the following files will be generated in the dist directory:

- `dist/manifest.json`
- `dist/content.js`
- `dist/styles.css`

## Detection

- Static detection: a[target="_blank"]
- Static fallback detection: Elements whose onclick attribute contains window.open
- Image link detection: Links whose href extension or type attribute points to an image

## Notes

- Elements that only reveal target="_blank" or window.open() immediately after a click are not marked afterward, so a ↗ badge does not appear only after the user has already pressed the link.
- Image links are marked when they can be identified from the URL or `type="image/..."`.
