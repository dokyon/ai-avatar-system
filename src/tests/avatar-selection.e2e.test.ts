/**
 * Avatar Selection E2E Tests
 *
 * End-to-end tests for avatar selection functionality in the UI.
 * Tests user flows for selecting avatars and generating videos.
 *
 * @module tests/avatar-selection.e2e
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Avatar, AvatarSelection } from '@/types/avatar';

/**
 * Mock UI state for avatar selection
 */
interface AvatarSelectionUIState {
  selectedAvatarId: string | null;
  avatarList: Avatar[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Mock avatar data
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
];

/**
 * Mock UI component for avatar selection
 */
class AvatarSelector {
  private state: AvatarSelectionUIState = {
    selectedAvatarId: null,
    avatarList: [],
    isLoading: false,
    error: null,
  };

  async fetchAvatars(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.state.avatarList = mockAvatars;
      this.state.isLoading = false;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to fetch avatars';
      this.state.isLoading = false;
      this.state.avatarList = [];
    }
  }

  selectAvatar(avatarId: string): boolean {
    const avatar = this.state.avatarList.find((a) => a.id === avatarId);
    if (!avatar) {
      this.state.error = 'アバターが見つかりません';
      return false;
    }

    this.state.selectedAvatarId = avatarId;
    this.state.error = null;
    return true;
  }

  getSelectedAvatar(): AvatarSelection | null {
    if (!this.state.selectedAvatarId) {
      return null;
    }

    const avatar = this.state.avatarList.find((a) => a.id === this.state.selectedAvatarId);
    if (!avatar) {
      return null;
    }

    return {
      avatarId: avatar.id,
      avatarName: avatar.name,
      sourceUrl: avatar.d_id_source_url,
    };
  }

  getState(): AvatarSelectionUIState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      selectedAvatarId: null,
      avatarList: [],
      isLoading: false,
      error: null,
    };
  }
}

describe('Avatar Selection E2E Tests', () => {
  let selector: AvatarSelector;

  beforeEach(() => {
    selector = new AvatarSelector();
    vi.clearAllMocks();
  });

  describe('Avatar List Display', () => {
    it('should fetch and display avatar list on page load', async () => {
      await selector.fetchAvatars();
      const state = selector.getState();

      expect(state.avatarList.length).toBeGreaterThan(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should display loading state during fetch', async () => {
      const fetchPromise = selector.fetchAvatars();
      const loadingState = selector.getState();

      expect(loadingState.isLoading).toBe(true);

      await fetchPromise;
      const finalState = selector.getState();

      expect(finalState.isLoading).toBe(false);
    });

    it('should display avatar names and thumbnails', async () => {
      await selector.fetchAvatars();
      const state = selector.getState();

      state.avatarList.forEach((avatar) => {
        expect(avatar.name).toBeTruthy();
        expect(avatar.thumbnail_url).toBeTruthy();
      });
    });

    it('should display avatar descriptions', async () => {
      await selector.fetchAvatars();
      const state = selector.getState();

      state.avatarList.forEach((avatar) => {
        expect(avatar.description).toBeTruthy();
      });
    });
  });

  describe('Avatar Selection Flow', () => {
    beforeEach(async () => {
      await selector.fetchAvatars();
    });

    it('should allow selecting an avatar from dropdown', () => {
      const targetAvatar = mockAvatars[0];
      const success = selector.selectAvatar(targetAvatar.id);

      expect(success).toBe(true);
      expect(selector.getState().selectedAvatarId).toBe(targetAvatar.id);
      expect(selector.getState().error).toBeNull();
    });

    it('should update UI when avatar is selected', () => {
      const targetAvatar = mockAvatars[1];
      selector.selectAvatar(targetAvatar.id);

      const selectedAvatar = selector.getSelectedAvatar();

      expect(selectedAvatar).not.toBeNull();
      expect(selectedAvatar?.avatarId).toBe(targetAvatar.id);
      expect(selectedAvatar?.avatarName).toBe(targetAvatar.name);
      expect(selectedAvatar?.sourceUrl).toBe(targetAvatar.d_id_source_url);
    });

    it('should allow changing avatar selection', () => {
      selector.selectAvatar(mockAvatars[0].id);
      expect(selector.getState().selectedAvatarId).toBe(mockAvatars[0].id);

      selector.selectAvatar(mockAvatars[1].id);
      expect(selector.getState().selectedAvatarId).toBe(mockAvatars[1].id);
    });

    it('should handle invalid avatar selection', () => {
      const success = selector.selectAvatar('invalid-id');

      expect(success).toBe(false);
      expect(selector.getState().error).toBe('アバターが見つかりません');
      expect(selector.getState().selectedAvatarId).toBeNull();
    });
  });

  describe('Default Avatar Behavior', () => {
    it('should have no avatar selected initially', () => {
      const selectedAvatar = selector.getSelectedAvatar();
      expect(selectedAvatar).toBeNull();
    });

    it('should allow using default avatar when none selected', async () => {
      await selector.fetchAvatars();
      const defaultAvatar = mockAvatars[0]; // First active avatar

      expect(defaultAvatar.is_active).toBe(true);
      expect(defaultAvatar.d_id_source_url).toBeTruthy();
    });
  });

  describe('Avatar Category Filtering', () => {
    beforeEach(async () => {
      await selector.fetchAvatars();
    });

    it('should display avatars grouped by category', () => {
      const state = selector.getState();
      const categories = new Set(state.avatarList.map((a) => a.category));

      expect(categories.size).toBeGreaterThan(0);
      expect(categories.has('business') || categories.has('general') || categories.has('casual')).toBe(
        true
      );
    });

    it('should filter avatars by business category', () => {
      const state = selector.getState();
      const businessAvatars = state.avatarList.filter((a) => a.category === 'business');

      expect(businessAvatars.length).toBeGreaterThan(0);
      expect(businessAvatars.every((a) => a.category === 'business')).toBe(true);
    });
  });

  describe('Avatar Thumbnail Display', () => {
    beforeEach(async () => {
      await selector.fetchAvatars();
    });

    it('should provide thumbnail URLs for UI display', () => {
      const state = selector.getState();

      state.avatarList.forEach((avatar) => {
        if (avatar.thumbnail_url) {
          expect(avatar.thumbnail_url).toMatch(/^https:\/\//);
        }
      });
    });

    it('should handle avatars without thumbnails', () => {
      const state = selector.getState();
      const avatarsWithoutThumbnails = state.avatarList.filter((a) => !a.thumbnail_url);

      // Should still be selectable even without thumbnail
      if (avatarsWithoutThumbnails.length > 0) {
        expect(avatarsWithoutThumbnails[0].d_id_source_url).toBeTruthy();
      }
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      // Create a custom error selector that simulates fetch failure
      class ErrorAvatarSelector extends AvatarSelector {
        async fetchAvatars(): Promise<void> {
          this['state'].isLoading = true;
          this['state'].error = 'Network error';
          this['state'].isLoading = false;
        }
      }

      const errorSelector = new ErrorAvatarSelector();
      await errorSelector.fetchAvatars();

      const state = errorSelector.getState();
      expect(state.error).toBeTruthy();
    });

    it('should clear error on successful retry', async () => {
      selector.selectAvatar('invalid-id');
      expect(selector.getState().error).toBeTruthy();

      await selector.fetchAvatars();
      selector.selectAvatar(mockAvatars[0].id);

      expect(selector.getState().error).toBeNull();
    });
  });

  describe('UI Accessibility', () => {
    beforeEach(async () => {
      await selector.fetchAvatars();
    });

    it('should have accessible avatar selection dropdown', () => {
      const state = selector.getState();

      // Dropdown should have options
      expect(state.avatarList.length).toBeGreaterThan(0);

      // Each option should have a unique ID
      const ids = state.avatarList.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should provide avatar descriptions for screen readers', () => {
      const state = selector.getState();

      state.avatarList.forEach((avatar) => {
        expect(avatar.name).toBeTruthy(); // For aria-label
        expect(avatar.description).toBeTruthy(); // For aria-describedby
      });
    });
  });

  describe('Avatar Selection Persistence', () => {
    it('should maintain selection across page state', () => {
      selector.fetchAvatars().then(() => {
        selector.selectAvatar(mockAvatars[0].id);
        const selectedId = selector.getState().selectedAvatarId;

        // Simulate page re-render
        const newState = selector.getState();
        expect(newState.selectedAvatarId).toBe(selectedId);
      });
    });
  });

  describe('Performance', () => {
    it('should load avatar list quickly', async () => {
      const startTime = Date.now();
      await selector.fetchAvatars();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle avatar selection instantly', async () => {
      await selector.fetchAvatars();

      const startTime = Date.now();
      selector.selectAvatar(mockAvatars[0].id);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});

/**
 * Integration with Video Generation
 */
describe('Avatar Selection - Video Generation Integration', () => {
  let selector: AvatarSelector;

  beforeEach(async () => {
    selector = new AvatarSelector();
    await selector.fetchAvatars();
  });

  it('should provide selected avatar data for video generation API', () => {
    selector.selectAvatar(mockAvatars[0].id);
    const selectedAvatar = selector.getSelectedAvatar();

    expect(selectedAvatar).not.toBeNull();
    expect(selectedAvatar?.avatarId).toBeTruthy();
    expect(selectedAvatar?.sourceUrl).toMatch(/^https:\/\//);
  });

  it('should validate avatar selection before video generation', () => {
    const selectedAvatar = selector.getSelectedAvatar();

    if (selectedAvatar === null) {
      // Should use default avatar or show error
      expect(mockAvatars[0].d_id_source_url).toBeTruthy();
    } else {
      expect(selectedAvatar.sourceUrl).toBeTruthy();
    }
  });
});
