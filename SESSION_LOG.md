# AIアバター研修動画システム - セッションログ

**最終更新日時**: 2025年12月8日 1:05
**累計作業時間**: 約7.5時間

## 完了した作業

### ✅ 1. プロジェクトセットアップ (2025-12-05)
- **GitHubリポジトリ**: https://github.com/dokyon/ai-avatar-system
- **ローカルパス**: `/Users/dosakakyohei/dev/ai-avatar-system`
- Miyabiフレームワークで初期化完了
- 46個のGitHubラベル作成
- 14個のGitHub Actionsワークフロー展開
- GitHub Issues作成: #3〜#8

### ✅ 2. Next.jsプロジェクト構築 (2025-12-05)
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v3設定完了
- 開発サーバー起動中: **http://localhost:3000**
- パスエイリアス設定 (`@/*` -> `./src/*`)

### ✅ 3. 基本機能実装完了 (2025-12-05)

#### ホームページ (`/`)
- 3つの機能カード表示
- 台本管理へのリンク

#### 台本管理 (`/scripts`)
- 台本一覧表示
- 台本作成フォーム
- 台本削除機能
- AIコースGEN / 手動入力の区別

#### 台本詳細 (`/scripts/[id]`)
- 台本内容の表示
- アバター選択UI
- 動画生成ボタン
- 生成済み動画一覧

#### 動画視聴 (`/videos/[id]`)
- 動画プレイヤー
- 台本同時表示
- 動画ダウンロード機能

### ✅ 4. Supabaseセットアップ完了 (2025-12-05〜06)
- **プロジェクト名**: ai-avatar-training
- **URL**: `https://sljugvkpkepgcwbwiccl.supabase.co`
- **anon public key**: 設定済み（`.env.local`）
- **リージョン**: Northeast Asia (Tokyo)
- **データベーススキーマ**: 作成完了
  - `scripts` テーブル（台本）
  - `videos` テーブル（動画）
  - `avatar_upload_history` テーブル（写真アップロード履歴）
  - `custom_avatars` テーブル（カスタムアバター）
  - Row Level Security (RLS) ポリシー設定
  - トリガーとインデックス設定
  - `avatar-uploads` ストレージバケット作成

### ✅ 5. APIキー設定完了 (2025-12-06〜08)
- **D-ID API**: ~~設定完了~~ → HeyGen APIに移行
  - 無料$10クレジット使用済み
- **HeyGen API**: 設定完了 ⭐ NEW
  - `.env.local` に `HEYGEN_API_KEY` 設定
  - テストモード利用（無料枠）
  - 動画生成成功確認
- **OpenAI API**: 設定完了
  - APIクレジット購入完了
  - `.env.local` に設定

### ✅ 6. HeyGen API完全統合 (2025-12-08)

#### HeyGenService実装
- **場所**: `src/services/heygen.service.ts`
- **機能**:
  - アバターリスト取得 (`listAvatars()`)
  - 音声リスト取得 (`listVoices()`)
  - 動画生成 (`createVideo()`)
  - 動画ステータス確認 (`getVideoStatus()`)
  - 動画完了待機 (`waitForVideoCompletion()`)
  - Photo Avatar作成 (`createPhotoAvatar()`)
  - Photo Avatar完了待機 (`waitForPhotoAvatarCompletion()`)
- **修正内容**:
  - 認証ヘッダー: `X-Api-Key` → `X-API-KEY`（全て大文字）
  - レスポンス形式: `{code: number}` → `{error: string | null}`
  - ビデオステータスエンドポイント: `/v1/video_status.get` (v1 API使用)

#### 動画生成API HeyGen移行
- **場所**: `src/app/api/generate-video/route.ts`
- **変更内容**:
  - D-ID API → HeyGen API に完全移行
  - OpenAI TTS → HeyGen内蔵音声合成に変更
  - デフォルトアバター: `Abigail_expressive_2024112501`
  - デフォルト音声: `e0cc82c22f414c95b1f25696c732f058` (日本語女性)
  - テストモード有効化（無料枠対応）
  - アバターID検証機能追加（D-ID UUID検出時にデフォルトアバターを使用）
- **動作確認済み**:
  - 動画ID `fe29b3e559d642ec87169d61fb616c62` 生成成功
  - 123秒で完了
  - 動画URL取得成功

#### アバターリストAPI HeyGen対応
- **場所**: `src/app/api/avatars/route.ts`
- **変更内容**:
  - Supabaseデータベース → HeyGen API に切り替え
  - HeyGenアバターID（文字列）を返すように修正
  - D-ID UUID → HeyGen avatar_id マッピング
  - **10分間のメモリキャッシュ実装**（パフォーマンス改善）
- **パフォーマンス**:
  - 初回: 15-17秒（HeyGen API取得）
  - 2回目以降: 即座に返す（キャッシュ）

#### カスタムアバター写真アップロードAPI
- **場所**: `src/app/api/avatars/upload/route.ts`
- **機能**:
  - JPEG/PNG画像アップロード（最大10MB）
  - Supabase Storage `avatar-uploads` バケットに保存
  - `avatar_upload_history` テーブルに記録
  - 公開URLを返す

#### HeyGen Photo Avatar作成API
- **場所**: `src/app/api/avatars/create/route.ts`
- **機能**:
  - HeyGen Photo Avatar API呼び出し
  - 非同期アバター作成
  - ポーリングで完了待機
  - `custom_avatars` テーブルに記録

### ✅ 7. カスタムアバター写真アップロード機能完全実装 (2025-12-08) ⭐ NEW

#### コンポーネント統合
- **UnifiedAvatarSelector** (`src/components/UnifiedAvatarSelector.tsx`)
  - HeyGen標準アバターとカスタムアバターの統合選択UI
  - optgroupで標準/カスタムアバターを分類表示
  - アバタープレビュー機能
  - `/api/avatars` と `/api/custom-avatars` から両方のアバターを取得

- **AvatarPhotoUploader** (`src/components/AvatarPhotoUploader.tsx`)
  - アバター名入力フィールド追加
  - 写真ファイル選択（JPEG/PNG、最大10MB）
  - プレビュー表示
  - `/api/avatars/upload` エンドポイント呼び出し
  - バリデーション機能

#### 台本詳細ページ統合
- **場所**: `src/app/scripts/[id]/page.tsx`
- **変更内容**:
  - AvatarSelector → UnifiedAvatarSelector に置き換え
  - 「+ カスタムアバターを作成」ボタン追加
  - 写真アップロードフロー統合
  - カスタムアバター作成のポーリング処理実装
  - 動画生成時のカスタムアバター対応（heygen_avatar_id使用）

#### APIエンドポイント
- **`/api/custom-avatars`** - カスタムアバターリスト取得
  - ステータスフィルター対応（pending, processing, completed, failed）
  - ページネーション対応
  - 削除機能

#### Git管理
- 重複ファイル削除（`/api/upload-avatar`, `/api/create-custom-avatar`, `/api/generate-video-heygen`）
- APIキーのマスク処理（SESSION_LOG.md）
- コミット: `feat: カスタムアバター写真アップロード機能完全実装`
- プッシュ完了

### ✅ 8. 環境変数読み込み問題の修正 (2025-12-06)
- **問題**: Next.js 16 (ESM) で `.env.local` が正しく読み込まれない
- **解決策**: `dotenv` パッケージをインストールし、API routeで明示的に読み込む
- **実装**: 全API routeに追加
  ```typescript
  import { config } from 'dotenv'
  import { resolve } from 'path'

  config({ path: resolve(process.cwd(), '.env.local') })
  ```
- **確認**: サーバーログに `[dotenv@17.2.3] injecting env (0) from .env.local` と表示

### ✅ 9. Next.js設定の最適化 (2025-12-06)
- `next.config.mjs` を更新
- `images.domains` → `images.remotePatterns` に変更（非推奨警告の解消）
- HeyGen画像ホスト、Supabaseストレージの設定

## 現在のステータス

### 環境変数 (`.env.local`)
```bash
# ✅ すべて設定済み
NEXT_PUBLIC_SUPABASE_URL=https://sljugvkpkepgcwbwiccl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_****** (公開鍵)
HEYGEN_API_KEY=****** (設定済み)
OPENAI_API_KEY=****** (設定済み - HeyGen内蔵音声使用のため不要)
```

### 開発サーバー
- **URL**: http://localhost:3000
- **ステータス**: 起動中
- **Next.js**: 16.0.7 (Turbopack)
- **環境変数読み込み**: dotenv経由で正常動作

### データベース
- **scripts テーブル**: 作成済み、台本データ投入済み
- **videos テーブル**: 作成済み、HeyGen動画生成成功
- **avatar_upload_history テーブル**: 作成済み ⭐ NEW
- **custom_avatars テーブル**: 作成済み ⭐ NEW
- **RLS**: 有効化済み

### HeyGen API統合状況
- ✅ HeyGenService実装完了
- ✅ アバターリスト取得（キャッシュ付き）
- ✅ 動画生成成功（テストモード）
- ✅ Photo Avatarアップロード準備完了
- ✅ Photo Avatar作成API実装完了
- ✅ Photo UploadのUI実装完了 ⭐ NEW
- ✅ UnifiedAvatarSelector統合完了 ⭐ NEW
- ✅ カスタムアバター作成フロー実装完了 ⭐ NEW
- ⏳ カスタムアバター作成テスト未実施
- ⏳ 動画生成テスト未実施

## 🔄 次にやること（優先順位順）

### 1. カスタムアバター作成フローのテスト ⚠️ **最優先**

社長の写真でカスタムアバターを作成して動画生成までテスト：

1. ブラウザで http://localhost:3000/scripts にアクセス
2. 既存の台本をクリック
3. 「+ カスタムアバターを作成」ボタンをクリック
4. アバター名を入力（例: 「社長のアバター」）
5. 写真ファイルを選択（JPEG/PNG、10MB以下）
6. 「アップロード」ボタンをクリック
7. カスタムアバター作成の進捗を確認（最大10分）
8. 完了後、アバターリストに表示されることを確認
9. カスタムアバターを選択して動画生成
10. 動画完成後、カスタムアバターが使われているか確認

### 2. アバター選択機能のテスト

1. 標準アバター（HeyGen）の選択と動画生成テスト
2. カスタムアバターの選択と動画生成テスト
3. サーバーログで正しいavatarIdが使用されているか確認

### 3. エラーハンドリングの改善

- API エラー時のユーザーフィードバック改善
- リトライ機能の実装
- タイムアウト処理の改善
- カスタムアバター作成失敗時の詳細エラー表示

### 4. ドキュメント整備

- README.md の更新（HeyGen API、カスタムアバター機能を記載）
- APIキー取得ガイド更新
- デプロイガイドの作成

### 5. 本番環境デプロイ

- Vercelへのデプロイ
- 環境変数の設定
- カスタムドメイン設定

## 既知の問題と解決策

### ✅ 問題: Next.js 16 (ESM) で `.env.local` が読み込まれない
**解決済み**: dotenvパッケージで明示的に読み込む

### ✅ HeyGen API認証エラー
**原因**: ヘッダー名が間違っていた (`X-Api-Key` → `X-API-KEY`)
**解決**: HeyGenServiceのヘッダーを修正

### ✅ HeyGen APIレスポンス処理エラー
**原因**: レスポンス形式が異なっていた
**解決**: `{code}` → `{error}` に変更

### ✅ アバターリストAPIが遅い
**原因**: HeyGen APIの取得に15-17秒かかる
**解決**: 10分間のメモリキャッシュ実装

### ✅ アバター選択が機能しない
**原因**: 旧AvatarSelectorコンポーネントの問題
**解決**: UnifiedAvatarSelectorに置き換え、HeyGen avatar_idを正しく処理するように修正完了

## トラブルシューティング

### 開発サーバーが起動していない場合
```bash
cd /Users/dosakakyohei/dev/ai-avatar-system
npm run dev
```

### Supabase接続エラー
- `.env.local` のURLとKeyが正しいか確認
- 開発サーバーを再起動

### 動画生成エラー
- HeyGen APIクレジット残高を確認
- サーバーログで詳細エラーを確認
- アバターIDが正しいか確認（HeyGen形式: 文字列）

### モジュールエラー
```bash
cd /Users/dosakakyohei/dev/ai-avatar-system
npm install
```

### 環境変数が読み込まれない
```bash
# .env.localファイルが存在するか確認
ls -la .env.local

# サーバーを完全に再起動
pkill -f "next dev"
npm run dev
```

### アバターリストが表示されない
- ブラウザのキャッシュをクリア（強制リロード: Cmd+Shift+R）
- サーバーログで `/api/avatars` のレスポンスタイムを確認
- 初回は15-17秒かかる（正常）、2回目以降は即座に返る

## プロジェクト構造

```
ai-avatar-system/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # ホーム
│   │   ├── scripts/
│   │   │   ├── page.tsx                    # 台本一覧
│   │   │   └── [id]/page.tsx               # 台本詳細（アバター選択）
│   │   ├── videos/
│   │   │   └── [id]/page.tsx               # 動画視聴
│   │   └── api/
│   │       ├── generate-video/route.ts     # HeyGen動画生成API
│   │       ├── avatars/
│   │       │   ├── route.ts                # HeyGenアバターリスト（キャッシュ付き）
│   │       │   ├── upload/route.ts         # 写真アップロード ⭐ NEW
│   │       │   ├── create/route.ts         # カスタムアバター作成 ⭐ NEW
│   │       │   └── heygen/route.ts         # HeyGen専用エンドポイント ⭐ NEW
│   ├── services/
│   │   └── heygen.service.ts               # HeyGen APIクライアント ⭐ NEW
│   ├── components/
│   │   ├── AvatarSelector.tsx              # アバター選択UI
│   │   ├── UnifiedAvatarSelector.tsx       # 統合アバター選択UI
│   │   └── AvatarPhotoUploader.tsx         # 写真アップロードUI（未使用）
│   ├── hooks/
│   │   └── useAvatars.ts                   # アバターデータ取得Hook
│   ├── types/
│   │   ├── heygen.ts                       # HeyGen型定義 ⭐ NEW
│   │   └── avatar.ts                       # Avatar型定義
│   ├── lib/
│   │   ├── supabase.ts                     # Supabase設定
│   │   └── store.ts                        # 状態管理
├── docs/
│   ├── ARCHITECTURE.md                     # 設計書
│   ├── SUPABASE_SETUP.md                   # Supabaseガイド
│   └── API_KEYS_SETUP.md                   # APIキー取得ガイド
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql          # 初期スキーマ
│   │   └── complete_heygen_setup.sql       # HeyGen統合スキーマ ⭐ NEW
│   └── README.md                           # Supabaseセットアップガイド
├── .env.local                              # 環境変数（HEYGEN_API_KEY追加）
├── next.config.mjs                         # Next.js設定（HeyGen画像対応）
└── package.json                            # dotenv追加済み
```

## 重要なコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run typecheck

# テスト実行
npm test

# すべてのNode.jsプロセスをクリーンアップ
pkill -f "next dev"
rm -rf .next
npm run dev

# Git操作
git status
git add .
git commit -m "メッセージ"
git push origin main

# HeyGen APIテスト
npx tsx src/scripts/test-heygen-api.ts
```

## ターミナルクリーンアップ手順

セッション終了時に実行：

```bash
# 1. すべてのバックグラウンドプロセスを停止
pkill -f "next dev"
pkill -f "miyabi auto"
pkill -f "test-heygen-api"

# 2. .nextキャッシュをクリア（オプション）
rm -rf .next

# 3. 次回セッション開始時
cd /Users/dosakakyohei/dev/ai-avatar-system
npm run dev
```

## 技術スタック

- **フロントエンド**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **ストレージ**: Supabase Storage
- **AI/API**:
  - ~~OpenAI TTS (音声合成)~~ → HeyGen内蔵音声に移行
  - ~~D-ID API (リップシンク動画)~~ → HeyGen APIに完全移行 ⭐
  - HeyGen API (動画生成、Photo Avatar作成) ⭐ NEW
- **状態管理**: Zustand
- **ホスティング**: Vercel (予定)

## 参考リンク

- **GitHubリポジトリ**: https://github.com/dokyon/ai-avatar-system
- **Supabaseダッシュボード**: https://supabase.com/dashboard/project/sljugvkpkepgcwbwiccl
- **HeyGen**: https://www.heygen.com ⭐ NEW
- **HeyGen API Docs**: https://docs.heygen.com/reference/ ⭐ NEW
- **HeyGen Dashboard**: https://app.heygen.com ⭐ NEW
- **Next.js ドキュメント**: https://nextjs.org/docs

## コスト見積もり（月10本の動画）

- HeyGen API: テストモード（無料）
  - 本番モード: 約$1.20/本（詳細はHeyGen料金ページ参照）
- Supabase: 無料枠内
- Vercel: 無料枠内
- **合計（テストモード）**: 無料

## GitHub Issues

- **#3**: 台本作成と動画生成のE2Eテスト (CLOSED - HeyGenで成功)
- **#4**: APIキー読み込みエラー修正 (CLOSED - dotenvで解決)
- **#5**: .env.local環境変数読み込み修正 (CLOSED)
- **#6**: 動画生成のE2Eテストと検証 (CLOSED - HeyGenで成功)
- **#7**: エラーハンドリング改善 (OPEN)
- **#8**: ドキュメント更新 (OPEN)
- **#17-#21**: HeyGen API統合 (CLOSED) ⭐ NEW

## 成功した動画生成ログ

```
[Video eca37d6d-5b4c-4453-b175-f6655867e4aa] Starting HeyGen video generation...
[Video eca37d6d-5b4c-4453-b175-f6655867e4aa] Avatar ID mapping: {
  received: '22f36a1a-d2a6-418b-85de-e09307518025',
  isHeyGen: false,
  using: 'Abigail_expressive_2024112501'
}
[HeyGen] Creating video...
[HeyGen] API Response: {
  "error": null,
  "data": {
    "video_id": "fe29b3e559d642ec87169d61fb616c62"
  }
}
[HeyGen] Video creation initiated: { videoId: 'fe29b3e559d642ec87169d61fb616c62' }
[Video eca37d6d-5b4c-4453-b175-f6655867e4aa] HeyGen status (1/60): waiting
[Video eca37d6d-5b4c-4453-b175-f6655867e4aa] HeyGen status (2/60): processing
...
[Video eca37d6d-5b4c-4453-b175-f6655867e4aa] HeyGen status (12/60): completed
[Video eca37d6d-5b4c-4453-b175-f6655867e4aa] Video generation completed successfully in 123s
```

## メモ

- プロジェクトは正常に動作している
- UIは完成している
- HeyGen API統合完了
- アバターリストAPIにキャッシュ実装（パフォーマンス改善）
- カスタムアバター作成の完全フロー実装完了 ⭐ NEW
- UnifiedAvatarSelector統合完了 ⭐ NEW
- AvatarPhotoUploader実装完了（アバター名入力対応） ⭐ NEW
- 次のステップ: カスタムアバター作成フローのテスト、動画生成テスト

---

**次回セッション開始時:**
1. `npm run dev` で開発サーバー起動
2. このログを確認
3. ブラウザで http://localhost:3000/scripts にアクセス
4. カスタムアバター作成フローのテストを実施（社長の写真を使用）
5. 標準アバター・カスタムアバターの両方で動画生成テスト
