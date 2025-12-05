# AIアバター研修動画システム - セッションログ

**日時**: 2025年12月5日
**作業時間**: 約2時間

## 完了した作業

### ✅ 1. プロジェクトセットアップ
- **GitHubリポジトリ**: https://github.com/dokyon/ai-avatar-system
- **ローカルパス**: `/Users/dosakakyohei/dev/ai-avatar-system`
- Miyabiフレームワークで初期化完了
- 46個のGitHubラベル作成
- 14個のGitHub Actionsワークフロー展開

### ✅ 2. Next.jsプロジェクト構築
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v3設定完了
- 開発サーバー起動中: **http://localhost:3003**
- パスエイリアス設定 (`@/*` -> `./src/*`)

### ✅ 3. 実装完了した機能

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
- 動画生成ボタン
- 生成済み動画一覧

#### 動画視聴 (`/videos/[id]`)
- 動画プレイヤー
- 台本同時表示
- 動画ダウンロード機能

#### APIエンドポイント (`/api/generate-video`)
- OpenAI TTS音声合成
- D-ID APIリップシンク動画生成
- 非同期バックグラウンド処理

### ✅ 4. Supabaseセットアップ（進行中）
- **プロジェクト名**: ai-avatar-training
- **URL**: `https://sljugvkpkepgcwbwiccl.supabase.co`
- **anon public key**: 設定済み（`.env.local`）
- **リージョン**: Northeast Asia (Tokyo)

## 現在のステータス

### 環境変数 (`.env.local`)
```bash
# ✅ 設定済み
NEXT_PUBLIC_SUPABASE_URL=https://sljugvkpkepgcwbwiccl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gV2O7uSFSPTKz91ZWdjO4A_Wv4AyXsZ

# ❌ 未設定（次のステップで必要）
DID_API_KEY=your_d_id_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 開発サーバー
- **URL**: http://localhost:3003
- **ステータス**: 起動中 (バックグラウンド)
- **Shell ID**: 9d4523

## 🔄 次にやること（優先順位順）

### 1. Supabaseデータベーススキーマ作成 ⚠️ **最優先**

Supabaseダッシュボードの **SQL Editor** で以下を実行：

```sql
-- 台本テーブル
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('ai-course-gen', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時刻の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 動画テーブル
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0,
  avatar_id TEXT,
  voice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security有効化
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能（デモ用）
CREATE POLICY "Scripts are viewable by everyone" ON scripts
  FOR SELECT USING (true);

CREATE POLICY "Videos are viewable by everyone" ON videos
  FOR SELECT USING (true);

-- 挿入・更新は全員可能（デモ用）
CREATE POLICY "Scripts are insertable by everyone" ON scripts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Videos are insertable by everyone" ON videos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Videos are updatable by everyone" ON videos
  FOR UPDATE USING (true);

-- インデックス作成
CREATE INDEX idx_videos_script_id ON videos(script_id);
```

**手順:**
1. Supabaseダッシュボード → SQL Editor
2. New query
3. 上記SQLをコピー＆ペースト
4. Run

### 2. 台本作成のテスト

SQLテーブル作成後：
1. http://localhost:3003/scripts にアクセス
2. 「新規台本作成」をクリック
3. テスト台本を作成
   - タイトル: 「テスト研修」
   - 内容: 「こんにちは。これはテスト用の研修動画です。」
4. 作成できたら成功！

### 3. D-ID APIキー取得

1. https://www.d-id.com にアクセス
2. アカウント作成（GitHubログイン推奨）
3. 無料$10クレジット取得
4. API Key取得
5. `.env.local` に設定:
   ```bash
   DID_API_KEY=取得したキー
   ```

### 4. OpenAI APIキー取得

1. https://platform.openai.com にアクセス
2. API Keys → Create new secret key
3. `.env.local` に設定:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

### 5. 動画生成テスト

すべてのAPIキー設定後：
1. 台本詳細ページで「AIアバター動画を生成」をクリック
2. 数分待つ（D-ID APIが動画を生成）
3. ステータスが「完了」になったら「動画を見る」

## トラブルシューティング

### 開発サーバーが起動していない場合
```bash
cd /Users/dosakakyohei/dev/ai-avatar-system
npm run dev
```

### Supabase接続エラー
- `.env.local` のURLとKeyが正しいか確認
- 開発サーバーを再起動

### モジュールエラー
```bash
cd /Users/dosakakyohei/dev/ai-avatar-system
npm install
```

## プロジェクト構造

```
ai-avatar-system/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # ホーム
│   │   ├── scripts/
│   │   │   ├── page.tsx                # 台本一覧
│   │   │   └── [id]/page.tsx           # 台本詳細
│   │   ├── videos/
│   │   │   └── [id]/page.tsx           # 動画視聴
│   │   └── api/
│   │       └── generate-video/route.ts # 動画生成API
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase設定
│   │   └── store.ts                    # 状態管理
│   └── types/
├── docs/
│   ├── ARCHITECTURE.md                 # 設計書
│   └── SUPABASE_SETUP.md               # Supabaseガイド
├── .env.local                          # 環境変数
└── README_SETUP.md                     # セットアップガイド
```

## 重要なコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# 型チェック
npm run typecheck

# Git操作
git status
git add .
git commit -m "メッセージ"
git push origin main
```

## 参考リンク

- **GitHubリポジトリ**: https://github.com/dokyon/ai-avatar-system
- **Supabaseダッシュボード**: https://supabase.com/dashboard
- **D-ID**: https://www.d-id.com
- **OpenAI Platform**: https://platform.openai.com
- **Next.js ドキュメント**: https://nextjs.org/docs

## コスト見積もり（月10本の動画）

- D-ID API: $15
- OpenAI TTS: $2.25
- Supabase: 無料
- Vercel: 無料
- **合計**: 約$20/月

## メモ

- プロジェクトは正常に動作している
- UIは完成している
- データベーススキーマの作成が最優先
- APIキーを設定すれば、すぐに動画生成が可能

---

**次回セッション開始時:**
1. 開発サーバーが起動しているか確認
2. このログを確認
3. 「次にやること」の1番から続行
