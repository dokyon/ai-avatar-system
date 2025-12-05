import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import axios from 'axios'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const DID_API_KEY = process.env.DID_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { scriptId, title, content } = await request.json()

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
    generateVideoAsync(video.id, content).catch(console.error)

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

async function generateVideoAsync(videoId: string, scriptContent: string) {
  try {
    // ステータスを「processing」に更新
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)

    // ステップ1: OpenAI TTSで音声を生成
    console.log('Generating audio with OpenAI TTS...')
    const audioBuffer = await generateAudio(scriptContent)

    // 音声をbase64に変換
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    // ステップ2: D-ID APIでリップシンク動画を生成
    console.log('Generating lip-sync video with D-ID...')
    const videoUrl = await generateLipSyncVideo(audioBase64)

    // ステップ3: 動画URLをデータベースに保存
    await supabase
      .from('videos')
      .update({
        status: 'completed',
        video_url: videoUrl,
        duration: Math.floor(scriptContent.length / 5), // 概算（文字数÷5秒）
      })
      .eq('id', videoId)

    console.log('Video generation completed:', videoId)
  } catch (error) {
    console.error('Async video generation error:', error)

    // エラー時はステータスを「failed」に更新
    await supabase
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', videoId)
  }
}

async function generateAudio(text: string): Promise<ArrayBuffer> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy', // 日本語対応の音声
    input: text,
  })

  return await mp3.arrayBuffer()
}

async function generateLipSyncVideo(audioBase64: string): Promise<string> {
  if (!DID_API_KEY) {
    throw new Error('D-ID API Key is not configured')
  }

  // D-ID APIで動画を作成
  const createResponse = await axios.post(
    'https://api.d-id.com/talks',
    {
      source_url: 'https://create-images-results.d-id.com/google-oauth2%7C109775128042683808313/upl_bVhL8jLwO8qiH-QFqzxjP/image.png', // デフォルトアバター
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

  const talkId = createResponse.data.id

  // 動画生成の完了を待つ（ポーリング）
  let videoUrl = ''
  let attempts = 0
  const maxAttempts = 60 // 最大10分待機（10秒ごと）

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 10000)) // 10秒待機

    const statusResponse = await axios.get(
      `https://api.d-id.com/talks/${talkId}`,
      {
        headers: {
          Authorization: `Basic ${DID_API_KEY}`,
        },
      }
    )

    const status = statusResponse.data.status

    if (status === 'done') {
      videoUrl = statusResponse.data.result_url
      break
    } else if (status === 'error' || status === 'rejected') {
      throw new Error(`D-ID video generation failed: ${status}`)
    }

    attempts++
  }

  if (!videoUrl) {
    throw new Error('Video generation timed out')
  }

  return videoUrl
}
