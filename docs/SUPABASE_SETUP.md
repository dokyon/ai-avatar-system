# Supabase セットアップガイド

このガイドでは、AIアバター研修動画システム用のSupabaseプロジェクトをセットアップします。

## 1. Supabaseアカウント作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

## 2. 新しいプロジェクト作成

1. ダッシュボードで「New Project」をクリック
2. 以下を入力:
   - **Name**: `ai-avatar-training`
   - **Database Password**: 強力なパスワードを生成（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` （日本で使用する場合）
3. 「Create new project」をクリック
4. プロジェクトの準備ができるまで数分待つ

## 3. API Keyの取得

1. 左サイドバーの「Project Settings」（歯車アイコン）をクリック
2. 「API」タブを選択
3. 以下をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJh...`

4. `.env.local`ファイルを更新:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

## 4. データベーススキーマ作成

左サイドバーの「SQL Editor」を開き、以下のSQLを実行:

### 4.1 台本テーブル (scripts)

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
```

### 4.2 動画テーブル (videos)

```sql
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
```

### 4.3 スライドテーブル (slides)

```sql
-- スライドテーブル
CREATE TABLE slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  page_count INTEGER DEFAULT 1,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.4 視聴進捗テーブル (viewing_progress)

```sql
-- 視聴進捗テーブル
CREATE TABLE viewing_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  current_time INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE TRIGGER update_viewing_progress_updated_at BEFORE UPDATE ON viewing_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.5 インデックス作成

```sql
-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_videos_script_id ON videos(script_id);
CREATE INDEX idx_slides_video_id ON slides(video_id);
CREATE INDEX idx_viewing_progress_user_id ON viewing_progress(user_id);
CREATE INDEX idx_viewing_progress_video_id ON viewing_progress(video_id);
```

## 5. Row Level Security (RLS) 設定

セキュリティのためRLSを有効化:

```sql
-- RLS有効化
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_progress ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能（デモ用）
-- 本番環境では認証済みユーザーのみに制限してください

CREATE POLICY "Scripts are viewable by everyone" ON scripts
  FOR SELECT USING (true);

CREATE POLICY "Videos are viewable by everyone" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Slides are viewable by everyone" ON slides
  FOR SELECT USING (true);

CREATE POLICY "Viewing progress is viewable by everyone" ON viewing_progress
  FOR SELECT USING (true);

-- 挿入・更新・削除は管理者のみ（後で設定）
CREATE POLICY "Scripts are insertable by authenticated users" ON scripts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Videos are insertable by authenticated users" ON videos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Slides are insertable by authenticated users" ON slides
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Viewing progress is insertable by authenticated users" ON viewing_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Viewing progress is updatable by users" ON viewing_progress
  FOR UPDATE USING (true);
```

## 6. Storage Bucketの作成

動画とスライドを保存するためのストレージを作成:

1. 左サイドバーの「Storage」をクリック
2. 「Create a new bucket」をクリック

### 6.1 動画バケット

- **Name**: `videos`
- **Public bucket**: チェックを入れる（動画を公開で配信）
- 「Create bucket」をクリック

### 6.2 スライドバケット

- **Name**: `slides`
- **Public bucket**: チェックを入れる
- 「Create bucket」をクリック

## 7. Storage Policyの設定

各バケットのポリシーを設定:

```sql
-- 動画バケットポリシー
CREATE POLICY "Videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- スライドバケットポリシー
CREATE POLICY "Slides are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'slides');

CREATE POLICY "Authenticated users can upload slides"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'slides' AND auth.role() = 'authenticated');
```

## 8. 動作確認

1. 左サイドバーの「Table Editor」をクリック
2. `scripts`テーブルが表示されることを確認
3. 「Insert row」で1件データを挿入してテスト

### テストデータ挿入

```sql
INSERT INTO scripts (title, content, source) VALUES
('テスト研修', 'これはテスト用の台本です。AIアバターがこの内容を読み上げます。', 'manual');
```

## 完了！

Supabaseのセットアップが完了しました。

次のステップ:
- [ ] `.env.local`に正しいURLとKeyが設定されているか確認
- [ ] Next.jsアプリからSupabaseに接続できるかテスト
- [ ] 台本インポート機能の実装を開始

## トラブルシューティング

### エラー: "Invalid API key"
- `.env.local`のキーが正しいか確認
- 開発サーバーを再起動

### エラー: "Row Level Security policy violation"
- RLSポリシーが正しく設定されているか確認
- SQL Editorでポリシーを再実行

### ストレージにアクセスできない
- バケットがPublicに設定されているか確認
- Storage Policyが正しく設定されているか確認
