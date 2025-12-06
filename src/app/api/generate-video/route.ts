import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import axios, { AxiosError } from 'axios'
import { config } from 'dotenv'
import { resolve } from 'path'
import { VideoGenerationError } from '@/types/errors'

// Explicitly load .env.local to fix Next.js 16 ESM environment variable loading issue
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

/**
 * D-ID API Avatar Configuration
 * Using official D-ID public avatars to ensure compatibility
 */
const DID_AVATAR_CONFIG = {
  // Primary avatar - D-ID official public avatar
  primary: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',

  // Fallback avatars in case primary fails
  fallbacks: [
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/amy.jpg',
    'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/anna.jpg',
  ]
} as const

interface GenerateVideoRequest {
  scriptId: string
  title?: string
  content: string
  avatarId?: string
  avatarUrl?: string
}

interface DIDErrorResponse {
  kind?: string
  description?: string
  details?: string
}

interface DIDCreateResponse {
  id: string
  status: string
  created_at: string
  object?: string
}

interface DIDStatusResponse {
  id: string
  status: 'created' | 'processing' | 'done' | 'error' | 'rejected'
  result_url?: string
  error?: DIDErrorResponse
  created_at: string
  started_at?: string
}

export async function POST(request: NextRequest) {
  try {
    const { scriptId, title, content, avatarId, avatarUrl } = await request.json() as GenerateVideoRequest

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
    // ここでは即座にレスポンスを返し、実際の処理は非同期で行います
    generateVideoAsync(video.id, content, avatarUrl).catch(console.error)

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
 * 非同期で動画を生成する
 * @param videoId - 動画ID
 * @param scriptContent - スクリプトコンテンツ
 * @param avatarUrl - アバター画像URL（オプション）
 */
async function generateVideoAsync(videoId: string, scriptContent: string, avatarUrl?: string) {
  const startTime = Date.now()
  let currentAvatar: string = avatarUrl || DID_AVATAR_CONFIG.primary
  let fallbackIndex = 0

  try {
    // ステータスを「processing」に更新
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)

    // ステップ1: OpenAI TTSで音声を生成
    console.log(`[Video ${videoId}] Step 1/2: Generating audio with OpenAI TTS...`)
    const audioBuffer = await generateAudio(scriptContent)

    // 音声をbase64に変換
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')
    console.log(`[Video ${videoId}] Audio generated successfully (${audioBuffer.byteLength} bytes)`)

    // ステップ2: D-ID APIでリップシンク動画を生成（フォールバック機能付き）
    console.log(`[Video ${videoId}] Step 2/2: Generating lip-sync video with D-ID...`)
    let videoUrl = ''

    // プライマリアバターで試行
    try {
      videoUrl = await generateLipSyncVideo(audioBase64, currentAvatar)
    } catch (error) {
      if (error instanceof VideoGenerationError && error.retryable && fallbackIndex < DID_AVATAR_CONFIG.fallbacks.length) {
        console.warn(`[Video ${videoId}] Primary avatar failed, trying fallback...`, {
          error: error.message,
          fallbackIndex,
        })

        // フォールバックアバターで再試行
        while (fallbackIndex < DID_AVATAR_CONFIG.fallbacks.length) {
          currentAvatar = DID_AVATAR_CONFIG.fallbacks[fallbackIndex]
          fallbackIndex++

          try {
            console.log(`[Video ${videoId}] Retrying with fallback avatar ${fallbackIndex}:`, currentAvatar)
            videoUrl = await generateLipSyncVideo(audioBase64, currentAvatar)
            break
          } catch (fallbackError) {
            console.warn(`[Video ${videoId}] Fallback avatar ${fallbackIndex} failed:`, fallbackError)
            if (fallbackIndex >= DID_AVATAR_CONFIG.fallbacks.length) {
              throw fallbackError
            }
          }
        }
      } else {
        throw error
      }
    }

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
      avatar: currentAvatar,
    })
  } catch (error) {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    console.error(`[Video ${videoId}] Video generation failed after ${elapsedTime}s:`, error)

    // エラーの詳細情報を取得
    let errorMessage = '動画生成に失敗しました'
    if (error instanceof VideoGenerationError) {
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

async function generateAudio(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API Key is not configured')
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  })

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy', // 日本語対応の音声
    input: text,
  })

  return await mp3.arrayBuffer()
}

/**
 * D-ID APIでリップシンク動画を生成
 * @param audioBase64 - Base64エンコードされた音声データ
 * @param avatarUrl - 使用するアバターのURL（オプション）
 * @returns 生成された動画のURL
 * @throws {VideoGenerationError} D-ID API呼び出しエラー
 */
async function generateLipSyncVideo(
  audioBase64: string,
  avatarUrl: string = DID_AVATAR_CONFIG.primary
): Promise<string> {
  const DID_API_KEY = process.env.DID_API_KEY
  if (!DID_API_KEY) {
    throw new VideoGenerationError(
      'D-ID API Key is not configured',
      'DID_ERROR',
      undefined,
      false
    )
  }

  console.log('[D-ID] Starting video generation with avatar:', avatarUrl)

  try {
    // D-ID APIで動画を作成
    const createResponse = await axios.post<DIDCreateResponse>(
      'https://api.d-id.com/talks',
      {
        source_url: avatarUrl,
        script: {
          type: 'audio',
          audio_url: `data:audio/mp3;base64,${audioBase64}`,
        },
        config: {
          fluent: true,
          pad_audio: 0,
        },
      },
      {
        headers: {
          Authorization: `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[D-ID] Video creation initiated:', {
      talkId: createResponse.data.id,
      status: createResponse.data.status,
      avatarUrl,
    })

    const talkId = createResponse.data.id

    // 動画生成の完了を待つ（ポーリング）
    let videoUrl = ''
    let attempts = 0
    const maxAttempts = 60 // 最大10分待機（10秒ごと）

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)) // 10秒待機

      try {
        const statusResponse = await axios.get<DIDStatusResponse>(
          `https://api.d-id.com/talks/${talkId}`,
          {
            headers: {
              Authorization: `Basic ${DID_API_KEY}`,
            },
          }
        )

        const status = statusResponse.data.status
        console.log(`[D-ID] Polling status (attempt ${attempts + 1}/${maxAttempts}):`, {
          status,
          talkId,
        })

        if (status === 'done') {
          videoUrl = statusResponse.data.result_url || ''
          if (!videoUrl) {
            throw new VideoGenerationError(
              'D-ID API returned success but no video URL',
              'DID_ERROR',
              undefined,
              true
            )
          }
          console.log('[D-ID] Video generation completed successfully:', videoUrl)
          break
        } else if (status === 'error' || status === 'rejected') {
          const errorInfo = statusResponse.data.error
          const errorMessage = errorInfo
            ? `${errorInfo.kind || 'Unknown error'}: ${errorInfo.description || 'No description'}`
            : `Video generation ${status}`

          console.error('[D-ID] Video generation failed:', {
            status,
            error: errorInfo,
            talkId,
          })

          throw new VideoGenerationError(
            `D-ID video generation failed: ${errorMessage}`,
            'DID_ERROR',
            new Error(errorMessage),
            false
          )
        }

        attempts++
      } catch (error) {
        if (error instanceof VideoGenerationError) {
          throw error
        }

        // ポーリング中のネットワークエラーは一時的な可能性があるので続行
        console.warn('[D-ID] Polling attempt failed, will retry:', error)
        attempts++
      }
    }

    if (!videoUrl) {
      throw new VideoGenerationError(
        `Video generation timed out after ${maxAttempts * 10} seconds`,
        'DID_ERROR',
        undefined,
        true
      )
    }

    return videoUrl
  } catch (error) {
    if (error instanceof VideoGenerationError) {
      throw error
    }

    // Axios エラーの詳細なログ出力
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<DIDErrorResponse>

      console.error('[D-ID] API Error Details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        avatarUrl,
      })

      const errorData = axiosError.response?.data
      const errorMessage = errorData?.description || errorData?.details || axiosError.message

      throw new VideoGenerationError(
        `D-ID API request failed: ${errorMessage}`,
        'DID_ERROR',
        error,
        axiosError.response?.status === 429 || axiosError.response?.status === 503
      )
    }

    // その他の予期しないエラー
    console.error('[D-ID] Unexpected error:', error)
    throw new VideoGenerationError(
      'Unexpected error during video generation',
      'UNKNOWN_ERROR',
      error as Error,
      false
    )
  }
}
