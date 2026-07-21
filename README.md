# New Tab Link Indicator

日本語 | [English](README.en.md)

`target="_blank"` または `window.open()` で新しいタブを開く要素を、`↗` アイコンで可視化する Chrome 拡張です。

## Tech Stack

- TypeScript
- esbuild
- bun
- Chrome Extension Manifest V3

## セットアップ

```bash
bun install
bun run build
```

ビルド後、`dist` フォルダに以下が生成されます。

- `dist/manifest.json`
- `dist/content.js`
- `dist/styles.css`

## Chrome への読み込み

1. Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」
4. `dist` フォルダを選択

## 検出仕様

- 静的検出: `a[target="_blank"]`
- 静的補助検出: `onclick` 属性に `window.open` を含む要素
- 動的検出: クリック操作の直後に `window.open()` が実行された要素

## 注意点

- `window.open()` は「実行されたとき」に検出します。
- クリックと無関係に発火する `window.open()` はマーク対象外です。
