import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface CustomAvatar {
  id: string;
  avatar_name: string;
  photo_url: string;
  heygen_avatar_id: string | null;
  status: string;
  preview_image_url: string | null;
  preview_video_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomAvatarsListResponse {
  success: boolean;
  avatars?: CustomAvatar[];
  total?: number;
  error?: string;
}

// GET: List all custom avatars
export async function GET(request: NextRequest): Promise<NextResponse<CustomAvatarsListResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('custom_avatars')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[CustomAvatars] Failed to fetch custom avatars:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatars: data as CustomAvatar[],
      total: count || 0,
    });
  } catch (error) {
    console.error('[CustomAvatars] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'データ取得に失敗しました',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a custom avatar
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get('id');

    if (!avatarId) {
      return NextResponse.json(
        { success: false, error: 'アバターIDが必要です' },
        { status: 400 }
      );
    }

    // Delete from database
    const { error } = await supabase
      .from('custom_avatars')
      .delete()
      .eq('id', avatarId);

    if (error) {
      console.error('[CustomAvatars] Failed to delete custom avatar:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'アバターを削除しました',
    });
  } catch (error) {
    console.error('[CustomAvatars] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '削除に失敗しました',
      },
      { status: 500 }
    );
  }
}
