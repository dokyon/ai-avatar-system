-- AIアバター研修動画システム - データベーススキーマ
-- 作成日: 2025-12-05

-- 台本テーブル
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('ai-course-gen', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時刻の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- scriptsテーブルの更新トリガー
CREATE TRIGGER update_scripts_updated_at
BEFORE UPDATE ON scripts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 動画テーブル
CREATE TABLE IF NOT EXISTS videos (
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

-- videosテーブルの更新トリガー
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON videos
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
CREATE INDEX IF NOT EXISTS idx_videos_script_id ON videos(script_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- 初期データ（オプション）
-- サンプル台本を追加したい場合はコメントを外してください
/*
INSERT INTO scripts (title, content, source) VALUES
  ('サンプル研修: ビジネスマナー基礎', 'こんにちは。本日はビジネスマナーの基礎についてご説明します。まず、挨拶の重要性からお話しします。', 'manual');
*/
