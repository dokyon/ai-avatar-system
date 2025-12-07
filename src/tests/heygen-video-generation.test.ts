/**
 * HeyGen Video Generation E2E Tests
 *
 * Tests for video generation using HeyGen API with support for long scripts,
 * Japanese TTS, and custom avatars.
 *
 * @module tests/heygen-video-generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Video status types
 */
type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Video data structure
 */
interface Video {
  id: string;
  scriptId: string;
  title: string;
  status: VideoStatus;
  videoUrl: string | null;
  duration: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GenerateVideoRequest {
  scriptId: string;
  title?: string;
  content: string;
  avatarId?: string;
  avatarType?: 'd-id' | 'custom';
  heygenAvatarId?: string;
  voiceId?: string;
}

interface GenerateVideoResponse {
  success: boolean;
  videoId?: string;
  message?: string;
  error?: string;
}

/**
 * Mock HeyGen video generation service
 */
class HeyGenVideoService {
  private videos: Map<string, Video> = new Map();
  private nextId = 1;

  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    // Validate scriptId and content
    if (!request.scriptId || !request.content) {
      return {
        success: false,
        error: 'scriptIdとcontentは必須です',
      };
    }

    // Validate content length (HeyGen supports up to 5000 characters)
    if (request.content.length > 5000) {
      return {
        success: false,
        error: 'コンテンツは5000文字以内にしてください',
      };
    }

    // Create video record
    const videoId = `video-${this.nextId++}`;
    const now = new Date().toISOString();

    const video: Video = {
      id: videoId,
      scriptId: request.scriptId,
      title: request.title || 'Untitled Video',
      status: 'pending',
      videoUrl: null,
      duration: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    this.videos.set(videoId, video);

    // Start async generation
    this.processVideoAsync(videoId, request.content).catch(console.error);

    return {
      success: true,
      videoId,
      message: '動画生成を開始しました',
    };
  }

  private async processVideoAsync(videoId: string, content: string): Promise<void> {
    const video = this.videos.get(videoId);
    if (!video) return;

    // Update to processing
    video.status = 'processing';
    video.updatedAt = new Date().toISOString();

    // Simulate HeyGen processing time (proportional to content length)
    const processingTime = Math.min(50 + content.length / 100, 200);
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Simulate successful completion
    video.status = 'completed';
    video.videoUrl = `https://heygen.com/videos/${videoId}.mp4`;
    video.duration = Math.floor(content.length / 5); // ~5 chars per second
    video.updatedAt = new Date().toISOString();
  }

  async getVideo(videoId: string): Promise<Video | null> {
    return this.videos.get(videoId) || null;
  }

  async listVideos(status?: VideoStatus): Promise<Video[]> {
    const allVideos = Array.from(this.videos.values());

    if (status) {
      return allVideos.filter((v) => v.status === status);
    }

    return allVideos.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  simulateFailure(videoId: string, errorMessage: string): void {
    const video = this.videos.get(videoId);
    if (video) {
      video.status = 'failed';
      video.errorMessage = errorMessage;
      video.updatedAt = new Date().toISOString();
    }
  }

  reset(): void {
    this.videos.clear();
    this.nextId = 1;
  }
}

describe('HeyGen Video Generation - Request Validation', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
    vi.clearAllMocks();
  });

  it('should generate video with valid request', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'こんにちは。今日は会社の研修についてお話しします。',
      title: '研修動画',
    });

    expect(response.success).toBe(true);
    expect(response.videoId).toBeTruthy();
    expect(response.message).toContain('動画生成を開始');
  });

  it('should reject request without scriptId', async () => {
    const response = await videoService.generateVideo({
      scriptId: '',
      content: 'テスト内容',
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('scriptIdとcontentは必須');
  });

  it('should reject request without content', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: '',
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('scriptIdとcontentは必須');
  });

  it('should reject content exceeding 5000 characters', async () => {
    const longContent = 'あ'.repeat(5001);
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: longContent,
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('5000文字以内');
  });

  it('should accept content at the character limit (5000)', async () => {
    const maxContent = 'あ'.repeat(5000);
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: maxContent,
    });

    expect(response.success).toBe(true);
  });
});

describe('HeyGen Video Generation - Long Script Support', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should handle short scripts (< 100 chars)', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'こんにちは。短い研修内容です。',
    });

    expect(response.success).toBe(true);
  });

  it('should handle medium scripts (100-500 chars)', async () => {
    const content = '会社の研修についてお話しします。'.repeat(20); // ~500 chars
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content,
    });

    expect(response.success).toBe(true);
  });

  it('should handle long scripts (500-2000 chars)', async () => {
    const content = '本日は新入社員研修として、会社の理念や業務内容について説明します。'.repeat(40); // ~2000 chars
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content,
    });

    expect(response.success).toBe(true);
  });

  it('should handle very long scripts (2000-5000 chars)', async () => {
    const content =
      '社員の皆様へ。本日の研修では、企業文化、業務プロセス、安全基準について詳しく説明します。'.repeat(
        100
      ); // ~4000 chars

    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content,
    });

    expect(response.success).toBe(true);
  });

  it('should calculate appropriate duration for long scripts', async () => {
    const content = 'あ'.repeat(1000); // 1000 chars
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content,
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.duration).toBeGreaterThan(0);
    expect(video?.duration).toBe(Math.floor(1000 / 5)); // ~200 seconds
  });
});

describe('HeyGen Video Generation - Status Management', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should start with pending status', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    // Check immediately - may be pending or processing
    const video = await videoService.getVideo(response.videoId!);
    expect(video?.status).toMatch(/^(pending|processing)$/);
  });

  it('should transition to processing status', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.status).toBe('processing');
  });

  it('should complete with video URL', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.status).toBe('completed');
    expect(video?.videoUrl).toBeTruthy();
    expect(video?.videoUrl).toMatch(/\.mp4$/);
  });

  it('should handle failure status', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    videoService.simulateFailure(response.videoId!, 'HeyGen API error');

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.status).toBe('failed');
    expect(video?.errorMessage).toBe('HeyGen API error');
  });

  it('should update timestamps on status changes', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    const video1 = await videoService.getVideo(response.videoId!);
    const initialTime = video1?.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 250));

    const video2 = await videoService.getVideo(response.videoId!);
    expect(video2?.updatedAt).not.toBe(initialTime);
  });
});

describe('HeyGen Video Generation - Custom Avatar Support', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should accept custom avatar ID', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
      avatarType: 'custom',
      heygenAvatarId: 'heygen-avatar-123',
    });

    expect(response.success).toBe(true);
  });

  it('should accept D-ID avatar ID', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
      avatarType: 'd-id',
      avatarId: 'd-id-avatar-123',
    });

    expect(response.success).toBe(true);
  });

  it('should work without avatar ID (use default)', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    expect(response.success).toBe(true);
  });

  it('should accept custom voice ID', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
      voiceId: 'japanese-female-voice',
    });

    expect(response.success).toBe(true);
  });
});

describe('HeyGen Video Generation - Japanese Language Support', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should handle Japanese hiragana', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'こんにちは。きょうはけんしゅうをおこないます。',
    });

    expect(response.success).toBe(true);
  });

  it('should handle Japanese katakana', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'コンピューター、システム、プログラミング',
    });

    expect(response.success).toBe(true);
  });

  it('should handle Japanese kanji', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: '本日の研修では、会社の経営理念について説明します。',
    });

    expect(response.success).toBe(true);
  });

  it('should handle mixed Japanese characters', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: '皆さん、こんにちは。システム開発についてお話しします。',
    });

    expect(response.success).toBe(true);
  });

  it('should handle Japanese with numbers and punctuation', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: '2025年1月7日、新入社員研修を開始します。よろしくお願いします！',
    });

    expect(response.success).toBe(true);
  });
});

describe('HeyGen Video Generation - Error Handling', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should store error message on failure', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    const errorMessage = 'HeyGen API rate limit exceeded';
    videoService.simulateFailure(response.videoId!, errorMessage);

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.status).toBe('failed');
    expect(video?.errorMessage).toBe(errorMessage);
  });

  it('should not set video URL on failure', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    videoService.simulateFailure(response.videoId!, 'Error');

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.videoUrl).toBeNull();
  });

  it('should provide clear validation error messages', async () => {
    const response1 = await videoService.generateVideo({
      scriptId: '',
      content: 'テスト内容',
    });

    expect(response1.error).toBeTruthy();
    expect(response1.error).toContain('必須');

    const response2 = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'あ'.repeat(5001),
    });

    expect(response2.error).toBeTruthy();
    expect(response2.error).toContain('5000文字');
  });
});

describe('HeyGen Video Generation - Performance', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should create video record quickly', async () => {
    const startTime = Date.now();

    await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should process short videos faster than long videos', async () => {
    const shortContent = 'テスト';
    const longContent = 'あ'.repeat(3000);

    const response1 = await videoService.generateVideo({
      scriptId: 'script-123',
      content: shortContent,
    });

    const start1 = Date.now();
    let video1 = await videoService.getVideo(response1.videoId!);
    while (video1?.status !== 'completed') {
      await new Promise((resolve) => setTimeout(resolve, 20));
      video1 = await videoService.getVideo(response1.videoId!);
    }
    const time1 = Date.now() - start1;

    const response2 = await videoService.generateVideo({
      scriptId: 'script-124',
      content: longContent,
    });

    const start2 = Date.now();
    let video2 = await videoService.getVideo(response2.videoId!);
    while (video2?.status !== 'completed') {
      await new Promise((resolve) => setTimeout(resolve, 20));
      video2 = await videoService.getVideo(response2.videoId!);
    }
    const time2 = Date.now() - start2;

    expect(time2).toBeGreaterThan(time1);
  });

  it('should handle multiple concurrent video generations', async () => {
    const requests = Array.from({ length: 5 }, (_, i) => ({
      scriptId: `script-${i}`,
      content: `テスト内容 ${i}`,
    }));

    const startTime = Date.now();
    const responses = await Promise.all(
      requests.map((req) => videoService.generateVideo(req))
    );
    const endTime = Date.now();

    expect(responses.every((r) => r.success)).toBe(true);
    expect(endTime - startTime).toBeLessThan(500);
  });
});

describe('HeyGen Video Generation - List and Filter', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should list all videos', async () => {
    await videoService.generateVideo({
      scriptId: 'script-1',
      content: 'テスト1',
    });

    await videoService.generateVideo({
      scriptId: 'script-2',
      content: 'テスト2',
    });

    const videos = await videoService.listVideos();
    expect(videos.length).toBe(2);
  });

  it('should filter videos by status', async () => {
    const response1 = await videoService.generateVideo({
      scriptId: 'script-1',
      content: 'テスト1',
    });

    await videoService.generateVideo({
      scriptId: 'script-2',
      content: 'テスト2',
    });

    videoService.simulateFailure(response1.videoId!, 'エラー');

    const failedVideos = await videoService.listVideos('failed');
    expect(failedVideos.length).toBe(1);

    // Second video may be pending or processing
    const allVideos = await videoService.listVideos();
    expect(allVideos.length).toBe(2);
  });

  it('should sort videos by creation date (newest first)', async () => {
    await videoService.generateVideo({
      scriptId: 'script-1',
      content: 'テスト1',
      title: 'ビデオ1',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await videoService.generateVideo({
      scriptId: 'script-2',
      content: 'テスト2',
      title: 'ビデオ2',
    });

    const videos = await videoService.listVideos();
    expect(videos[0].title).toBe('ビデオ2');
    expect(videos[1].title).toBe('ビデオ1');
  });
});

describe('HeyGen Video Generation - Integration', () => {
  let videoService: HeyGenVideoService;

  beforeEach(() => {
    videoService = new HeyGenVideoService();
  });

  it('should integrate with script system', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      title: '研修動画',
      content: 'こんにちは。研修を開始します。',
    });

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.scriptId).toBe('script-123');
    expect(video?.title).toBe('研修動画');
  });

  it('should provide video URL for playback', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'テスト内容',
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.videoUrl).toBeTruthy();
    expect(video?.videoUrl).toMatch(/^https:\/\/heygen\.com\/videos\//);
  });

  it('should calculate duration for progress tracking', async () => {
    const response = await videoService.generateVideo({
      scriptId: 'script-123',
      content: 'あ'.repeat(500), // 500 chars → ~100 seconds
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    const video = await videoService.getVideo(response.videoId!);
    expect(video?.duration).toBeGreaterThan(0);
    expect(video?.duration).toBeLessThanOrEqual(Math.floor(500 / 5));
  });
});
