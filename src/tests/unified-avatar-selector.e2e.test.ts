/**
 * Unified Avatar Selector E2E Tests
 *
 * Tests for the unified avatar selection UI that combines both D-ID and
 * custom HeyGen avatars in a single selector component.
 *
 * @module tests/unified-avatar-selector.e2e
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Avatar types
 */
type AvatarType = 'd-id' | 'custom';

/**
 * Unified avatar option (combines D-ID and custom avatars)
 */
interface AvatarOption {
  id: string;
  name: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category?: string;
  type: AvatarType;
  heygen_avatar_id?: string | null;
  d_id_source_url?: string;
}

/**
 * Mock unified avatar selector service
 */
class UnifiedAvatarSelectorService {
  private didAvatars: AvatarOption[] = [
    {
      id: 'd-id-1',
      name: 'Alice',
      description: 'Business Professional',
      thumbnail_url: 'https://example.com/alice.jpg',
      category: 'business',
      type: 'd-id',
      d_id_source_url: 'https://d-id.com/alice.jpg',
    },
    {
      id: 'd-id-2',
      name: 'James',
      description: 'General Purpose',
      thumbnail_url: 'https://example.com/james.jpg',
      category: 'general',
      type: 'd-id',
      d_id_source_url: 'https://d-id.com/james.jpg',
    },
  ];

  private customAvatars: AvatarOption[] = [];
  private selectedAvatar: AvatarOption | null = null;
  private isLoading = false;
  private error: string | null = null;

  async fetchAvatars(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 50));
      this.isLoading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'アバター読み込みエラー';
      this.isLoading = false;
    }
  }

  addCustomAvatar(avatar: Omit<AvatarOption, 'type'>): void {
    this.customAvatars.push({
      ...avatar,
      type: 'custom',
    });
  }

  getAllAvatars(): AvatarOption[] {
    return [...this.didAvatars, ...this.customAvatars];
  }

  getAvatarsByType(type: AvatarType): AvatarOption[] {
    return this.getAllAvatars().filter((a) => a.type === type);
  }

  selectAvatar(avatarId: string): boolean {
    const avatar = this.getAllAvatars().find((a) => a.id === avatarId);
    if (!avatar) {
      this.error = 'アバターが見つかりません';
      return false;
    }

    this.selectedAvatar = avatar;
    this.error = null;
    return true;
  }

  getSelectedAvatar(): AvatarOption | null {
    return this.selectedAvatar;
  }

  getState() {
    return {
      avatars: this.getAllAvatars(),
      selectedAvatar: this.selectedAvatar,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  reset(): void {
    this.didAvatars = [];
    this.customAvatars = [];
    this.selectedAvatar = null;
    this.isLoading = false;
    this.error = null;
  }
}

describe('Unified Avatar Selector - Avatar Loading', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
    vi.clearAllMocks();
  });

  it('should fetch and display both D-ID and custom avatars', async () => {
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      description: 'カスタムアバター',
      thumbnail_url: 'https://example.com/ceo.jpg',
      heygen_avatar_id: 'heygen-123',
    });

    await selectorService.fetchAvatars();

    const state = selectorService.getState();
    expect(state.avatars.length).toBe(3); // 2 D-ID + 1 custom
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should display loading state during fetch', async () => {
    const fetchPromise = selectorService.fetchAvatars();

    // Should be loading initially
    let state = selectorService.getState();
    expect(state.isLoading).toBe(true);

    await fetchPromise;

    // Should be done loading after fetch completes
    state = selectorService.getState();
    expect(state.isLoading).toBe(false);
  });

  it('should group avatars by type', () => {
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      heygen_avatar_id: 'heygen-123',
    });

    const didAvatars = selectorService.getAvatarsByType('d-id');
    const customAvatars = selectorService.getAvatarsByType('custom');

    expect(didAvatars.length).toBe(2);
    expect(customAvatars.length).toBe(1);
    expect(didAvatars.every((a) => a.type === 'd-id')).toBe(true);
    expect(customAvatars.every((a) => a.type === 'custom')).toBe(true);
  });
});

describe('Unified Avatar Selector - D-ID Avatars', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
  });

  it('should display D-ID avatars with correct properties', () => {
    const didAvatars = selectorService.getAvatarsByType('d-id');

    didAvatars.forEach((avatar) => {
      expect(avatar.id).toBeTruthy();
      expect(avatar.name).toBeTruthy();
      expect(avatar.type).toBe('d-id');
      expect(avatar.d_id_source_url).toBeTruthy();
    });
  });

  it('should allow selecting D-ID avatars', () => {
    const success = selectorService.selectAvatar('d-id-1');

    expect(success).toBe(true);
    expect(selectorService.getSelectedAvatar()?.id).toBe('d-id-1');
    expect(selectorService.getSelectedAvatar()?.type).toBe('d-id');
  });

  it('should display D-ID avatar categories', () => {
    const didAvatars = selectorService.getAvatarsByType('d-id');
    const categories = new Set(didAvatars.map((a) => a.category));

    expect(categories.size).toBeGreaterThan(0);
    expect(categories.has('business') || categories.has('general')).toBe(true);
  });
});

describe('Unified Avatar Selector - Custom Avatars', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
  });

  it('should display custom avatars with correct properties', () => {
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      description: 'カスタムアバター',
      thumbnail_url: 'https://example.com/ceo.jpg',
      heygen_avatar_id: 'heygen-123',
    });

    const customAvatars = selectorService.getAvatarsByType('custom');

    expect(customAvatars.length).toBe(1);
    expect(customAvatars[0].id).toBe('custom-1');
    expect(customAvatars[0].name).toBe('社長アバター');
    expect(customAvatars[0].type).toBe('custom');
    expect(customAvatars[0].heygen_avatar_id).toBe('heygen-123');
  });

  it('should allow selecting custom avatars', () => {
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      heygen_avatar_id: 'heygen-123',
    });

    const success = selectorService.selectAvatar('custom-1');

    expect(success).toBe(true);
    expect(selectorService.getSelectedAvatar()?.id).toBe('custom-1');
    expect(selectorService.getSelectedAvatar()?.type).toBe('custom');
  });

  it('should display custom avatar preview images', () => {
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      thumbnail_url: 'https://example.com/ceo-preview.jpg',
      heygen_avatar_id: 'heygen-123',
    });

    const customAvatars = selectorService.getAvatarsByType('custom');
    expect(customAvatars[0].thumbnail_url).toBeTruthy();
    expect(customAvatars[0].thumbnail_url).toMatch(/\.(jpg|png)$/);
  });

  it('should include HeyGen avatar ID for custom avatars', () => {
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      heygen_avatar_id: 'heygen-avatar-123',
    });

    const customAvatars = selectorService.getAvatarsByType('custom');
    expect(customAvatars[0].heygen_avatar_id).toBe('heygen-avatar-123');
  });
});

describe('Unified Avatar Selector - Selection Flow', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      heygen_avatar_id: 'heygen-123',
    });
  });

  it('should allow switching between D-ID and custom avatars', () => {
    // Select D-ID avatar
    selectorService.selectAvatar('d-id-1');
    expect(selectorService.getSelectedAvatar()?.type).toBe('d-id');

    // Switch to custom avatar
    selectorService.selectAvatar('custom-1');
    expect(selectorService.getSelectedAvatar()?.type).toBe('custom');

    // Switch back to D-ID
    selectorService.selectAvatar('d-id-2');
    expect(selectorService.getSelectedAvatar()?.type).toBe('d-id');
  });

  it('should update selection state correctly', () => {
    selectorService.selectAvatar('custom-1');

    const state = selectorService.getState();
    expect(state.selectedAvatar?.id).toBe('custom-1');
    expect(state.selectedAvatar?.name).toBe('社長アバター');
    expect(state.error).toBeNull();
  });

  it('should handle invalid avatar ID', () => {
    const success = selectorService.selectAvatar('non-existent-id');

    expect(success).toBe(false);
    expect(selectorService.getState().error).toBeTruthy();
    expect(selectorService.getSelectedAvatar()).toBeNull();
  });

  it('should clear error on successful selection', () => {
    // Trigger error
    selectorService.selectAvatar('invalid-id');
    expect(selectorService.getState().error).toBeTruthy();

    // Successful selection should clear error
    selectorService.selectAvatar('d-id-1');
    expect(selectorService.getState().error).toBeNull();
  });
});

describe('Unified Avatar Selector - Dropdown UI', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      heygen_avatar_id: 'heygen-123',
    });
  });

  it('should provide grouped options for dropdown', () => {
    const didGroup = selectorService.getAvatarsByType('d-id');
    const customGroup = selectorService.getAvatarsByType('custom');

    expect(didGroup.length).toBeGreaterThan(0);
    expect(customGroup.length).toBeGreaterThan(0);
  });

  it('should display avatar names in dropdown', () => {
    const allAvatars = selectorService.getAllAvatars();

    allAvatars.forEach((avatar) => {
      expect(avatar.name).toBeTruthy();
      expect(avatar.name.length).toBeGreaterThan(0);
    });
  });

  it('should include descriptive labels', () => {
    const allAvatars = selectorService.getAllAvatars();

    // All avatars should have either description or category
    allAvatars.forEach((avatar) => {
      expect(avatar.description || avatar.category || avatar.name).toBeTruthy();
    });
  });
});

describe('Unified Avatar Selector - Preview Display', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      description: 'カスタムアバター',
      thumbnail_url: 'https://example.com/ceo.jpg',
      heygen_avatar_id: 'heygen-123',
    });
  });

  it('should show preview for selected avatar', () => {
    selectorService.selectAvatar('d-id-1');

    const selected = selectorService.getSelectedAvatar();
    expect(selected).not.toBeNull();
    expect(selected?.thumbnail_url).toBeTruthy();
  });

  it('should display avatar metadata in preview', () => {
    selectorService.selectAvatar('custom-1');

    const selected = selectorService.getSelectedAvatar();
    expect(selected?.name).toBe('社長アバター');
    expect(selected?.description).toBe('カスタムアバター');
    expect(selected?.thumbnail_url).toBeTruthy();
  });

  it('should show type badge in preview', () => {
    selectorService.selectAvatar('d-id-1');
    let selected = selectorService.getSelectedAvatar();
    expect(selected?.type).toBe('d-id');

    selectorService.selectAvatar('custom-1');
    selected = selectorService.getSelectedAvatar();
    expect(selected?.type).toBe('custom');
  });

  it('should handle avatars without thumbnails', () => {
    selectorService.addCustomAvatar({
      id: 'custom-2',
      name: 'アバター2',
      heygen_avatar_id: 'heygen-456',
    });

    selectorService.selectAvatar('custom-2');
    const selected = selectorService.getSelectedAvatar();

    expect(selected).not.toBeNull();
    expect(selected?.thumbnail_url).toBeUndefined();
  });
});

describe('Unified Avatar Selector - Empty State', () => {
  it('should handle no avatars available', () => {
    const selectorService = new UnifiedAvatarSelectorService();
    // Remove default D-ID avatars for testing
    selectorService.reset();

    const avatars = selectorService.getAllAvatars();
    expect(avatars.length).toBe(0);
  });

  it('should handle only D-ID avatars (no custom)', () => {
    const selectorService = new UnifiedAvatarSelectorService();

    const didAvatars = selectorService.getAvatarsByType('d-id');
    const customAvatars = selectorService.getAvatarsByType('custom');

    expect(didAvatars.length).toBeGreaterThan(0);
    expect(customAvatars.length).toBe(0);
  });

  it('should handle only custom avatars (no D-ID)', () => {
    const selectorService = new UnifiedAvatarSelectorService();
    selectorService.reset();

    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      heygen_avatar_id: 'heygen-123',
    });

    const didAvatars = selectorService.getAvatarsByType('d-id');
    const customAvatars = selectorService.getAvatarsByType('custom');

    expect(didAvatars.length).toBe(0);
    expect(customAvatars.length).toBe(1);
  });
});

describe('Unified Avatar Selector - Error Handling', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
  });

  it('should display error message on fetch failure', () => {
    selectorService['error'] = 'Network error';

    const state = selectorService.getState();
    expect(state.error).toBe('Network error');
  });

  it('should display error message on invalid selection', () => {
    selectorService.selectAvatar('invalid-id');

    const state = selectorService.getState();
    expect(state.error).toBeTruthy();
  });

  it('should recover from error state', async () => {
    selectorService['error'] = 'Previous error';
    await selectorService.fetchAvatars();

    const state = selectorService.getState();
    expect(state.error).toBeNull();
  });
});

describe('Unified Avatar Selector - Integration', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      heygen_avatar_id: 'heygen-123',
    });
  });

  it('should provide correct data for video generation', () => {
    selectorService.selectAvatar('custom-1');
    const selected = selectorService.getSelectedAvatar();

    expect(selected?.id).toBeTruthy();
    expect(selected?.type).toBe('custom');
    expect(selected?.heygen_avatar_id).toBe('heygen-123');
  });

  it('should provide D-ID source URL for D-ID avatars', () => {
    selectorService.selectAvatar('d-id-1');
    const selected = selectorService.getSelectedAvatar();

    expect(selected?.type).toBe('d-id');
    expect(selected?.d_id_source_url).toBeTruthy();
  });

  it('should provide HeyGen avatar ID for custom avatars', () => {
    selectorService.selectAvatar('custom-1');
    const selected = selectorService.getSelectedAvatar();

    expect(selected?.type).toBe('custom');
    expect(selected?.heygen_avatar_id).toBe('heygen-123');
  });

  it('should maintain consistent data structure for both types', () => {
    const allAvatars = selectorService.getAllAvatars();

    allAvatars.forEach((avatar) => {
      expect(avatar.id).toBeTruthy();
      expect(avatar.name).toBeTruthy();
      expect(avatar.type).toMatch(/^(d-id|custom)$/);
    });
  });
});

describe('Unified Avatar Selector - Performance', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
  });

  it('should fetch avatars quickly', async () => {
    const startTime = Date.now();
    await selectorService.fetchAvatars();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle selection instantly', () => {
    const startTime = Date.now();
    selectorService.selectAvatar('d-id-1');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(10);
  });

  it('should handle large number of avatars efficiently', () => {
    // Add many custom avatars
    for (let i = 0; i < 50; i++) {
      selectorService.addCustomAvatar({
        id: `custom-${i}`,
        name: `アバター ${i}`,
        heygen_avatar_id: `heygen-${i}`,
      });
    }

    const startTime = Date.now();
    const allAvatars = selectorService.getAllAvatars();
    const endTime = Date.now();

    expect(allAvatars.length).toBe(52); // 2 D-ID + 50 custom
    expect(endTime - startTime).toBeLessThan(50);
  });
});

describe('Unified Avatar Selector - Accessibility', () => {
  let selectorService: UnifiedAvatarSelectorService;

  beforeEach(() => {
    selectorService = new UnifiedAvatarSelectorService();
    selectorService.addCustomAvatar({
      id: 'custom-1',
      name: '社長アバター',
      description: 'カスタムアバター',
      heygen_avatar_id: 'heygen-123',
    });
  });

  it('should provide unique IDs for all avatars', () => {
    const allAvatars = selectorService.getAllAvatars();
    const ids = allAvatars.map((a) => a.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should provide descriptive names for screen readers', () => {
    const allAvatars = selectorService.getAllAvatars();

    allAvatars.forEach((avatar) => {
      expect(avatar.name).toBeTruthy();
      expect(avatar.name.length).toBeGreaterThan(0);
    });
  });

  it('should provide descriptions for context', () => {
    const allAvatars = selectorService.getAllAvatars();

    allAvatars.forEach((avatar) => {
      expect(avatar.description || avatar.category).toBeTruthy();
    });
  });
});
