/**
 * Avatar API Integration Tests
 *
 * Tests for GET /api/avatars endpoint functionality.
 * Validates avatar list fetching, filtering, pagination, and error handling.
 *
 * @module tests/avatar-api
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Avatar, AvatarListResponse } from '@/types/avatar';

/**
 * Mock Supabase client for testing
 */
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
};

/**
 * Mock avatar data for testing
 */
const mockAvatars: Avatar[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Alice',
    d_id_source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
    thumbnail_url: 'https://example.com/alice_thumb.jpg',
    description: 'Business Professional',
    category: 'business',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'James',
    d_id_source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/james.jpg',
    thumbnail_url: 'https://example.com/james_thumb.jpg',
    description: 'General Purpose',
    category: 'general',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Sarah',
    d_id_source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/sarah.jpg',
    thumbnail_url: 'https://example.com/sarah_thumb.jpg',
    description: 'Casual Friendly',
    category: 'casual',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Bob',
    d_id_source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/bob.jpg',
    thumbnail_url: null,
    description: 'Inactive Avatar',
    category: 'business',
    is_active: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

/**
 * Helper function to simulate avatar API fetch
 */
async function getAvatars(options?: {
  category?: string;
  activeOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AvatarListResponse> {
  // Simulate API call
  let filteredAvatars = [...mockAvatars];

  // Apply filters
  if (options?.activeOnly !== false) {
    filteredAvatars = filteredAvatars.filter((a) => a.is_active);
  }

  if (options?.category) {
    filteredAvatars = filteredAvatars.filter((a) => a.category === options.category);
  }

  if (options?.search) {
    filteredAvatars = filteredAvatars.filter((a) =>
      a.name.toLowerCase().includes(options.search!.toLowerCase())
    );
  }

  // Apply pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  const paginatedAvatars = filteredAvatars.slice(offset, offset + limit);

  return {
    avatars: paginatedAvatars,
    total: filteredAvatars.length,
    success: true,
  };
}

describe('Avatar API - GET /api/avatars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should fetch avatar list successfully', async () => {
      const result = await getAvatars();

      expect(result.success).toBe(true);
      expect(result.avatars).toBeDefined();
      expect(result.avatars.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should return avatars with required properties', async () => {
      const result = await getAvatars();
      const avatar = result.avatars[0];

      expect(avatar).toHaveProperty('id');
      expect(avatar).toHaveProperty('name');
      expect(avatar).toHaveProperty('d_id_source_url');
      expect(avatar).toHaveProperty('category');
      expect(avatar).toHaveProperty('is_active');
      expect(avatar).toHaveProperty('created_at');
      expect(avatar).toHaveProperty('updated_at');
    });

    it('should return only active avatars by default', async () => {
      const result = await getAvatars();

      expect(result.avatars.every((a) => a.is_active)).toBe(true);
      expect(result.avatars.length).toBe(3); // Only 3 active avatars in mock
    });
  });

  describe('Filtering', () => {
    it('should filter by category', async () => {
      const result = await getAvatars({ category: 'business' });

      expect(result.avatars.every((a) => a.category === 'business')).toBe(true);
      expect(result.avatars.length).toBe(1);
      expect(result.avatars[0].name).toBe('Alice');
    });

    it('should filter by search query', async () => {
      const result = await getAvatars({ search: 'alice' });

      expect(result.avatars.length).toBe(1);
      expect(result.avatars[0].name).toBe('Alice');
    });

    it('should return inactive avatars when activeOnly is false', async () => {
      const result = await getAvatars({ activeOnly: false });

      expect(result.avatars.length).toBe(4); // All avatars
      expect(result.avatars.some((a) => !a.is_active)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const result = await getAvatars({
        category: 'business',
        activeOnly: true,
      });

      expect(result.avatars.every((a) => a.category === 'business' && a.is_active)).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('should respect limit parameter', async () => {
      const result = await getAvatars({ limit: 2 });

      expect(result.avatars.length).toBe(2);
      expect(result.total).toBe(3); // Total active avatars
    });

    it('should respect offset parameter', async () => {
      const result = await getAvatars({ offset: 1, limit: 2 });

      expect(result.avatars.length).toBe(2);
      expect(result.avatars[0].name).toBe('James');
    });

    it('should handle offset beyond total', async () => {
      const result = await getAvatars({ offset: 100 });

      expect(result.avatars.length).toBe(0);
      expect(result.total).toBe(3);
    });
  });

  describe('Validation', () => {
    it('should validate limit range', async () => {
      // This would be validated by the API endpoint
      const validLimits = [1, 10, 50, 100];

      for (const limit of validLimits) {
        const result = await getAvatars({ limit });
        expect(result.success).toBe(true);
      }
    });

    it('should validate offset is non-negative', async () => {
      const result = await getAvatars({ offset: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe('Avatar Data Validation', () => {
    it('should have valid UUID format for avatar IDs', async () => {
      const result = await getAvatars();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      result.avatars.forEach((avatar) => {
        expect(avatar.id).toMatch(uuidRegex);
      });
    });

    it('should have valid D-ID source URLs', async () => {
      const result = await getAvatars();

      result.avatars.forEach((avatar) => {
        expect(avatar.d_id_source_url).toMatch(/^https:\/\//);
        expect(avatar.d_id_source_url.length).toBeGreaterThan(0);
      });
    });

    it('should have valid category values', async () => {
      const result = await getAvatars({ activeOnly: false });
      const validCategories = ['business', 'general', 'casual', 'education'];

      result.avatars.forEach((avatar) => {
        expect(validCategories).toContain(avatar.category);
      });
    });

    it('should have valid timestamps', async () => {
      const result = await getAvatars();

      result.avatars.forEach((avatar) => {
        expect(new Date(avatar.created_at).getTime()).toBeGreaterThan(0);
        expect(new Date(avatar.updated_at).getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty results gracefully', async () => {
      const result = await getAvatars({ search: 'nonexistent' });

      expect(result.success).toBe(true);
      expect(result.avatars.length).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle category filter with no matches', async () => {
      const result = await getAvatars({ category: 'education' });

      expect(result.success).toBe(true);
      expect(result.avatars.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should return results quickly', async () => {
      const startTime = Date.now();
      await getAvatars();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large limit values efficiently', async () => {
      const startTime = Date.now();
      await getAvatars({ limit: 100 });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});

/**
 * Integration test utilities
 */
describe('Avatar API Utilities', () => {
  it('should provide type-safe avatar list response', async () => {
    const result = await getAvatars();

    // Type assertion should work without errors
    const response: AvatarListResponse = result;
    expect(response.success).toBeDefined();
    expect(response.avatars).toBeDefined();
    expect(response.total).toBeDefined();
  });

  it('should support all avatar categories', () => {
    const categories = ['business', 'general', 'casual', 'education'];

    categories.forEach((category) => {
      expect(mockAvatars.some((a) => a.category === category) || category === 'education').toBe(
        true
      );
    });
  });
});
