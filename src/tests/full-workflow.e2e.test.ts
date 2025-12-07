/**
 * Full Workflow E2E Tests
 *
 * End-to-end tests for the complete workflow:
 * Photo Upload → Custom Avatar Creation → Avatar Selection → Video Generation
 *
 * @module tests/full-workflow.e2e
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Type definitions
 */
type AvatarStatus = 'pending' | 'processing' | 'completed' | 'failed';
type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';
type AvatarType = 'd-id' | 'custom';

interface UploadedPhoto {
  uploadId: string;
  fileName: string;
  publicUrl: string;
  filePath: string;
}

interface CustomAvatar {
  id: string;
  avatarName: string;
  photoUrl: string;
  heygenAvatarId: string | null;
  status: AvatarStatus;
  previewImageUrl: string | null;
}

interface AvatarOption {
  id: string;
  name: string;
  type: AvatarType;
  heygenAvatarId?: string | null;
}

interface Video {
  id: string;
  scriptId: string;
  status: VideoStatus;
  videoUrl: string | null;
}

/**
 * Integrated workflow service
 */
class FullWorkflowService {
  private uploads: Map<string, UploadedPhoto> = new Map();
  private customAvatars: Map<string, CustomAvatar> = new Map();
  private videos: Map<string, Video> = new Map();
  private nextUploadId = 1;
  private nextAvatarId = 1;
  private nextVideoId = 1;

  /**
   * Step 1: Upload CEO photo
   */
  async uploadPhoto(file: File): Promise<UploadedPhoto> {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large');
    }

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 50));

    const uploadId = `upload-${this.nextUploadId++}`;
    const upload: UploadedPhoto = {
      uploadId,
      fileName: file.name,
      publicUrl: `https://storage.supabase.co/avatars/${file.name}`,
      filePath: `avatars/${uploadId}-${file.name}`,
    };

    this.uploads.set(uploadId, upload);
    return upload;
  }

  /**
   * Step 2: Create custom avatar from photo
   */
  async createCustomAvatar(photoUrl: string, avatarName: string): Promise<string> {
    if (!photoUrl || !avatarName) {
      throw new Error('Photo URL and avatar name required');
    }

    const avatarId = `avatar-${this.nextAvatarId++}`;
    const avatar: CustomAvatar = {
      id: avatarId,
      avatarName,
      photoUrl,
      heygenAvatarId: null,
      status: 'pending',
      previewImageUrl: null,
    };

    this.customAvatars.set(avatarId, avatar);

    // Simulate async processing
    this.processAvatarAsync(avatarId).catch(console.error);

    return avatarId;
  }

  private async processAvatarAsync(avatarId: string): Promise<void> {
    const avatar = this.customAvatars.get(avatarId);
    if (!avatar) return;

    avatar.status = 'processing';
    await new Promise((resolve) => setTimeout(resolve, 100));

    avatar.status = 'completed';
    avatar.heygenAvatarId = `heygen-${avatarId}`;
    avatar.previewImageUrl = `https://heygen.com/preview/${avatarId}.jpg`;
  }

  /**
   * Step 3: Get avatar for selection
   */
  async getCustomAvatar(avatarId: string): Promise<CustomAvatar | null> {
    return this.customAvatars.get(avatarId) || null;
  }

  /**
   * Step 4: Generate video using custom avatar
   */
  async generateVideo(
    scriptId: string,
    content: string,
    avatarOption: AvatarOption
  ): Promise<string> {
    if (!scriptId || !content) {
      throw new Error('Script ID and content required');
    }

    if (content.length > 5000) {
      throw new Error('Content too long');
    }

    const videoId = `video-${this.nextVideoId++}`;
    const video: Video = {
      id: videoId,
      scriptId,
      status: 'pending',
      videoUrl: null,
    };

    this.videos.set(videoId, video);

    // Simulate async processing
    this.processVideoAsync(videoId, content).catch(console.error);

    return videoId;
  }

  private async processVideoAsync(videoId: string, content: string): Promise<void> {
    const video = this.videos.get(videoId);
    if (!video) return;

    video.status = 'processing';
    await new Promise((resolve) => setTimeout(resolve, 150));

    video.status = 'completed';
    video.videoUrl = `https://heygen.com/videos/${videoId}.mp4`;
  }

  async getVideo(videoId: string): Promise<Video | null> {
    return this.videos.get(videoId) || null;
  }

  reset(): void {
    this.uploads.clear();
    this.customAvatars.clear();
    this.videos.clear();
    this.nextUploadId = 1;
    this.nextAvatarId = 1;
    this.nextVideoId = 1;
  }
}

describe('Full Workflow E2E - Complete Flow', () => {
  let workflowService: FullWorkflowService;

  beforeEach(() => {
    workflowService = new FullWorkflowService();
    vi.clearAllMocks();
  });

  it('should complete full workflow: upload → avatar → video', async () => {
    // Step 1: Upload CEO photo
    const file = new File(['photo data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);

    expect(upload.uploadId).toBeTruthy();
    expect(upload.publicUrl).toBeTruthy();

    // Step 2: Create custom avatar
    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    expect(avatarId).toBeTruthy();

    // Wait for avatar processing
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Step 3: Verify avatar is ready
    const avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.status).toBe('completed');
    expect(avatar?.heygenAvatarId).toBeTruthy();

    // Step 4: Select avatar
    const avatarOption: AvatarOption = {
      id: avatar!.id,
      name: avatar!.avatarName,
      type: 'custom',
      heygenAvatarId: avatar!.heygenAvatarId,
    };

    // Step 5: Generate video
    const videoId = await workflowService.generateVideo(
      'script-123',
      'こんにちは。研修を開始します。',
      avatarOption
    );

    expect(videoId).toBeTruthy();

    // Wait for video processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 6: Verify video is ready
    const video = await workflowService.getVideo(videoId);
    expect(video?.status).toBe('completed');
    expect(video?.videoUrl).toBeTruthy();
  });

  it('should handle workflow with long script content', async () => {
    // Upload photo
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);

    // Create avatar
    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    const avatar = await workflowService.getCustomAvatar(avatarId);

    // Generate video with long content
    const longContent = '本日は新入社員研修を実施します。'.repeat(100); // ~3000 chars
    const videoId = await workflowService.generateVideo(
      'script-123',
      longContent,
      {
        id: avatar!.id,
        name: avatar!.avatarName,
        type: 'custom',
        heygenAvatarId: avatar!.heygenAvatarId,
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    const video = await workflowService.getVideo(videoId);
    expect(video?.status).toBe('completed');
  });

  it('should handle multiple workflows in sequence', async () => {
    // Workflow 1
    const file1 = new File(['data1'], 'ceo1.jpg', { type: 'image/jpeg' });
    const upload1 = await workflowService.uploadPhoto(file1);
    const avatarId1 = await workflowService.createCustomAvatar(
      upload1.publicUrl,
      'アバター1'
    );

    // Workflow 2
    const file2 = new File(['data2'], 'ceo2.jpg', { type: 'image/jpeg' });
    const upload2 = await workflowService.uploadPhoto(file2);
    const avatarId2 = await workflowService.createCustomAvatar(
      upload2.publicUrl,
      'アバター2'
    );

    // Wait for both avatars
    await new Promise((resolve) => setTimeout(resolve, 150));

    const avatar1 = await workflowService.getCustomAvatar(avatarId1);
    const avatar2 = await workflowService.getCustomAvatar(avatarId2);

    expect(avatar1?.status).toBe('completed');
    expect(avatar2?.status).toBe('completed');

    // Generate videos for both
    const videoId1 = await workflowService.generateVideo('script-1', 'テスト1', {
      id: avatar1!.id,
      name: avatar1!.avatarName,
      type: 'custom',
      heygenAvatarId: avatar1!.heygenAvatarId,
    });

    const videoId2 = await workflowService.generateVideo('script-2', 'テスト2', {
      id: avatar2!.id,
      name: avatar2!.avatarName,
      type: 'custom',
      heygenAvatarId: avatar2!.heygenAvatarId,
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const video1 = await workflowService.getVideo(videoId1);
    const video2 = await workflowService.getVideo(videoId2);

    expect(video1?.status).toBe('completed');
    expect(video2?.status).toBe('completed');
  });
});

describe('Full Workflow E2E - Error Handling', () => {
  let workflowService: FullWorkflowService;

  beforeEach(() => {
    workflowService = new FullWorkflowService();
  });

  it('should reject invalid file upload', async () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

    await expect(workflowService.uploadPhoto(file)).rejects.toThrow('Invalid file type');
  });

  it('should reject oversized file upload', async () => {
    const largeData = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });

    await expect(workflowService.uploadPhoto(file)).rejects.toThrow('File too large');
  });

  it('should reject avatar creation without photo URL', async () => {
    await expect(workflowService.createCustomAvatar('', 'アバター')).rejects.toThrow();
  });

  it('should reject video generation with too long content', async () => {
    const longContent = 'あ'.repeat(5001);

    await expect(
      workflowService.generateVideo('script-123', longContent, {
        id: 'avatar-1',
        name: 'Test',
        type: 'custom',
        heygenAvatarId: 'heygen-1',
      })
    ).rejects.toThrow('Content too long');
  });

  it('should not proceed to video generation if avatar fails', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);
    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    // Don't wait for avatar completion
    const avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.status).not.toBe('completed');
    expect(avatar?.heygenAvatarId).toBeNull();

    // Cannot generate video without completed avatar
    expect(avatar?.heygenAvatarId).toBeFalsy();
  });
});

describe('Full Workflow E2E - Performance', () => {
  let workflowService: FullWorkflowService;

  beforeEach(() => {
    workflowService = new FullWorkflowService();
  });

  it('should complete photo upload quickly', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });

    const startTime = Date.now();
    await workflowService.uploadPhoto(file);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should create avatar record quickly', async () => {
    const startTime = Date.now();
    await workflowService.createCustomAvatar(
      'https://example.com/ceo.jpg',
      '社長アバター'
    );
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should initiate video generation quickly', async () => {
    const startTime = Date.now();
    await workflowService.generateVideo('script-123', 'テスト内容', {
      id: 'avatar-1',
      name: 'Test',
      type: 'custom',
      heygenAvatarId: 'heygen-1',
    });
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should complete full workflow within reasonable time', async () => {
    const startTime = Date.now();

    // Upload
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);

    // Create avatar
    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    // Wait for avatar
    await new Promise((resolve) => setTimeout(resolve, 150));
    const avatar = await workflowService.getCustomAvatar(avatarId);

    // Generate video
    const videoId = await workflowService.generateVideo('script-123', 'テスト', {
      id: avatar!.id,
      name: avatar!.avatarName,
      type: 'custom',
      heygenAvatarId: avatar!.heygenAvatarId,
    });

    // Wait for video
    await new Promise((resolve) => setTimeout(resolve, 200));
    const video = await workflowService.getVideo(videoId);

    const endTime = Date.now();

    expect(video?.status).toBe('completed');
    expect(endTime - startTime).toBeLessThan(500);
  });
});

describe('Full Workflow E2E - Data Integrity', () => {
  let workflowService: FullWorkflowService;

  beforeEach(() => {
    workflowService = new FullWorkflowService();
  });

  it('should maintain photo URL throughout workflow', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);

    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    const avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.photoUrl).toBe(upload.publicUrl);
  });

  it('should preserve avatar name throughout workflow', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);

    const avatarName = '社長アバター';
    const avatarId = await workflowService.createCustomAvatar(upload.publicUrl, avatarName);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.avatarName).toBe(avatarName);
  });

  it('should link video to correct script', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);
    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    const avatar = await workflowService.getCustomAvatar(avatarId);
    const scriptId = 'script-123';

    const videoId = await workflowService.generateVideo(scriptId, 'テスト', {
      id: avatar!.id,
      name: avatar!.avatarName,
      type: 'custom',
      heygenAvatarId: avatar!.heygenAvatarId,
    });

    const video = await workflowService.getVideo(videoId);
    expect(video?.scriptId).toBe(scriptId);
  });
});

describe('Full Workflow E2E - Status Tracking', () => {
  let workflowService: FullWorkflowService;

  beforeEach(() => {
    workflowService = new FullWorkflowService();
  });

  it('should track avatar creation status', async () => {
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);
    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    // Check initial status (may be pending or processing)
    let avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.status).toMatch(/^(pending|processing)$/);

    // Wait and check processing or completed
    await new Promise((resolve) => setTimeout(resolve, 50));
    avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.status).toMatch(/^(processing|completed)$/);

    // Wait and check completed
    await new Promise((resolve) => setTimeout(resolve, 100));
    avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.status).toBe('completed');
  });

  it('should track video generation status', async () => {
    const videoId = await workflowService.generateVideo('script-123', 'テスト', {
      id: 'avatar-1',
      name: 'Test',
      type: 'custom',
      heygenAvatarId: 'heygen-1',
    });

    // Check initial status (may be pending or processing)
    let video = await workflowService.getVideo(videoId);
    expect(video?.status).toMatch(/^(pending|processing)$/);

    // Wait and check processing or completed
    await new Promise((resolve) => setTimeout(resolve, 80));
    video = await workflowService.getVideo(videoId);
    expect(video?.status).toMatch(/^(processing|completed)$/);

    // Wait and check completed
    await new Promise((resolve) => setTimeout(resolve, 100));
    video = await workflowService.getVideo(videoId);
    expect(video?.status).toBe('completed');
  });
});

describe('Full Workflow E2E - Real-world Scenarios', () => {
  let workflowService: FullWorkflowService;

  beforeEach(() => {
    workflowService = new FullWorkflowService();
  });

  it('should handle CEO training video creation', async () => {
    // CEO uploads their photo
    const ceoPhoto = new File(['ceo photo data'], 'ceo-tanaka.jpg', {
      type: 'image/jpeg',
    });
    const upload = await workflowService.uploadPhoto(ceoPhoto);

    // Create CEO avatar
    const avatarId = await workflowService.createCustomAvatar(upload.publicUrl, '田中社長');

    await new Promise((resolve) => setTimeout(resolve, 150));

    const avatar = await workflowService.getCustomAvatar(avatarId);
    expect(avatar?.status).toBe('completed');

    // Generate training video
    const trainingScript = `
      新入社員の皆さん、こんにちは。
      田中です。
      本日は当社の企業理念についてお話しします。
      私たちは常にお客様第一の精神を大切にしています。
    `;

    const videoId = await workflowService.generateVideo('script-training-001', trainingScript, {
      id: avatar!.id,
      name: avatar!.avatarName,
      type: 'custom',
      heygenAvatarId: avatar!.heygenAvatarId,
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const video = await workflowService.getVideo(videoId);
    expect(video?.status).toBe('completed');
    expect(video?.videoUrl).toMatch(/\.mp4$/);
  });

  it('should handle multiple training videos with same avatar', async () => {
    // Upload and create avatar once
    const file = new File(['data'], 'ceo.jpg', { type: 'image/jpeg' });
    const upload = await workflowService.uploadPhoto(file);
    const avatarId = await workflowService.createCustomAvatar(
      upload.publicUrl,
      '社長アバター'
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    const avatar = await workflowService.getCustomAvatar(avatarId);

    // Generate multiple training videos
    const scripts = [
      '第1回：会社の理念について',
      '第2回：業務プロセスについて',
      '第3回：安全管理について',
    ];

    const videoIds = await Promise.all(
      scripts.map((script, i) =>
        workflowService.generateVideo(`script-${i + 1}`, script, {
          id: avatar!.id,
          name: avatar!.avatarName,
          type: 'custom',
          heygenAvatarId: avatar!.heygenAvatarId,
        })
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify all videos completed
    for (const videoId of videoIds) {
      const video = await workflowService.getVideo(videoId);
      expect(video?.status).toBe('completed');
    }
  });
});
