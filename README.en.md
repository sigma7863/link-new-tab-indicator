# New Tab Link Indicator

English | [日本語](README.md)

A Chrome extension that visually marks elements that open in a new tab (via target="_blank" or window.open()) with a ↗ icon.

## Tech Stack

- TypeScript
- esbuild
- Bun
- Chrome Extension Manifest V3

## Setup

```bash
bun install
bun run build
```

After building, the following files will be generated in the dist directory:

- `dist/manifest.json`
- `dist/content.js`
- `dist/styles.css`

## Load into Chrome

1. Open chrome://extensions
2. Enable Developer mode (top-right)
3. Click Load unpacked
4. Select the dist folder

## Detection

- Static detection: a[target="_blank"]
- Static fallback detection: Elements whose onclick attribute contains window.open
- Dynamic detection: Elements that invoke window.open() immediately after a user click

## Notes

- window.open() is detected when it is actually executed.
- window.open() calls that are not triggered by a user click are not marked.
