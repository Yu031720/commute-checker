# 通勤チェッカー

今日の目的地までの交通状況(電車・車)と電車遅延情報をまとめて確認するPWA。

## セットアップ

1. 依存関係をインストール

   ```bash
   npm install
   ```

2. `.env.local.example` を `.env.local` にコピーし、APIキーを設定

   ```bash
   cp .env.local.example .env.local
   ```

   - `GOOGLE_MAPS_API_KEY`: Google Cloud Console で Directions API・Geocoding API を有効化して発行したキー
   - `ODPT_API_KEY`: https://developer-dc.odpt.org/ で開発者登録して発行したアクセストークン(コンシューマーキー)

3. 開発サーバーを起動

   ```bash
   npm run dev
   ```

   http://localhost:3000 を開く。

## 構成

- `app/page.tsx` — ホーム画面(目的地選択 + 電車/車タブ)
- `app/destinations/page.tsx` — 目的地の登録・管理(ブラウザの localStorage に保存)
- `app/api/geocode` — 住所→緯度経度変換(Google Geocoding API)
- `app/api/route` — 経路検索(Google Directions API、電車/車)
- `app/api/delays` — 電車遅延情報(ODPT TrainInformation API)
- `lib/odpt-lines.ts` — 路線名 → ODPT路線IDのマッピング(関東圏の主要路線のみ)

## デプロイ (Vercel)

1. GitHubリポジトリをVercelにインポート
2. プロジェクト設定の Environment Variables に `GOOGLE_MAPS_API_KEY` と `ODPT_API_KEY` を設定
3. デプロイ後、スマホのブラウザで開いて「ホーム画面に追加」でPWAとしてインストール可能
