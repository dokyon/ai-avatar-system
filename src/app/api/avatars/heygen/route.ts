import { NextRequest, NextResponse } from 'next/server'
import { HeyGenService } from '@/services/heygen.service'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

/**
 * GET /api/avatars/heygen
 *
 * Get list of available HeyGen avatars
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HeyGen API key is not configured' },
        { status: 500 }
      )
    }

    console.log('[HeyGen Avatars] Fetching avatar list...')

    const heygenService = new HeyGenService(apiKey)
    const avatars = await heygenService.listAvatars()

    // Transform to compatible format with existing UI
    const transformedAvatars = avatars.map((avatar) => ({
      id: avatar.avatar_id, // Use HeyGen ID directly
      avatar_id: avatar.avatar_id,
      name: avatar.avatar_name,
      avatar_name: avatar.avatar_name,
      image_url: avatar.preview_image_url || '',
      preview_video_url: avatar.preview_video_url || '',
      gender: avatar.gender,
      is_active: !avatar.is_customized, // Public avatars are active
      category: avatar.gender === 'female' ? 'business' : 'general',
      description: `Professional ${avatar.gender || 'avatar'}`,
      is_customized: avatar.is_customized || false,
    }))

    console.log(`[HeyGen Avatars] Found ${transformedAvatars.length} avatars`)

    return NextResponse.json({
      avatars: transformedAvatars,
      total: transformedAvatars.length,
      success: true,
    })
  } catch (error) {
    console.error('[HeyGen Avatars] Error:', error)
    return NextResponse.json(
      {
        avatars: [],
        total: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch HeyGen avatars',
      },
      { status: 500 }
    )
  }
}
