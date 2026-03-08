# FX Strategy Doctor

## プロジェクト概要
MT4/MT5のトレード履歴CSV/Excelを解析し、戦略評価レポートを自動生成するWebアプリ。
ターゲット: FXトレーダー（裁量・EA開発者）。日本語/英語バイリンガル対応。

## アーキテクチャ
- **フロントエンド**: React 19 + TypeScript + Vite + Tailwind CSS 4 + shadcn/ui
- **バックエンド**: Express.js（開発用）/ Cloudflare Pages + Workers Functions（本番）
- **データ保存**: Cloudflare KV（購入者アカウント管理）
- **ルーティング**: Wouter（軽量クライアントサイドルーティング）
- **チャート**: Recharts
- **アニメーション**: Framer Motion
- **CSV解析**: PapaParse / XLSX

## ディレクトリ構成

```
client/src/
├── pages/          # ルートページ（Home, Login, Admin, Terms）
├── components/     # UIコンポーネント
│   └── ui/         # shadcn/ui基盤コンポーネント
├── contexts/       # React Context（Analysis, Auth, Language, Theme）
├── lib/            # コアビジネスロジック（※最重要）
│   ├── analysis.ts     # 戦略スコアリング・35パターン分析・改善提案
│   ├── csvParser.ts    # MT4/MT5 CSV解析
│   ├── excelParser.ts  # Excel解析
│   ├── htmlParser.ts   # HTML解析
│   ├── reportGenerator.ts # HTML/CSVレポート出力
│   ├── simulation.ts   # モンテカルロシミュレーション
│   └── sampleData.ts   # デモデータ
└── hooks/          # カスタムフック

server/             # Express.jsサーバー（開発用）
functions/api/      # Cloudflare Workers Functions（本番API）
shared/             # フロント・バックエンド共有定数
```

## 重要な設計判断

### 分析エンジン（analysis.ts）
- **35個の分析パターン**を実装済み。各パターンにデータの深刻度（軽度/中度/重度）に応じたアドバイス分岐がある
- パターンは以下のカテゴリに分類:
  - リスク管理（PF, DD, 最大損失, デイリーストップロス, ロットトレンド）
  - エントリー/イグジット（RR, 勝率, 早期利確, 遅延損切り, 勝率vsRR貢献度）
  - メンタル管理（連敗, 過信, 利益吐き出し, 過剰トレード, ティルト, 連敗パターン）
  - 通貨ペア選定（弱い通貨ペア, 集中度, 損失後のペア変更）
  - 時間管理（弱い時間帯, セッション別, 金曜日, 曜日回避）
  - 戦略全体（期待値, 前後半比較, 月次トレンド, コツコツドカン）
- **戦略スコア**: 100点満点の複合スコア（PF, RR, WR, DD, 期待値, 連敗を重み付け）
- **リスク診断**: 5項目の3段階（低/中/高）評価

### UIデザイン
- Bloomberg Terminal / TradingView風のダークUI
- 配色: ダークネイビー(#0A0E1A) + エメラルドグリーン(#00D4AA) + コーラルレッド(#FF4757)
- データ密度を重視したグリッドレイアウト

### 認証
- 管理者: 環境変数 `ADMIN_PASSWORD` で認証
- 購入者: Cloudflare KVに保存されたアカウントで認証
- クライアント側はLocalStorageでセッション管理

### i18n
- `LanguageContext`で日本語/英語を切り替え
- 分析パターンのアドバイスも全て日英対応

## 開発コマンド

```bash
npm install          # 依存関係インストール
npm run dev          # 開発サーバー起動（Vite :3000 + Express :3001）
npm run build        # 本番ビルド（Vite + esbuild）
npm run build:cf     # Cloudflare Pages用ビルド（Viteのみ）
npm run deploy       # Cloudflare Pagesにデプロイ
npm run check        # TypeScript型チェック
npm run format       # Prettierでフォーマット
```

## デプロイ
- **本番環境**: Cloudflare Pages + Workers Functions
- **設定ファイル**: `wrangler.toml`（プロジェクト名: `fx-strategy-doctor`）
- **KVバインディング**: `BUYERS_KV`（購入者アカウント管理用）

## コーディング規約
- TypeScript strict mode
- Prettierによる自動フォーマット
- shadcn/uiコンポーネントは `client/src/components/ui/` に配置
- パス別名: `@/*` → `client/src/*`, `@shared/*` → `shared/*`
