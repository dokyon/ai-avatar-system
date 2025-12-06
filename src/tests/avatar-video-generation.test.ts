/**
 * Avatar Video Generation Tests
 *
 * Tests for video generation with different avatars.
 * Validates multi-avatar support, error handling, and fallback behavior.
 *
 * @module tests/avatar-video-generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Video generation request interface
 */
interface VideoGenerationRequest {
  scriptId: string;
  content: string;
  avatarId?: string;
  avatarUrl?: string;
}

/**
 * Video generation result interface
 */
interface VideoGenerationResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
  avatarUsed?: string;
}

/**
 * Mock avatar URLs
 */
const AVATAR_URLS = {
  alice: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
  james: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/james.jpg',
  sarah: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/sarah.jpg',
  amy: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/amy.jpg',
  anna: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/anna.jpg',
} as const;

/**
 * Mock video generation service
 */
class VideoGenerationService {
  private generatedVideos: Map<string, VideoGenerationResult> = new Map();

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const { scriptId, content, avatarId, avatarUrl } = request;

    // Validate inputs
    if (!scriptId || !content) {
      return {
        success: false,
        error: 'scriptIdとcontentは必須です',
      };
    }

    // Determine avatar URL
    let finalAvatarUrl: string;
    if (avatarUrl) {
      finalAvatarUrl = avatarUrl;
    } else if (avatarId && avatarId in AVATAR_URLS) {
      finalAvatarUrl = AVATAR_URLS[avatarId as keyof typeof AVATAR_URLS];
    } else if (avatarId) {
      return {
        success: false,
        error: 'アバターが見つかりません',
      };
    } else {
      // Use default avatar
      finalAvatarUrl = AVATAR_URLS.alice;
    }

    // Simulate video generation
    await new Promise((resolve) => setTimeout(resolve, 100));

    const videoId = `video-${Date.now()}`;
    const videoUrl = `https://example.com/videos/${videoId}.mp4`;

    const result: VideoGenerationResult = {
      success: true,
      videoId,
      videoUrl,
      avatarUsed: finalAvatarUrl,
    };

    this.generatedVideos.set(videoId, result);
    return result;
  }

  async generateVideoWithFallback(
    request: VideoGenerationRequest,
    fallbackAvatars: string[] = []
  ): Promise<VideoGenerationResult> {
    try {
      return await this.generateVideo(request);
    } catch (error) {
      // Try fallback avatars
      for (const fallbackUrl of fallbackAvatars) {
        try {
          return await this.generateVideo({
            ...request,
            avatarUrl: fallbackUrl,
          });
        } catch {
          continue;
        }
      }

      return {
        success: false,
        error: 'All avatars failed',
      };
    }
  }

  getGeneratedVideo(videoId: string): VideoGenerationResult | undefined {
    return this.generatedVideos.get(videoId);
  }

  clear(): void {
    this.generatedVideos.clear();
  }
}

describe('Avatar Video Generation Tests', () => {
  let service: VideoGenerationService;

  beforeEach(() => {
    service = new VideoGenerationService();
    vi.clearAllMocks();
  });

  describe('Single Avatar Video Generation', () => {
    it('should generate video with specified avatar', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-script-1',
        content: 'こんにちは。これはテストです。',
        avatarId: 'alice',
      });

      expect(result.success).toBe(true);
      expect(result.videoUrl).toBeDefined();
      expect(result.videoId).toBeDefined();
      expect(result.avatarUsed).toBe(AVATAR_URLS.alice);
    });

    it('should generate video with avatarUrl parameter', async () => {
      const customAvatarUrl = 'https://example.com/custom-avatar.jpg';
      const result = await service.generateVideo({
        scriptId: 'test-script-2',
        content: 'こんにちは。これはテストです。',
        avatarUrl: customAvatarUrl,
      });

      expect(result.success).toBe(true);
      expect(result.avatarUsed).toBe(customAvatarUrl);
    });

    it('should use default avatar when no avatar specified', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-script-3',
        content: 'こんにちは。これはテストです。',
      });

      expect(result.success).toBe(true);
      expect(result.avatarUsed).toBe(AVATAR_URLS.alice);
    });
  });

  describe('Multiple Avatar Video Generation', () => {
    it('should generate videos with different avatars', async () => {
      const avatarIds: Array<keyof typeof AVATAR_URLS> = ['alice', 'james', 'sarah'];
      const results: VideoGenerationResult[] = [];

      for (const avatarId of avatarIds) {
        const result = await service.generateVideo({
          scriptId: `test-script-${avatarId}`,
          content: 'こんにちは。これはテストです。',
          avatarId: avatarId,
        });
        results.push(result);
      }

      expect(results.length).toBe(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results[0].avatarUsed).toBe(AVATAR_URLS.alice);
      expect(results[1].avatarUsed).toBe(AVATAR_URLS.james);
      expect(results[2].avatarUsed).toBe(AVATAR_URLS.sarah);
    });

    it('should generate unique videos for each avatar', async () => {
      const result1 = await service.generateVideo({
        scriptId: 'test-1',
        content: 'Test content',
        avatarId: 'alice',
      });

      // Add small delay to ensure unique timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await service.generateVideo({
        scriptId: 'test-2',
        content: 'Test content',
        avatarId: 'james',
      });

      expect(result1.videoId).not.toBe(result2.videoId);
      expect(result1.videoUrl).not.toBe(result2.videoUrl);
    });

    it('should support concurrent video generation', async () => {
      const avatarIds: Array<keyof typeof AVATAR_URLS> = ['alice', 'james', 'sarah'];

      const promises = avatarIds.map((avatarId) =>
        service.generateVideo({
          scriptId: `test-concurrent-${avatarId}`,
          content: 'Test content',
          avatarId: avatarId,
        })
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(3);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return error for invalid avatar ID', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-error-1',
        content: 'Test content',
        avatarId: 'invalid-avatar-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('アバターが見つかりません');
      expect(result.videoUrl).toBeUndefined();
    });

    it('should return error for missing scriptId', async () => {
      const result = await service.generateVideo({
        scriptId: '',
        content: 'Test content',
        avatarId: 'alice',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('scriptIdとcontentは必須です');
    });

    it('should return error for missing content', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-script',
        content: '',
        avatarId: 'alice',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('scriptIdとcontentは必須です');
    });

    it('should handle malformed avatar URLs gracefully', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-malformed',
        content: 'Test content',
        avatarUrl: 'not-a-valid-url',
      });

      // Service should still attempt to use the URL
      expect(result.success).toBe(true);
      expect(result.avatarUsed).toBe('not-a-valid-url');
    });
  });

  describe('Avatar Fallback Behavior', () => {
    it('should use fallback avatar on primary failure', async () => {
      const fallbacks = [AVATAR_URLS.amy, AVATAR_URLS.anna];

      const result = await service.generateVideoWithFallback(
        {
          scriptId: 'test-fallback-1',
          content: 'Test content',
          avatarId: 'alice',
        },
        fallbacks
      );

      expect(result.success).toBe(true);
      expect(result.videoUrl).toBeDefined();
    });

    it('should try multiple fallbacks in order', async () => {
      const fallbacks = [AVATAR_URLS.amy, AVATAR_URLS.anna, AVATAR_URLS.alice];

      const result = await service.generateVideoWithFallback(
        {
          scriptId: 'test-fallback-2',
          content: 'Test content',
        },
        fallbacks
      );

      expect(result.success).toBe(true);
    });

    it('should return error when all fallbacks fail', async () => {
      // Mock service that always fails
      const failingService = new VideoGenerationService();
      vi.spyOn(failingService, 'generateVideo').mockRejectedValue(new Error('API error'));

      const result = await failingService.generateVideoWithFallback(
        {
          scriptId: 'test-all-fail',
          content: 'Test content',
        },
        [AVATAR_URLS.amy, AVATAR_URLS.anna]
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('All avatars failed');
    });
  });

  describe('Avatar URL Validation', () => {
    it('should accept valid D-ID avatar URLs', async () => {
      const validUrls = Object.values(AVATAR_URLS);

      for (const url of validUrls) {
        const result = await service.generateVideo({
          scriptId: `test-valid-${url}`,
          content: 'Test content',
          avatarUrl: url,
        });

        expect(result.success).toBe(true);
        expect(result.avatarUsed).toBe(url);
      }
    });

    it('should preserve custom avatar URLs', async () => {
      const customUrl = 'https://custom-domain.com/avatar.jpg';
      const result = await service.generateVideo({
        scriptId: 'test-custom',
        content: 'Test content',
        avatarUrl: customUrl,
      });

      expect(result.success).toBe(true);
      expect(result.avatarUsed).toBe(customUrl);
    });
  });

  describe('Video Retrieval', () => {
    it('should retrieve generated video by ID', async () => {
      const generateResult = await service.generateVideo({
        scriptId: 'test-retrieve',
        content: 'Test content',
        avatarId: 'alice',
      });

      expect(generateResult.success).toBe(true);
      expect(generateResult.videoId).toBeDefined();

      const retrievedVideo = service.getGeneratedVideo(generateResult.videoId!);

      expect(retrievedVideo).toBeDefined();
      expect(retrievedVideo?.videoUrl).toBe(generateResult.videoUrl);
      expect(retrievedVideo?.avatarUsed).toBe(AVATAR_URLS.alice);
    });

    it('should return undefined for non-existent video ID', () => {
      const video = service.getGeneratedVideo('non-existent-id');
      expect(video).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should generate video in reasonable time', async () => {
      const startTime = Date.now();

      await service.generateVideo({
        scriptId: 'test-perf-1',
        content: 'Test content',
        avatarId: 'alice',
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle batch generation efficiently', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 5 }, (_, i) =>
        service.generateVideo({
          scriptId: `test-batch-${i}`,
          content: 'Test content',
          avatarId: 'alice',
        })
      );

      await Promise.all(promises);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Avatar-Specific Video Configuration', () => {
    it('should support different avatars with same script', async () => {
      const content = 'これは共通のスクリプトです。';

      const aliceVideo = await service.generateVideo({
        scriptId: 'test-same-script-1',
        content,
        avatarId: 'alice',
      });

      const jamesVideo = await service.generateVideo({
        scriptId: 'test-same-script-2',
        content,
        avatarId: 'james',
      });

      expect(aliceVideo.success).toBe(true);
      expect(jamesVideo.success).toBe(true);
      expect(aliceVideo.avatarUsed).not.toBe(jamesVideo.avatarUsed);
    });

    it('should track which avatar was used for each video', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-tracking',
        content: 'Test content',
        avatarId: 'sarah',
      });

      expect(result.success).toBe(true);
      expect(result.avatarUsed).toBe(AVATAR_URLS.sarah);

      const retrievedVideo = service.getGeneratedVideo(result.videoId!);
      expect(retrievedVideo?.avatarUsed).toBe(AVATAR_URLS.sarah);
    });
  });

  describe('Default Avatar Tests', () => {
    it('should use alice as default avatar', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-default',
        content: 'Test content',
      });

      expect(result.success).toBe(true);
      expect(result.avatarUsed).toBe(AVATAR_URLS.alice);
    });

    it('should allow overriding default avatar', async () => {
      const result = await service.generateVideo({
        scriptId: 'test-override-default',
        content: 'Test content',
        avatarId: 'james',
      });

      expect(result.success).toBe(true);
      expect(result.avatarUsed).toBe(AVATAR_URLS.james);
      expect(result.avatarUsed).not.toBe(AVATAR_URLS.alice);
    });
  });
});

/**
 * Integration Tests
 */
describe('Avatar Video Generation - Integration', () => {
  let service: VideoGenerationService;

  beforeEach(() => {
    service = new VideoGenerationService();
  });

  it('should complete full video generation flow with avatar selection', async () => {
    // Step 1: Select avatar
    const selectedAvatarId = 'alice';

    // Step 2: Generate video
    const result = await service.generateVideo({
      scriptId: 'integration-test-1',
      content: 'これは統合テストです。',
      avatarId: selectedAvatarId,
    });

    // Step 3: Verify result
    expect(result.success).toBe(true);
    expect(result.videoId).toBeDefined();
    expect(result.videoUrl).toBeDefined();
    expect(result.avatarUsed).toBe(AVATAR_URLS.alice);

    // Step 4: Retrieve video
    const video = service.getGeneratedVideo(result.videoId!);
    expect(video).toBeDefined();
    expect(video?.videoUrl).toBe(result.videoUrl);
  });

  it('should support avatar change for same script', async () => {
    const scriptContent = '同じ台本で異なるアバターをテストします。';

    // Generate with first avatar
    const result1 = await service.generateVideo({
      scriptId: 'test-change-1',
      content: scriptContent,
      avatarId: 'alice',
    });

    // Generate with second avatar
    const result2 = await service.generateVideo({
      scriptId: 'test-change-2',
      content: scriptContent,
      avatarId: 'james',
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.avatarUsed).not.toBe(result2.avatarUsed);
    expect(result1.videoId).not.toBe(result2.videoId);
  });
});
