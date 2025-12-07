import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HeyGenService } from '@/services/heygen.service'
import { HeyGenError } from '@/types/heygen'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface CreateAvatarRequest {
  avatarName: string
  photoUrl: string
  uploadId?: string
}

/**
 * POST /api/avatars/create
 *
 * Create a custom HeyGen Photo Avatar from an uploaded photo
 *
 * Expected request body:
 * - avatarName: Name for the avatar
 * - photoUrl: Public URL of the uploaded photo
 * - uploadId: Optional ID from the upload history
 */
export async function POST(request: NextRequest) {
  try {
    const { avatarName, photoUrl, uploadId } = await request.json() as CreateAvatarRequest

    if (!avatarName) {
      return NextResponse.json(
        { error: 'アバター名が指定されていません' },
        { status: 400 }
      )
    }

    if (!photoUrl) {
      return NextResponse.json(
        { error: '写真URLが指定されていません' },
        { status: 400 }
      )
    }

    // Check HeyGen API key
    const apiKey = process.env.HEYGEN_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HeyGen API key is not configured' },
        { status: 500 }
      )
    }

    console.log('[Avatar Create] Creating HeyGen Photo Avatar:', {
      avatarName,
      photoUrl,
    })

    // Create database record first
    const { data: avatarRecord, error: dbError } = await supabase
      .from('custom_avatars')
      .insert([
        {
          avatar_name: avatarName,
          upload_id: uploadId || null,
          photo_url: photoUrl,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('[Avatar Create] Database error:', dbError)
      return NextResponse.json(
        { error: `データベースエラー: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Start avatar creation asynchronously
    createAvatarAsync(avatarRecord.id, avatarName, photoUrl).catch(console.error)

    return NextResponse.json({
      success: true,
      avatarId: avatarRecord.id,
      message: 'カスタムアバターの作成を開始しました',
    })
  } catch (error) {
    console.error('[Avatar Create] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アバター作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * Asynchronously create HeyGen Photo Avatar
 */
async function createAvatarAsync(
  recordId: string,
  avatarName: string,
  photoUrl: string
) {
  const startTime = Date.now()

  try {
    const apiKey = process.env.HEYGEN_API_KEY!

    // Update status to processing
    await supabase
      .from('custom_avatars')
      .update({ status: 'processing' })
      .eq('id', recordId)

    console.log(`[Avatar ${recordId}] Creating HeyGen Photo Avatar...`)

    // Initialize HeyGen service
    const heygenService = new HeyGenService(apiKey)

    // Create photo avatar
    const heygenAvatarId = await heygenService.createPhotoAvatar({
      avatar_name: avatarName,
      photo_url: photoUrl,
    })

    console.log(`[Avatar ${recordId}] HeyGen Photo Avatar creation initiated:`, heygenAvatarId)

    // Wait for avatar creation to complete
    const avatarData = await heygenService.waitForPhotoAvatarCompletion(heygenAvatarId, {
      pollingInterval: 10000, // 10 seconds
      maxAttempts: 60, // 10 minutes max
    })

    // Update database with completed avatar
    await supabase
      .from('custom_avatars')
      .update({
        status: 'completed',
        heygen_avatar_id: heygenAvatarId,
        preview_image_url: avatarData.preview_image_url,
        preview_video_url: avatarData.preview_video_url,
      })
      .eq('id', recordId)

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    console.log(`[Avatar ${recordId}] Avatar creation completed in ${elapsedTime}s:`, {
      heygenAvatarId,
      previewImage: avatarData.preview_image_url,
    })
  } catch (error) {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    console.error(`[Avatar ${recordId}] Avatar creation failed after ${elapsedTime}s:`, error)

    let errorMessage = 'アバター作成に失敗しました'
    if (error instanceof HeyGenError) {
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    // Update database with error
    await supabase
      .from('custom_avatars')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', recordId)
  }
}

/**
 * GET /api/avatars/create/:id
 *
 * Get status of avatar creation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Avatar ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('custom_avatars')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[Avatar Create] Get status error:', error)
      return NextResponse.json(
        { error: 'アバターが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      avatar: data,
    })
  } catch (error) {
    console.error('[Avatar Create] Get status unexpected error:', error)
    return NextResponse.json(
      { error: 'ステータス取得に失敗しました' },
      { status: 500 }
    )
  }
}
