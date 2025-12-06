# Supabaseセットアップガイド

## データベーススキーマの適用手順

### 方法1: Supabaseダッシュボード（推奨）

1. **Supabaseダッシュボードを開く**
   ```
   https://supabase.com/dashboard/project/sljugvkpkepgcwbwiccl
   ```

2. **SQL Editorに移動**
   - 左サイドバーから「SQL Editor」をクリック

3. **新しいクエリを作成**
   - 「New query」ボタンをクリック

4. **SQLファイルの内容をコピー**
   - `supabase/migrations/001_initial_schema.sql` の内容を全てコピー

5. **ペーストして実行**
   - エディタにペースト
   - 「Run」ボタン（または Cmd+Enter）で実行

6. **成功を確認**
   - エラーが表示されなければ成功！
   - 「Table Editor」で `scripts` と `videos` テーブルが表示されることを確認

### 方法2: Supabase CLI（上級者向け）

```bash
# Supabase CLIをインストール
npm install -g supabase

# プロジェクトをリンク
supabase link --project-ref sljugvkpkepgcwbwiccl

# マイグレーションを適用
supabase db push
```

## 作成されるテーブル

### scriptsテーブル
台本データを管理

| カラム名 | 型 | 説明 |
|---------|-------|------|
| id | UUID | 主キー |
| title | TEXT | 台本タイトル |
| content | TEXT | 台本内容 |
| source | TEXT | 作成元（'ai-course-gen' or 'manual'） |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### videosテーブル
生成された動画データを管理

| カラム名 | 型 | 説明 |
|---------|-------|------|
| id | UUID | 主キー |
| script_id | UUID | 台本ID（外部キー） |
| title | TEXT | 動画タイトル |
| status | TEXT | ステータス（pending/processing/completed/failed） |
| video_url | TEXT | 動画URL |
| thumbnail_url | TEXT | サムネイルURL |
| duration | INTEGER | 動画の長さ（秒） |
| avatar_id | TEXT | アバターID |
| voice_id | TEXT | 音声ID |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

## セキュリティ設定

Row Level Security (RLS) が有効化されており、以下のポリシーが適用されています：

- **読み取り**: 全員が可能（デモ用）
- **挿入**: 全員が可能（デモ用）
- **更新**: 全員が可能（動画のみ）

**注意**: 本番環境では適切な認証・認可を実装してください。

## トラブルシューティング

### エラー: "relation already exists"
すでにテーブルが存在しています。問題ありません。

### エラー: "permission denied"
プロジェクトの所有者でログインしているか確認してください。

### テーブルが表示されない
- ブラウザをリフレッシュ
- Table Editorで手動で確認

## 次のステップ

スキーマ適用後：
1. 開発サーバーを起動: `npm run dev`
2. http://localhost:3003/scripts にアクセス
3. 台本を作成してテスト
