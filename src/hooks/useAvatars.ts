/**
 * useAvatars Hook
 *
 * Custom hook for fetching and managing avatar data.
 * Provides client-side data fetching with automatic revalidation.
 *
 * @module hooks/useAvatars
 */

import { useState, useEffect, useCallback } from 'react';
import type { Avatar, AvatarFilterOptions } from '@/types/avatar';

/**
 * Avatar fetch state
 */
interface AvatarFetchState {
  /** List of fetched avatars */
  avatars: Avatar[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Total count of avatars */
  total: number;
  /** Revalidate/refetch function */
  mutate: () => Promise<void>;
}

/**
 * useAvatars Hook
 *
 * Fetches avatar list from the API with optional filtering.
 * Implements manual SWR-like pattern without external dependency.
 *
 * @param options - Filter options for avatar query
 * @returns Avatar fetch state and control functions
 *
 * @example
 * ```tsx
 * const { avatars, isLoading, error, mutate } = useAvatars({ activeOnly: true });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {avatars.map(avatar => (
 *       <div key={avatar.id}>{avatar.name}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAvatars(options?: AvatarFilterOptions): AvatarFetchState {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch avatars from API
   */
  const fetchAvatars = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const params = new URLSearchParams();

      if (options?.category) {
        params.append('category', options.category);
      }

      if (options?.activeOnly !== undefined) {
        params.append('activeOnly', String(options.activeOnly));
      }

      if (options?.search) {
        params.append('search', options.search);
      }

      if (options?.limit !== undefined) {
        params.append('limit', String(options.limit));
      }

      if (options?.offset !== undefined) {
        params.append('offset', String(options.offset));
      }

      const queryString = params.toString();
      const url = `/api/avatars${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch avatars: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch avatars');
      }

      setAvatars(data.avatars || []);
      setTotal(data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(new Error(errorMessage));
      setAvatars([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [options?.category, options?.activeOnly, options?.search, options?.limit, options?.offset]);

  /**
   * Initial fetch on mount and when options change
   */
  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  return {
    avatars,
    total,
    isLoading,
    error,
    mutate: fetchAvatars,
  };
}

/**
 * Default avatar configuration
 *
 * Provides fallback default avatar for initial state.
 */
export const DEFAULT_AVATAR_ID = '550e8400-e29b-41d4-a716-446655440001'; // Alice (Business Professional)

/**
 * Get avatar by ID from list
 *
 * Helper function to find avatar by ID.
 *
 * @param avatars - Avatar list
 * @param avatarId - Target avatar ID
 * @returns Avatar if found, undefined otherwise
 */
export function getAvatarById(avatars: Avatar[], avatarId: string): Avatar | undefined {
  return avatars.find((avatar) => avatar.id === avatarId);
}

/**
 * Get default avatar from list
 *
 * Returns the first active avatar or undefined.
 *
 * @param avatars - Avatar list
 * @returns First active avatar or undefined
 */
export function getDefaultAvatar(avatars: Avatar[]): Avatar | undefined {
  return avatars.find((avatar) => avatar.is_active) || avatars[0];
}
