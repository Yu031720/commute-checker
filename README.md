# 通勤チェッカー

今日の目的地までの車の交通状況(渋滞考慮の所要時間)を確認するPWA。

電車遅延情報(ODPT連携)は、対応路線のライセンス条件を確認した結果いったん見送り。詳細は git 履歴の以前のコミットを参照。

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

3. 開発サーバーを起動

   ```bash
   npm run dev
   ```

   http://localhost:3000 を開く。

## 構成

- `app/page.tsx` — ホーム画面(目的地選択 + 車の所要時間表示)
- `app/destinations/page.tsx` — 目的地の登録・管理(ブラウザの localStorage に保存)
- `app/api/geocode` — 住所→緯度経度変換(Google Geocoding API)
- `app/api/route` — 経路検索(Google Directions API、車・渋滞考慮)

## デプロイ (Vercel)

1. GitHubリポジトリをVercelにインポート
2. プロジェクト設定の Environment Variables に `GOOGLE_MAPS_API_KEY` を設定
3. デプロイ後、スマホのブラウザで開いて「ホーム画面に追加」でPWAとしてインストール可能
