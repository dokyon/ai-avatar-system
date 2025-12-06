/**
 * useAvatars Hook Tests
 *
 * Unit tests for useAvatars custom hook helper functions.
 *
 * @module hooks/useAvatars.test
 */

import { describe, it, expect } from 'vitest';
import { getAvatarById, getDefaultAvatar, DEFAULT_AVATAR_ID } from './useAvatars';
import type { Avatar } from '@/types/avatar';

const mockAvatars: Avatar[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Alice',
    d_id_source_url: 'https://example.com/alice.jpg',
    thumbnail_url: 'https://example.com/alice_thumb.jpg',
    description: 'Business Professional',
    category: 'business',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Bob',
    d_id_source_url: 'https://example.com/bob.jpg',
    thumbnail_url: null,
    description: 'Casual Friendly',
    category: 'casual',
    is_active: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

describe('getAvatarById', () => {
  it('should find avatar by ID', () => {
    const avatar = getAvatarById(mockAvatars, '550e8400-e29b-41d4-a716-446655440001');
    expect(avatar).toEqual(mockAvatars[0]);
  });

  it('should return undefined for non-existent ID', () => {
    const avatar = getAvatarById(mockAvatars, 'non-existent-id');
    expect(avatar).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    const avatar = getAvatarById([], '550e8400-e29b-41d4-a716-446655440001');
    expect(avatar).toBeUndefined();
  });
});

describe('getDefaultAvatar', () => {
  it('should return first active avatar', () => {
    const avatar = getDefaultAvatar(mockAvatars);
    expect(avatar).toEqual(mockAvatars[0]);
    expect(avatar?.is_active).toBe(true);
  });

  it('should return first avatar if no active avatars', () => {
    const inactiveAvatars = mockAvatars.map(a => ({ ...a, is_active: false }));
    const avatar = getDefaultAvatar(inactiveAvatars);
    expect(avatar).toEqual(inactiveAvatars[0]);
  });

  it('should return undefined for empty array', () => {
    const avatar = getDefaultAvatar([]);
    expect(avatar).toBeUndefined();
  });
});

describe('DEFAULT_AVATAR_ID', () => {
  it('should be defined', () => {
    expect(DEFAULT_AVATAR_ID).toBeDefined();
    expect(typeof DEFAULT_AVATAR_ID).toBe('string');
  });

  it('should be a valid UUID format', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(DEFAULT_AVATAR_ID).toMatch(uuidRegex);
  });
});
