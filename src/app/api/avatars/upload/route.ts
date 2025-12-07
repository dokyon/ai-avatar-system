import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

/**
 * POST /api/avatars/upload
 *
 * Upload a photo for creating a custom HeyGen avatar
 *
 * Expected request body (multipart/form-data):
 * - file: The photo file (JPEG/PNG)
 * - avatarName: Name for the avatar
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const avatarName = formData.get('avatarName') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが指定されていません' },
        { status: 400 }
      )
    }

    if (!avatarName) {
      return NextResponse.json(
        { error: 'アバター名が指定されていません' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '対応している画像形式はJPEG/PNGのみです' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `avatar_${timestamp}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatar-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Avatar Upload] Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: `アップロードに失敗しました: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatar-uploads')
      .getPublicUrl(filePath)

    // Record upload in database
    const { data: uploadRecord, error: dbError } = await supabase
      .from('avatar_upload_history')
      .insert([
        {
          file_name: fileName,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
          public_url: publicUrl,
          upload_status: 'uploaded',
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('[Avatar Upload] Database error:', dbError)
      // Continue even if DB insert fails - we have the upload
    }

    console.log('[Avatar Upload] Photo uploaded successfully:', {
      fileName,
      publicUrl,
      uploadId: uploadRecord?.id,
    })

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord?.id,
      fileName,
      publicUrl,
      fileSize: file.size,
      message: '写真のアップロードに成功しました',
    })
  } catch (error) {
    console.error('[Avatar Upload] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アップロードに失敗しました' },
      { status: 500 }
    )
  }
}
