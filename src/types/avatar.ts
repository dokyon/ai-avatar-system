/**
 * Avatar Type Definitions
 *
 * Type definitions for D-ID avatar master data system.
 * Provides type safety for avatar selection and management.
 *
 * @module types/avatar
 */

/**
 * Avatar category type
 *
 * Categories for organizing avatars by use case:
 * - business: Professional corporate avatars
 * - general: General purpose avatars
 * - casual: Informal, friendly avatars
 * - education: Education-focused avatars
 */
export type AvatarCategory = 'business' | 'general' | 'casual' | 'education';

/**
 * Avatar database entity
 *
 * Represents an avatar record in the Supabase database.
 * Contains all metadata needed for avatar selection and D-ID API calls.
 */
export interface Avatar {
  /** Unique identifier (UUID) */
  id: string;

  /** Display name of the avatar */
  name: string;

  /** D-ID source image URL for API calls */
  d_id_source_url: string;

  /** Thumbnail image URL for UI display */
  thumbnail_url: string | null;

  /** Avatar description for users */
  description: string | null;

  /** Avatar category for filtering */
  category: AvatarCategory;

  /** Flag to enable/disable avatar availability */
  is_active: boolean;

  /** Record creation timestamp */
  created_at: string;

  /** Record last update timestamp */
  updated_at: string;
}

/**
 * Avatar list API response
 *
 * Response format for GET /api/avatars endpoint.
 */
export interface AvatarListResponse {
  /** List of available avatars */
  avatars: Avatar[];

  /** Total number of avatars */
  total: number;

  /** Success status */
  success: boolean;

  /** Error message (if any) */
  error?: string;
}

/**
 * Avatar selection payload
 *
 * Used when selecting an avatar for video generation.
 */
export interface AvatarSelection {
  /** Selected avatar ID */
  avatarId: string;

  /** Avatar name for display */
  avatarName: string;

  /** D-ID source URL for API call */
  sourceUrl: string;
}

/**
 * Avatar filter options
 *
 * Query parameters for filtering avatar list.
 */
export interface AvatarFilterOptions {
  /** Filter by category */
  category?: AvatarCategory;

  /** Only return active avatars */
  activeOnly?: boolean;

  /** Search by name */
  search?: string;

  /** Limit number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}
