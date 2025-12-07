import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HeyGenService } from '@/services/heygen.service'
import { HeyGenError } from '@/types/heygen'
import { config } from 'dotenv'
import { resolve } from 'path'

// Explicitly load .env.local to fix Next.js 16 ESM environment variable loading issue
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

/**
 * デフォルトHeyGenアバター設定
 * 無料プランでも利用可能な公開アバター
 */
const DEFAULT_HEYGEN_AVATAR = 'Abigail_expressive_2024112501' // Abigail (Upper Body)
const DEFAULT_HEYGEN_VOICE = 'e0cc82c22f414c95b1f25696c732f058' // Japanese female voice

interface GenerateVideoRequest {
  scriptId: string
  title?: string
  content: string
  avatarId?: string
  voiceId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { scriptId, title, content, avatarId, voiceId } = await request.json() as GenerateVideoRequest

    if (!scriptId || !content) {
      return NextResponse.json(
        { error: 'scriptIdとcontentは必須です' },
        { status: 400 }
      )
    }

    // 1. データベースに動画レコードを作成（status: pending）
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert([
        {
          script_id: scriptId,
          title: title || 'Untitled Video',
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (videoError) throw videoError

    // 2. バックグラウンドで動画生成処理を開始
    generateVideoAsync(video.id, content, avatarId, voiceId).catch(console.error)

    return NextResponse.json({
      success: true,
      videoId: video.id,
      message: '動画生成を開始しました',
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '動画生成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 非同期で動画を生成する（HeyGen API使用）
 * @param videoId - 動画ID
 * @param scriptContent - スクリプトコンテンツ
 * @param avatarId - HeyGenアバターID（オプション）
 * @param voiceId - HeyGen音声ID（オプション）
 */
async function generateVideoAsync(
  videoId: string,
  scriptContent: string,
  avatarId?: string,
  voiceId?: string
) {
  const startTime = Date.now()

  try {
    // HeyGen APIキーの確認
    const apiKey = process.env.HEYGEN_API_KEY
    if (!apiKey) {
      throw new Error('HeyGen API key is not configured')
    }

    // ステータスを「processing」に更新
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)

    console.log(`[Video ${videoId}] Starting HeyGen video generation...`, {
      avatarId: avatarId || DEFAULT_HEYGEN_AVATAR,
      voiceId: voiceId || DEFAULT_HEYGEN_VOICE,
      scriptLength: scriptContent.length,
    })

    // HeyGenサービスを初期化
    const heygenService = new HeyGenService(apiKey)

    // IMPORTANT: avatarIdがUUID形式の場合はD-ID用なので、デフォルトHeyGenアバターを使用
    const isHeyGenAvatarId = avatarId && !avatarId.includes('-')
    const finalAvatarId = isHeyGenAvatarId ? avatarId : DEFAULT_HEYGEN_AVATAR

    console.log(`[Video ${videoId}] Avatar ID mapping:`, {
      received: avatarId,
      isHeyGen: isHeyGenAvatarId,
      using: finalAvatarId,
    })

    // HeyGen APIで動画を作成
    const heygenVideoId = await heygenService.createVideo({
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: finalAvatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: scriptContent,
            voice_id: voiceId || DEFAULT_HEYGEN_VOICE,
          },
        },
      ],
      dimension: {
        width: 720,
        height: 480,
      },
      test: true, // テストモード（無料プラン互換）
      title: `Video ${videoId}`,
    })

    console.log(`[Video ${videoId}] HeyGen video creation initiated:`, heygenVideoId)

    // 動画生成の完了を待つ
    const videoUrl = await heygenService.waitForVideoCompletion(heygenVideoId, {
      pollingInterval: 10000, // 10秒ごとにチェック
      maxAttempts: 60, // 最大10分待機
      onProgress: (status, attempt) => {
        console.log(`[Video ${videoId}] HeyGen status (${attempt}/60): ${status}`)
      },
    })

    // ステップ3: 動画URLをデータベースに保存
    const duration = Math.floor(scriptContent.length / 5) // 概算（文字数÷5秒）
    await supabase
      .from('videos')
      .update({
        status: 'completed',
        video_url: videoUrl,
        duration,
      })
      .eq('id', videoId)

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    console.log(`[Video ${videoId}] Video generation completed successfully in ${elapsedTime}s:`, {
      videoUrl,
      duration,
    })
  } catch (error) {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    console.error(`[Video ${videoId}] Video generation failed after ${elapsedTime}s:`, error)

    // エラーの詳細情報を取得
    let errorMessage = '動画生成に失敗しました'
    if (error instanceof HeyGenError) {
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    // エラー時はステータスを「failed」に更新し、エラーメッセージも保存
    await supabase
      .from('videos')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', videoId)
  }
}
