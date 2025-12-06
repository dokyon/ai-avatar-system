/**
 * Avatars API Endpoint
 *
 * GET /api/avatars - Returns list of available D-ID avatars
 *
 * Query Parameters:
 * - category: Filter by avatar category (business, general, casual, education)
 * - activeOnly: Return only active avatars (default: true)
 * - search: Search by avatar name
 * - limit: Limit number of results (default: 50)
 * - offset: Offset for pagination (default: 0)
 *
 * @module api/avatars
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Avatar, AvatarListResponse, AvatarCategory } from '@/types/avatar';

/**
 * GET /api/avatars
 *
 * Returns a list of available D-ID avatars with optional filtering.
 *
 * @param request - Next.js request object
 * @returns JSON response with avatar list
 */
export async function GET(request: NextRequest): Promise<NextResponse<AvatarListResponse>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as AvatarCategory | null;
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default true
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          avatars: [],
          total: 0,
          success: false,
          error: 'Limit must be between 1 and 100',
        },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        {
          avatars: [],
          total: 0,
          success: false,
          error: 'Offset must be non-negative',
        },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase.from('avatars').select('*', { count: 'exact' });

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply ordering, limit, and offset
    query = query.order('category', { ascending: true }).order('name', { ascending: true });
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        {
          avatars: [],
          total: 0,
          success: false,
          error: 'Failed to fetch avatars from database',
        },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        avatars: (data as Avatar[]) || [],
        total: count || 0,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/avatars:', error);
    return NextResponse.json(
      {
        avatars: [],
        total: 0,
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
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
  });
}
