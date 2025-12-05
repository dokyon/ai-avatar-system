# AIアバター研修動画システム アーキテクチャ設計

## システム概要

AIアバターが台本を読み上げる研修動画を自動生成し、従業員に提供するシステム

## 主要機能

### 1. 台本管理
- AIコースGENで作成した台本のインポート
- 台本の編集・管理
- 音声スクリプトの最適化

### 2. AIアバター動画生成
- D-ID APIを使用したリップシンク動画生成
- OpenAI TTS/ElevenLabsによる音声合成
- 動画の保存・管理

### 3. スライド管理
- PDF/PowerPointスライドのアップロード
- スライドと動画の同期
- スライドの表示・ナビゲーション

### 4. 研修視聴システム
- 動画とスライドの統合表示
- 視聴進捗管理
- 視聴履歴の記録

## 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Video Player**: React Player
- **PDF Viewer**: react-pdf

### バックエンド
- **Runtime**: Next.js API Routes (Edge Functions)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (動画・スライド保存)
- **Authentication**: Supabase Auth

### 外部API
- **AIアバター**: D-ID API
  - リップシンク動画生成
  - 無料トライアル: $10分のクレジット
- **音声合成**: OpenAI TTS API
  - 自然な日本語音声
  - コスト効率良い

## システム構成

```
┌─────────────────────────────────────────────────────────┐
│                     ユーザー (従業員)                        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (研修視聴UI)                 │
│  - 動画プレイヤー                                           │
│  - スライド表示                                             │
│  - 視聴進捗トラッキング                                      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           Next.js API Routes (バックエンド)                │
│  - 台本処理 API                                            │
│  - 動画生成 API                                            │
│  - スライド管理 API                                         │
│  - 視聴履歴 API                                            │
└─────┬────────────┬──────────────┬───────────────────────┘
      │            │              │
      ▼            ▼              ▼
┌─────────┐  ┌──────────┐  ┌────────────────┐
│ D-ID    │  │ OpenAI   │  │ Supabase       │
│ API     │  │ TTS API  │  │ - PostgreSQL   │
│         │  │          │  │ - Storage      │
│ リップ   │  │ 音声生成  │  │ - Auth         │
│ シンク   │  │          │  │                │
└─────────┘  └──────────┘  └────────────────┘
```

## データモデル

### 1. scripts (台本)
```typescript
{
  id: string
  title: string
  content: string
  metadata: {
    source: 'ai-course-gen' | 'manual'
    createdAt: timestamp
    updatedAt: timestamp
  }
}
```

### 2. videos (動画)
```typescript
{
  id: string
  scriptId: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl: string
  thumbnailUrl: string
  duration: number
  metadata: {
    avatarId: string
    voiceId: string
    createdAt: timestamp
  }
}
```

### 3. slides (スライド)
```typescript
{
  id: string
  videoId: string
  fileUrl: string
  pageCount: number
  metadata: {
    fileName: string
    fileSize: number
    uploadedAt: timestamp
  }
}
```

### 4. viewing_progress (視聴進捗)
```typescript
{
  id: string
  userId: string
  videoId: string
  currentTime: number
  completed: boolean
  completedAt?: timestamp
  updatedAt: timestamp
}
```

## ワークフロー

### 動画生成フロー
1. **台本インポート**: AIコースGENから台本をインポート
2. **音声生成**: OpenAI TTSで音声ファイルを生成
3. **動画生成**: D-ID APIで音声とアバターを合成
4. **保存**: Supabase Storageに動画を保存
5. **公開**: 従業員に研修動画を公開

### 視聴フロー
1. **認証**: Supabase Authでログイン
2. **研修選択**: 利用可能な研修一覧から選択
3. **視聴**: 動画とスライドを同期表示
4. **進捗記録**: 視聴位置を自動保存
5. **完了**: 視聴完了時に記録

## セキュリティ

- **認証**: Supabase Authによるユーザー認証
- **認可**: Row Level Security (RLS)で権限管理
- **API Key管理**: 環境変数で安全に管理
- **HTTPS**: すべての通信を暗号化

## スケーラビリティ

- **CDN**: Vercel Edgeで静的コンテンツ配信
- **動画配信**: Supabase Storageから直接配信
- **サーバーレス**: Next.js API Routesで自動スケール
- **データベース**: Supabaseの自動スケーリング

## コスト見積もり（月額）

### 小規模 (従業員100名、月10本の研修動画)
- **D-ID API**: 10動画 × $0.3/分 × 5分 = $15
- **OpenAI TTS**: 10動画 × 5分 × 300文字/分 × $0.015/1000文字 = $2.25
- **Supabase**: Free tier (十分)
- **Vercel**: Hobby tier (無料)
- **合計**: 約$20/月

### 中規模 (従業員500名、月50本の研修動画)
- **D-ID API**: $75
- **OpenAI TTS**: $11.25
- **Supabase**: Pro tier $25
- **Vercel**: Pro tier $20
- **合計**: 約$130/月

## 開発フェーズ

### Phase 1: MVP (2週間)
- [ ] Next.jsプロジェクトセットアップ
- [ ] Supabase設定
- [ ] 台本インポート機能
- [ ] D-ID API統合
- [ ] 基本的な動画生成

### Phase 2: 視聴システム (1週間)
- [ ] 動画プレイヤー実装
- [ ] スライド表示機能
- [ ] 視聴進捗トラッキング

### Phase 3: 管理機能 (1週間)
- [ ] 管理者ダッシュボード
- [ ] 研修一覧・編集
- [ ] 視聴レポート

### Phase 4: 本番環境 (1週間)
- [ ] 認証・認可
- [ ] パフォーマンス最適化
- [ ] デプロイ設定
