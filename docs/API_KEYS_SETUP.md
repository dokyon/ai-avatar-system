# APIキー取得ガイド

AIアバター動画生成に必要な2つのAPIキーの取得手順を説明します。

## 1. D-ID APIキー取得（所要時間：3分）

D-IDはAIアバターのリップシンク動画を生成するサービスです。

### 手順

1. **D-ID公式サイトにアクセス**
   ```
   https://www.d-id.com
   ```

2. **アカウント作成**
   - 右上の「Start Free Trial」をクリック
   - GitHubアカウントでサインアップ（推奨）
   - または、メールアドレスでサインアップ

3. **無料クレジット取得**
   - サインアップ完了で **$10の無料クレジット** が付与されます
   - クレジットカード登録は不要です

4. **APIキー取得**
   - ダッシュボードにログイン
   - 左サイドバーから「API」または「Settings」を選択
   - 「API Key」セクションで「Create API Key」をクリック
   - キーをコピー（`Basic XXXXXXXXXXXXXXXX` の形式）

5. **環境変数に設定**
   ```bash
   # .env.local ファイルを編集
   DID_API_KEY=Basic XXXXXXXXXXXXXXXX
   ```

### コスト
- 無料クレジット: $10
- 1分の動画生成: 約$0.08-$0.12
- 無料クレジットで約80-100本の動画を生成可能

---

## 2. OpenAI APIキー取得（所要時間：3分）

OpenAI APIはテキスト読み上げ（TTS）に使用します。

### 手順

1. **OpenAI Platform にアクセス**
   ```
   https://platform.openai.com
   ```

2. **アカウント作成/ログイン**
   - 右上の「Sign up」または「Log in」
   - GoogleアカウントまたはMicrosoftアカウントでサインイン可能

3. **APIキー作成**
   - ダッシュボードにログイン
   - 左サイドバーから「API keys」を選択
   - 「Create new secret key」ボタンをクリック
   - キー名を入力（例：ai-avatar-system）
   - 生成されたキーをコピー（`sk-proj-XXXXXXXXXX` の形式）
   - **重要**: このキーは一度しか表示されないため、必ず保存してください

4. **クレジット購入（必要な場合）**
   - 左サイドバーから「Billing」を選択
   - 「Add payment method」でクレジットカードを登録
   - 最低$5から購入可能

5. **環境変数に設定**
   ```bash
   # .env.local ファイルを編集
   OPENAI_API_KEY=sk-proj-XXXXXXXXXX
   ```

### コスト
- TTS (text-to-speech): $15 / 1M文字
- 1分の音声（約150文字）: 約$0.0023
- $5で約2,000本以上の動画音声を生成可能

---

## 環境変数の設定

両方のAPIキーを取得したら、プロジェクトルートの `.env.local` ファイルを編集します：

```bash
# Supabase (すでに設定済み)
NEXT_PUBLIC_SUPABASE_URL=https://sljugvkpkepgcwbwiccl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gV2O7uSFSPTKz91ZWdjO4A_Wv4AyXsZ

# D-ID API (ここに貼り付け)
DID_API_KEY=Basic XXXXXXXXXXXXXXXX

# OpenAI API (ここに貼り付け)
OPENAI_API_KEY=sk-proj-XXXXXXXXXX
```

### 設定後の手順

1. **開発サーバーを再起動**
   ```bash
   # 現在のサーバーを停止（Ctrl+C）
   npm run dev
   ```

2. **動作確認**
   - http://localhost:3000/scripts にアクセス
   - 台本の詳細ページで「AIアバター動画を生成」をクリック
   - 数分待つ（D-ID APIが動画を生成）
   - 動画が生成されたら視聴

---

## トラブルシューティング

### D-ID APIエラー

**エラー**: `Invalid API Key`
- APIキーの先頭に `Basic ` が含まれているか確認
- スペースや改行が含まれていないか確認

**エラー**: `Insufficient credits`
- D-IDダッシュボードでクレジット残高を確認
- 必要に応じて追加購入

### OpenAI APIエラー

**エラー**: `Incorrect API key provided`
- APIキーが正しくコピーされているか確認
- キーが期限切れでないか確認

**エラー**: `You exceeded your current quota`
- OpenAI Billingページでクレジット残高を確認
- 支払い方法を追加して課金

### 一般的な問題

**環境変数が反映されない**
- 開発サーバーを必ず再起動
- `.env.local` のファイル名が正しいか確認
- ファイルがプロジェクトルート直下にあるか確認

---

## コスト見積もり（参考）

月10本の研修動画を生成する場合：

| サービス | 用途 | 月額コスト |
|---------|------|-----------|
| D-ID API | アバター動画生成 | $1.00 |
| OpenAI TTS | 音声合成 | $0.02 |
| Supabase | データベース | $0.00（無料枠） |
| Vercel | ホスティング | $0.00（無料枠） |
| **合計** | | **約$1.02/月** |

無料クレジットを使い切るまでは実質無料で運用可能です。

---

## 次のステップ

APIキー設定完了後：
1. 開発サーバー再起動
2. 台本詳細ページで動画生成をテスト
3. 生成された動画を視聴
4. 問題なければ本番環境にデプロイ

---

## 3. GitHub Personal Access Token（Miyabi用・所要時間：2分）

Miyabi Frameworkが自動的にIssueやPRを操作するために必要です。

### 手順

1. **GitHubにログイン**
   ```
   https://github.com/settings/tokens
   ```

2. **新しいトークンを作成**
   - 「Tokens (classic)」タブを選択
   - 「Generate new token」→「Generate new token (classic)」をクリック
   - Note: `miyabi-agent-token` などわかりやすい名前を入力

3. **スコープ選択**
   以下の権限を付与してください：
   - ✅ `repo` (Full control of private repositories)
     - `repo:status`
     - `repo_deployment`
     - `public_repo`
     - `repo:invite`
     - `security_events`
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `read:org` (Read org and team membership, read org projects)

4. **有効期限設定**
   - Expiration: `90 days` を推奨（セキュリティのため）
   - 期限切れ前に再生成の通知が届きます

5. **トークン生成**
   - 「Generate token」をクリック
   - 生成されたトークンをコピー（`ghp_XXXXXXXXXX` の形式）
   - **重要**: このトークンは一度しか表示されないため、必ず保存してください

6. **環境変数に設定**
   ```bash
   # .env ファイルを編集
   GITHUB_TOKEN=ghp_XXXXXXXXXX
   REPOSITORY=dokyon/ai-avatar-system  # あなたのリポジトリ名
   ```

### 使用用途
- 自動Issue作成・更新
- ラベル自動付与
- Draft PR自動作成
- コミット・プッシュ
- GitHub Actions トリガー

---

## 4. Anthropic API Key（Miyabi Agent用・所要時間：3分）

Miyabi FrameworkのAI Agentが使用するClaude APIキーです。

### 手順

1. **Anthropic Console にアクセス**
   ```
   https://console.anthropic.com
   ```

2. **アカウント作成/ログイン**
   - 「Sign in」または「Get API keys」をクリック
   - メールアドレスでアカウント作成

3. **クレジット購入**
   - 左サイドバーから「Billing」を選択
   - 「Purchase credits」をクリック
   - 最低$5から購入可能（推奨: $20で100回以上のAgent実行が可能）

4. **APIキー作成**
   - 左サイドバーから「API Keys」を選択
   - 「Create Key」ボタンをクリック
   - キー名を入力（例：miyabi-agents）
   - 生成されたキーをコピー（`sk-ant-api03-XXXXXXXXXX` の形式）

5. **環境変数に設定**
   ```bash
   # .env ファイルを編集
   ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXX
   ```

### コスト
- Claude Sonnet 4: $3 / 1M input tokens, $15 / 1M output tokens
- 1回のAgent実行（Issue #7の例）: 約$0.18
- $20で約110回のAgent実行が可能

### 使用するAgent
- **IssueAgent**: Issue分析・ラベル付け
- **CoordinatorAgent**: タスク分解・DAG構築
- **CodeGenAgent**: コード自動生成
- **ReviewAgent**: コード品質判定

---

## 完全な環境変数設定

すべてのAPIキーを取得したら、`.env` ファイルを以下のように設定します：

```bash
# ===========================================
# Application APIs (動画生成に必要)
# ===========================================

# D-ID Avatar API
DID_API_KEY=Basic XXXXXXXXXXXXXXXX

# OpenAI Text-to-Speech API
OPENAI_API_KEY=sk-proj-XXXXXXXXXX

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://sljugvkpkepgcwbwiccl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gV2O7uSFSPTKz91ZWdjO4A_Wv4AyXsZ

# ===========================================
# Miyabi Framework APIs (Agent自動化に必要)
# ===========================================

# GitHub Personal Access Token
GITHUB_TOKEN=ghp_XXXXXXXXXX

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXX

# Repository Settings
REPOSITORY=dokyon/ai-avatar-system
DEVICE_IDENTIFIER=MacBook Pro 16-inch
LOG_LEVEL=info
```

---

## セキュリティベストプラクティス

### 1. 環境変数の管理

**DO（推奨）**:
- ✅ `.env` ファイルは `.gitignore` に含める
- ✅ APIキーは環境変数で管理
- ✅ 本番環境では GitHub Secrets / Vercel Environment Variables を使用
- ✅ 定期的にトークンをローテーション（90日ごと推奨）
- ✅ 使用していないトークンは即座に削除

**DON'T（非推奨）**:
- ❌ APIキーをコードに直接書き込まない
- ❌ `.env` をGitにコミットしない
- ❌ APIキーをSlack/Discord等で共有しない
- ❌ 無期限のトークンを使用しない
- ❌ スクリーンショットにAPIキーを含めない

### 2. トークンの権限設定

**最小権限の原則**:
- GitHub Token: 必要な権限のみ付与
- OpenAI API: Rate limitを設定（Settings → Usage limits）
- Anthropic API: Organization単位で予算上限を設定

### 3. 漏洩時の対応

APIキーが漏洩した場合の対応手順：

1. **即座にトークンを無効化**
   - GitHub: https://github.com/settings/tokens
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys
   - D-ID: https://studio.d-id.com/account

2. **新しいトークンを生成**
   - 上記の手順に従って再生成

3. **環境変数を更新**
   - ローカル: `.env` ファイル
   - GitHub Actions: Repository Secrets
   - Vercel: Environment Variables

4. **影響範囲の確認**
   - 各サービスのUsage/Billingページで不正利用をチェック

### 4. GitHub Actions Secrets設定

本番環境では以下のSecretsを設定してください：

```
Settings → Secrets and variables → Actions → New repository secret
```

**必須Secrets**:
- `ANTHROPIC_API_KEY` - Miyabi Agent用
- `OPENAI_API_KEY` - 動画生成用
- `DID_API_KEY` - アバター生成用
- `SUPABASE_URL` - データベース用
- `SUPABASE_ANON_KEY` - データベース用

**注意**: `GITHUB_TOKEN` は自動的に提供されるため、手動設定不要です。

---

## 環境別の設定

### 開発環境 (Local)

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # Supabase local
OPENAI_API_KEY=sk-proj-dev-XXXXXXXXXX
DID_API_KEY=Basic dev-XXXXXXXXXXXXXXXX
```

### ステージング環境 (Vercel Preview)

```bash
# Vercel Environment Variables (Preview)
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
OPENAI_API_KEY=sk-proj-staging-XXXXXXXXXX
DID_API_KEY=Basic staging-XXXXXXXXXXXXXXXX
```

### 本番環境 (Vercel Production)

```bash
# Vercel Environment Variables (Production)
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://sljugvkpkepgcwbwiccl.supabase.co
OPENAI_API_KEY=sk-proj-prod-XXXXXXXXXX
DID_API_KEY=Basic prod-XXXXXXXXXXXXXXXX
```

---

## 参考リンク

### Application APIs
- D-ID公式ドキュメント: https://docs.d-id.com
- OpenAI API ドキュメント: https://platform.openai.com/docs
- Supabase ドキュメント: https://supabase.com/docs

### Miyabi Framework APIs
- GitHub Personal Access Tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- Anthropic Console: https://console.anthropic.com
- Miyabi Framework: https://github.com/ShunsukeHayashi/Miyabi

### ダッシュボード
- D-ID Dashboard: https://studio.d-id.com
- OpenAI Dashboard: https://platform.openai.com/account
- Anthropic Console: https://console.anthropic.com
- GitHub Settings: https://github.com/settings/tokens
