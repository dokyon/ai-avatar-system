# AIアバター研修動画システム - セットアップガイド

## プロジェクト完成しました！

AIアバターが研修台本を読み上げる動画を自動生成するシステムが完成しました。

## 開発サーバー

現在、Next.js開発サーバーが起動中です:
- URL: **http://localhost:3003**
- ブラウザでアクセスしてください

## 実装済み機能

### 1. 台本管理 (/scripts)
- ✅ 台本の作成・一覧表示
- ✅ 台本の詳細表示
- ✅ 台本の削除機能
- ✅ AIコースGEN / 手動入力の区別

### 2. 動画生成 (/scripts/[id])
- ✅ D-ID APIによるリップシンク動画生成
- ✅ OpenAI TTSによる音声合成
- ✅ 非同期バックグラウンド処理
- ✅ 生成ステータスの追跡

### 3. 動画視聴 (/videos/[id])
- ✅ 動画プレイヤー
- ✅ 台本表示
- ✅ 動画ダウンロード

## 次のステップ: 環境変数の設定

システムを実際に動作させるには、以下の設定が必要です:

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウント作成
2. 新しいプロジェクトを作成
3. `docs/SUPABASE_SETUP.md` の手順に従ってデータベースをセットアップ

### 2. D-ID APIキーの取得

1. [D-ID](https://www.d-id.com/)にアクセスしてアカウント作成
2. 無料トライアル: $10分のクレジット（クレジットカード不要）
3. API Keyを取得

### 3. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. API Keyを作成
3. 課金設定（TTS APIは$0.015/1000文字）

### 4. 環境変数ファイルの設定

`.env.local` ファイルを編集:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# D-ID API
DID_API_KEY=your_d_id_api_key_here

# OpenAI API
OPENAI_API_KEY=sk-...
```

## 使い方

### 1. 台本を作成

1. ホームページから「台本管理」をクリック
2. 「新規台本作成」ボタンをクリック
3. タイトルと台本内容を入力
4. 「台本を作成」ボタンをクリック

### 2. 動画を生成

1. 台本一覧から台本をクリック
2. 台本詳細ページで「AIアバター動画を生成」ボタンをクリック
3. 動画生成が開始されます（数分かかります）
4. ステータスが「完了」になったら「動画を見る」をクリック

### 3. 動画を視聴

1. 動画プレイヤーで研修動画を視聴
2. 台本を確認しながら視聴可能
3. 「動画をダウンロード」ボタンでダウンロード可能

## 技術スタック

- **フロントエンド**: Next.js 16 + React 19 + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **状態管理**: Zustand
- **AIアバター**: D-ID API
- **音声合成**: OpenAI TTS API

## プロジェクト構造

```
ai-avatar-system/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # ホームページ
│   │   ├── scripts/
│   │   │   ├── page.tsx                # 台本一覧
│   │   │   └── [id]/page.tsx           # 台本詳細
│   │   ├── videos/
│   │   │   └── [id]/page.tsx           # 動画視聴
│   │   └── api/
│   │       └── generate-video/
│   │           └── route.ts            # 動画生成API
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase設定
│   │   └── store.ts                    # Zustand store
│   └── types/                          # TypeScript型定義
├── docs/
│   ├── ARCHITECTURE.md                 # アーキテクチャ設計
│   └── SUPABASE_SETUP.md               # Supabaseセットアップ
├── .env.local                          # 環境変数
└── package.json
```

## コスト見積もり

### 小規模利用（月10本の動画生成）
- D-ID: $15 (10動画 × 5分 × $0.3/分)
- OpenAI TTS: $2.25 (15,000文字 × $0.015/1000文字)
- Supabase: 無料プラン
- Vercel: 無料プラン
- **合計**: 約$20/月

## トラブルシューティング

### 開発サーバーが起動しない
```bash
cd /Users/dosakakyohei/dev/ai-avatar-system
npm install
npm run dev
```

### Supabaseに接続できない
- `.env.local` の設定を確認
- SupabaseプロジェクトのURLとKeyが正しいか確認
- `docs/SUPABASE_SETUP.md` の手順を再確認

### 動画生成が失敗する
- D-ID API KeyとOpenAI API Keyが正しく設定されているか確認
- APIキーの利用制限を確認
- ブラウザのコンソールでエラーメッセージを確認

## 今後の拡張機能アイデア

- [ ] スライドアップロード機能
- [ ] スライドと動画の同期表示
- [ ] 視聴進捗トラッキング
- [ ] 複数のアバター選択機能
- [ ] カスタム音声設定
- [ ] 研修コース管理
- [ ] ユーザー認証・権限管理
- [ ] 視聴レポート・分析

## サポート

質問や問題がある場合:
1. `docs/`ディレクトリのドキュメントを確認
2. GitHubリポジトリ: https://github.com/dokyon/ai-avatar-system
3. Issueを作成

## ライセンス

MIT License
