# New Tab Link Indicator

日本語 | [English](README.en.md)

`target="_blank"` または `onclick` 属性の `window.open()` で新しいタブを開く要素を、`↗` アイコンで可視化する Chrome 拡張です。
画像ファイルへ直接リンクしている要素には `img` バッジも表示します。

## Tech Stack

- TypeScript
- esbuild
- bun
- Chrome Extension Manifest V3

## インストール

1. [Releases](https://github.com/sigma7863/link-new-tab-indicator/releases/latest) を開く
2. 最新リリースの `link-new-tab-indicator.zip` をダウンロード
3. ZIP ファイルを展開
4. Chrome で `chrome://extensions` を開く
5. 右上の「デベロッパーモード」を ON
6. 「パッケージ化されていない拡張機能を読み込む」
7. 展開したフォルダを選択

## 開発者向け

```bash
bun install
bun run build
```

ビルド後、`dist` フォルダに以下が生成されます。

- `dist/manifest.json`
- `dist/content.js`
- `dist/styles.css`

## 検出仕様

- 静的検出: `a[target="_blank"]`
- 静的補助検出: `onclick` 属性に `window.open` を含む要素
- 画像リンク検出: `href` の拡張子または `type` 属性が画像を指すリンク

## 注意点

- クリック直後に初めて `target="_blank"` や `window.open()` が判明する要素は、押した後だけ `↗` が出ないように後追いではマークしません。
- 画像リンクは URL または `type="image/..."` から判断できる場合にマークします。
