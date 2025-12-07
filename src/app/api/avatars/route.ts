/**
 * Avatars API Endpoint - HeyGen Integration
 *
 * GET /api/avatars - Returns list of available HeyGen avatars
 *
 * Query Parameters:
 * - activeOnly: Return only active avatars (default: true)
 * - limit: Limit number of results (default: 50)
 *
 * @module api/avatars
 */

import { NextRequest, NextResponse } from 'next/server'
import { HeyGenService } from '@/services/heygen.service'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

// In-memory cache for HeyGen avatars
let avatarCache: any[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * GET /api/avatars
 *
 * Returns a list of available HeyGen avatars
 *
 * @param request - Next.js request object
 * @returns JSON response with avatar list
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default true
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const apiKey = process.env.HEYGEN_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          avatars: [],
          total: 0,
          success: false,
          error: 'HeyGen API key is not configured',
        },
        { status: 500 }
      )
    }

    // Check cache first
    const now = Date.now()
    const isCacheValid = avatarCache && (now - cacheTimestamp) < CACHE_DURATION

    let heygenAvatars: any[]

    if (isCacheValid && avatarCache) {
      console.log('[Avatars API] Using cached HeyGen avatars')
      heygenAvatars = avatarCache
    } else {
      console.log('[Avatars API] Fetching HeyGen avatars from API...')
      const heygenService = new HeyGenService(apiKey)
      heygenAvatars = await heygenService.listAvatars()

      // Update cache
      avatarCache = heygenAvatars
      cacheTimestamp = now
      console.log('[Avatars API] Cache updated')
    }

    // Transform HeyGen avatars to match existing Avatar type structure
    let avatars = heygenAvatars.map((avatar) => ({
      id: avatar.avatar_id, // Use HeyGen avatar_id as primary ID (NOT UUID)
      avatar_id: avatar.avatar_id,
      name: avatar.avatar_name,
      avatar_name: avatar.avatar_name,

      // Map HeyGen fields to Avatar type expected fields
      thumbnail_url: avatar.preview_image_url || '',
      d_id_source_url: avatar.avatar_id, // Use HeyGen avatar_id as source identifier

      // HeyGen-specific fields (for backward compatibility)
      image_url: avatar.preview_image_url || '',
      preview_image_url: avatar.preview_image_url || '',
      preview_video_url: avatar.preview_video_url || '',

      gender: avatar.gender || 'female',
      is_active: true,
      category: 'business' as const, // All HeyGen avatars are professional
      description: `Professional ${avatar.gender || ''} avatar for corporate and educational content`,
      is_customized: avatar.is_customized || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Filter by activeOnly
    if (activeOnly) {
      avatars = avatars.filter((a) => a.is_active && !a.is_customized)
    }

    // Apply limit
    avatars = avatars.slice(0, limit)

    console.log(`[Avatars API] Returning ${avatars.length} HeyGen avatars`)

    return NextResponse.json(
      {
        avatars,
        total: avatars.length,
        success: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Avatars API] Error:', error)
    return NextResponse.json(
      {
        avatars: [],
        total: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch avatars',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/avatars
 *
 * CORS preflight handler
 *
 * @returns Empty response with CORS headers
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
