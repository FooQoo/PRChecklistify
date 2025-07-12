# PR Checklistify

PR Checklistifyは、Pull Requestのレビューを効率化するためのChrome拡張機能です。
PRレビュー時に、確認すべき項目をチェックリストとして自動生成し、レビュープロセスの抜け漏れを防ぎます。

- チームやプロジェクトごとにチェックリストを管理・共有可能
- React + TypeScript + Viteベースで高速な開発・ビルド体験
- Tailwind CSSによるモダンなUI
- Turborepoによるモノレポ構成

---

## Table of Contents

- [特徴](#特徴)
- [インストール](#インストール)
- [使い方](#使い方)
- [開発方法](#開発方法)
- [ディレクトリ構成](#ディレクトリ構成)
- [ライセンス](#ライセンス)
- [クレジット](#クレジット)

## 特徴

- PR作成・レビュー時に自動でチェックリストを表示
- チェックリストは自由にカスタマイズ・共有可能
- チェック項目の進捗を可視化
- 主要なリポジトリサービスに対応
- シンプルで直感的なUI

## インストール

1. このリポジトリをクローン
2. Node.js（.nvmrc記載バージョン以上）を用意
3. `pnpm install` で依存パッケージをインストール
4. Chromeの場合: `pnpm dev` で開発サーバー起動 → `chrome://extensions` から`dist`ディレクトリを読み込み

## 使い方

1. PRページを開くとレビュー画面が表示されます。
2. AIによってPRの内容を解析したり、チェックリストが自動生成できます（`ai-sdk`ライブラリを使用）。
3. チェック項目を確認しながらレビューを進めてください。
4. わからないことがあればChat AIを利用して質問できます。

## 開発方法
- モノレポ構成（Turborepo）
- React, TypeScript, Vite, Tailwind CSS, ESLint, Prettier などを利用

### .envファイルの作成

以下のコマンドで`.env`ファイルを作成してください（side-panel用）:

```sh
echo 'VITE_OPENAI_API_ENDPOINT=https://api.openai.com/v1' > pages/side-panel/.env
echo 'VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/' >> pages/side-panel/.env
echo 'VITE_GITHUB_API_DOMAIN=https://api.github.com' >> pages/side-panel/.env
```

### OpenAI Compatibility
OpenAI API互換性のため、以下の環境変数を設定可能です。

```sh
echo 'VITE_OPENAI_API_ENDPOINT=https://example.com' >> pages/side-panel/.env
```

## ディレクトリ構成

- `chrome-extension/` ... 拡張機能本体
- `pages/` ... 各種ページ（side-panel）
- `packages/` ... 共有ライブラリ・ユーティリティ

## クレジット

本プロジェクトは以下のテンプレートを利用しています：

- [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)
