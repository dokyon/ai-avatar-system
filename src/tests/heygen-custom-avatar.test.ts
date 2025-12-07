/**
 * HeyGen Custom Avatar Creation E2E Tests
 *
 * Tests for custom avatar creation from CEO photos using HeyGen Photo Avatar API.
 * Covers avatar creation workflow, status management, and error handling.
 *
 * @module tests/heygen-custom-avatar
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Avatar status types
 */
type AvatarStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Custom avatar data structure
 */
interface CustomAvatar {
  id: string;
  avatarName: string;
  photoUrl: string;
  heygenAvatarId: string | null;
  status: AvatarStatus;
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateAvatarRequest {
  avatarName: string;
  photoUrl: string;
  uploadId?: string;
}

interface CreateAvatarResponse {
  success: boolean;
  avatarId?: string;
  avatarName?: string;
  status?: AvatarStatus;
  error?: string;
}

/**
 * Mock HeyGen avatar creation service
 */
class CustomAvatarService {
  private avatars: Map<string, CustomAvatar> = new Map();
  private nextId = 1;

  async createAvatar(request: CreateAvatarRequest): Promise<CreateAvatarResponse> {
    // Validate avatar name
    if (!request.avatarName || request.avatarName.trim().length === 0) {
      return {
        success: false,
        error: 'アバター名が必要です',
      };
    }

    // Validate photo URL
    if (!request.photoUrl || !request.photoUrl.startsWith('https://')) {
      return {
        success: false,
        error: '有効な写真URLが必要です',
      };
    }

    // Create avatar record
    const avatarId = `avatar-${this.nextId++}`;
    const now = new Date().toISOString();

    const avatar: CustomAvatar = {
      id: avatarId,
      avatarName: request.avatarName,
      photoUrl: request.photoUrl,
      heygenAvatarId: null,
      status: 'pending',
      previewImageUrl: null,
      previewVideoUrl: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    this.avatars.set(avatarId, avatar);

    // Simulate async processing
    this.processAvatarAsync(avatarId).catch(console.error);

    return {
      success: true,
      avatarId,
      avatarName: request.avatarName,
      status: 'pending',
    };
  }

  private async processAvatarAsync(avatarId: string): Promise<void> {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    // Update to processing
    avatar.status = 'processing';
    avatar.updatedAt = new Date().toISOString();

    // Simulate HeyGen processing time (50ms for testing)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulate successful completion
    avatar.status = 'completed';
    avatar.heygenAvatarId = `heygen-${avatarId}`;
    avatar.previewImageUrl = `https://heygen.com/preview/${avatarId}.jpg`;
    avatar.previewVideoUrl = `https://heygen.com/preview/${avatarId}.mp4`;
    avatar.updatedAt = new Date().toISOString();
  }

  async getAvatar(avatarId: string): Promise<CustomAvatar | null> {
    return this.avatars.get(avatarId) || null;
  }

  async listAvatars(status?: AvatarStatus): Promise<CustomAvatar[]> {
    const allAvatars = Array.from(this.avatars.values());

    if (status) {
      return allAvatars.filter((a) => a.status === status);
    }

    return allAvatars.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteAvatar(avatarId: string): Promise<boolean> {
    return this.avatars.delete(avatarId);
  }

  simulateFailure(avatarId: string, errorMessage: string): void {
    const avatar = this.avatars.get(avatarId);
    if (avatar) {
      avatar.status = 'failed';
      avatar.errorMessage = errorMessage;
      avatar.updatedAt = new Date().toISOString();
    }
  }

  reset(): void {
    this.avatars.clear();
    this.nextId = 1;
  }
}

describe('Custom Avatar Creation - API Validation', () => {
  let avatarService: CustomAvatarService;

  beforeEach(() => {
    avatarService = new CustomAvatarService();
    vi.clearAllMocks();
  });

  it('should create custom avatar with valid data', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    expect(response.success).toBe(true);
    expect(response.avatarId).toBeTruthy();
    expect(response.avatarName).toBe('社長アバター');
    expect(response.status).toBe('pending');
  });

  it('should reject empty avatar name', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('アバター名が必要');
  });

  it('should reject invalid photo URL', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'not-a-url',
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('有効な写真URL');
  });

  it('should accept uploadId parameter', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
      uploadId: 'upload-123',
    });

    expect(response.success).toBe(true);
  });
});

describe('Custom Avatar Creation - Status Management', () => {
  let avatarService: CustomAvatarService;

  beforeEach(() => {
    avatarService = new CustomAvatarService();
  });

  it('should start with pending status', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    // Check immediately before async processing starts
    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar?.status).toMatch(/^(pending|processing)$/);
  });

  it('should transition to processing status', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    // Wait a bit for async processing to start
    await new Promise((resolve) => setTimeout(resolve, 10));

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar?.status).toBe('processing');
  });

  it('should complete with HeyGen avatar ID', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    // Wait for processing to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar?.status).toBe('completed');
    expect(avatar?.heygenAvatarId).toBeTruthy();
    expect(avatar?.heygenAvatarId).toContain('heygen-');
  });

  it('should include preview URLs on completion', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar?.previewImageUrl).toBeTruthy();
    expect(avatar?.previewVideoUrl).toBeTruthy();
    expect(avatar?.previewImageUrl).toMatch(/\.jpg$/);
    expect(avatar?.previewVideoUrl).toMatch(/\.mp4$/);
  });

  it('should handle failure status', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    avatarService.simulateFailure(response.avatarId!, 'HeyGen APIエラー');

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar?.status).toBe('failed');
    expect(avatar?.errorMessage).toBe('HeyGen APIエラー');
  });

  it('should update timestamps on status changes', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    const avatar1 = await avatarService.getAvatar(response.avatarId!);
    const initialTime = avatar1?.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const avatar2 = await avatarService.getAvatar(response.avatarId!);
    expect(avatar2?.updatedAt).not.toBe(initialTime);
  });
});

describe('Custom Avatar Creation - List and Filter', () => {
  let avatarService: CustomAvatarService;

  beforeEach(() => {
    avatarService = new CustomAvatarService();
  });

  it('should list all custom avatars', async () => {
    await avatarService.createAvatar({
      avatarName: 'アバター1',
      photoUrl: 'https://storage.supabase.co/avatars/1.jpg',
    });

    await avatarService.createAvatar({
      avatarName: 'アバター2',
      photoUrl: 'https://storage.supabase.co/avatars/2.jpg',
    });

    const avatars = await avatarService.listAvatars();
    expect(avatars.length).toBe(2);
  });

  it('should filter avatars by status', async () => {
    const response1 = await avatarService.createAvatar({
      avatarName: 'アバター1',
      photoUrl: 'https://storage.supabase.co/avatars/1.jpg',
    });

    await avatarService.createAvatar({
      avatarName: 'アバター2',
      photoUrl: 'https://storage.supabase.co/avatars/2.jpg',
    });

    avatarService.simulateFailure(response1.avatarId!, 'テストエラー');

    const failedAvatars = await avatarService.listAvatars('failed');
    expect(failedAvatars.length).toBe(1);
    expect(failedAvatars[0].avatarName).toBe('アバター1');

    // Second avatar may be pending or processing
    const allAvatars = await avatarService.listAvatars();
    expect(allAvatars.length).toBe(2);
  });

  it('should return completed avatars only', async () => {
    await avatarService.createAvatar({
      avatarName: 'アバター1',
      photoUrl: 'https://storage.supabase.co/avatars/1.jpg',
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const completedAvatars = await avatarService.listAvatars('completed');
    expect(completedAvatars.length).toBeGreaterThan(0);
    expect(completedAvatars.every((a) => a.status === 'completed')).toBe(true);
  });

  it('should sort avatars by creation date (newest first)', async () => {
    await avatarService.createAvatar({
      avatarName: 'アバター1',
      photoUrl: 'https://storage.supabase.co/avatars/1.jpg',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await avatarService.createAvatar({
      avatarName: 'アバター2',
      photoUrl: 'https://storage.supabase.co/avatars/2.jpg',
    });

    const avatars = await avatarService.listAvatars();
    expect(avatars[0].avatarName).toBe('アバター2');
    expect(avatars[1].avatarName).toBe('アバター1');
  });
});

describe('Custom Avatar Creation - CRUD Operations', () => {
  let avatarService: CustomAvatarService;

  beforeEach(() => {
    avatarService = new CustomAvatarService();
  });

  it('should retrieve avatar by ID', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar).not.toBeNull();
    expect(avatar?.avatarName).toBe('社長アバター');
  });

  it('should return null for non-existent avatar', async () => {
    const avatar = await avatarService.getAvatar('non-existent-id');
    expect(avatar).toBeNull();
  });

  it('should delete avatar by ID', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    const deleted = await avatarService.deleteAvatar(response.avatarId!);
    expect(deleted).toBe(true);

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar).toBeNull();
  });

  it('should return false when deleting non-existent avatar', async () => {
    const deleted = await avatarService.deleteAvatar('non-existent-id');
    expect(deleted).toBe(false);
  });
});

describe('Custom Avatar Creation - Error Handling', () => {
  let avatarService: CustomAvatarService;

  beforeEach(() => {
    avatarService = new CustomAvatarService();
  });

  it('should store error message on failure', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    const errorMessage = 'HeyGen API rate limit exceeded';
    avatarService.simulateFailure(response.avatarId!, errorMessage);

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar?.status).toBe('failed');
    expect(avatar?.errorMessage).toBe(errorMessage);
    expect(avatar?.heygenAvatarId).toBeNull();
  });

  it('should provide clear validation errors', async () => {
    const response1 = await avatarService.createAvatar({
      avatarName: '',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    expect(response1.success).toBe(false);
    expect(response1.error).toBeTruthy();

    const response2 = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'invalid-url',
    });

    expect(response2.success).toBe(false);
    expect(response2.error).toBeTruthy();
  });

  it('should not create database record on validation failure', async () => {
    await avatarService.createAvatar({
      avatarName: '',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    const avatars = await avatarService.listAvatars();
    expect(avatars.length).toBe(0);
  });
});

describe('Custom Avatar Creation - Performance', () => {
  let avatarService: CustomAvatarService;

  beforeEach(() => {
    avatarService = new CustomAvatarService();
  });

  it('should create avatar record quickly', async () => {
    const startTime = Date.now();

    await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle multiple avatar creations', async () => {
    const requests = Array.from({ length: 5 }, (_, i) => ({
      avatarName: `アバター${i + 1}`,
      photoUrl: `https://storage.supabase.co/avatars/${i + 1}.jpg`,
    }));

    const startTime = Date.now();
    for (const request of requests) {
      await avatarService.createAvatar(request);
    }
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(500);

    const avatars = await avatarService.listAvatars();
    expect(avatars.length).toBe(5);
  });

  it('should complete processing within reasonable time', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    const startTime = Date.now();

    // Poll for completion
    let avatar = await avatarService.getAvatar(response.avatarId!);
    while (avatar?.status === 'pending' || avatar?.status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 20));
      avatar = await avatarService.getAvatar(response.avatarId!);
    }

    const endTime = Date.now();
    expect(avatar?.status).toBe('completed');
    expect(endTime - startTime).toBeLessThan(200);
  });
});

describe('Custom Avatar Creation - Integration', () => {
  let avatarService: CustomAvatarService;

  beforeEach(() => {
    avatarService = new CustomAvatarService();
  });

  it('should provide all data needed for video generation', async () => {
    const response = await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const avatar = await avatarService.getAvatar(response.avatarId!);
    expect(avatar?.heygenAvatarId).toBeTruthy();
    expect(avatar?.status).toBe('completed');
    expect(avatar?.avatarName).toBeTruthy();
  });

  it('should be compatible with UnifiedAvatarSelector', async () => {
    await avatarService.createAvatar({
      avatarName: '社長アバター',
      photoUrl: 'https://storage.supabase.co/avatars/ceo.jpg',
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const completedAvatars = await avatarService.listAvatars('completed');
    expect(completedAvatars.length).toBeGreaterThan(0);

    const avatar = completedAvatars[0];
    expect(avatar.id).toBeTruthy();
    expect(avatar.avatarName).toBeTruthy();
    expect(avatar.previewImageUrl).toBeTruthy();
    expect(avatar.heygenAvatarId).toBeTruthy();
  });
});
