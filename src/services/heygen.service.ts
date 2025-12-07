/**
 * HeyGen API Service
 * @see https://docs.heygen.com/reference/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  HeyGenAvatar,
  HeyGenAvatarListResponse,
  HeyGenVoice,
  HeyGenVoiceListResponse,
  HeyGenCreateVideoRequest,
  HeyGenCreateVideoResponse,
  HeyGenVideoStatusResponse,
  HeyGenVideoStatus,
  HeyGenCreatePhotoAvatarRequest,
  HeyGenCreatePhotoAvatarResponse,
  HeyGenPhotoAvatarStatusResponse,
  HeyGenError,
  HeyGenErrorResponse,
} from '@/types/heygen';

export class HeyGenService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('HeyGen API key is required');
    }

    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.heygen.com/v2',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<HeyGenErrorResponse>) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError<HeyGenErrorResponse>): HeyGenError {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message;
      const detail = data?.detail;

      // Determine if error is retryable
      const retryable = status === 429 || status === 503 || status >= 500;

      return new HeyGenError(
        `HeyGen API Error (${status}): ${message}`,
        status,
        detail,
        retryable
      );
    }

    // Network error
    return new HeyGenError(
      `HeyGen API Network Error: ${error.message}`,
      0,
      undefined,
      true
    );
  }

  /**
   * List all available avatars
   */
  async listAvatars(): Promise<HeyGenAvatar[]> {
    try {
      const response = await this.client.get<HeyGenAvatarListResponse>('/avatars');
      return response.data.data.avatars;
    } catch (error) {
      console.error('[HeyGen] Failed to list avatars:', error);
      throw error;
    }
  }

  /**
   * List all available voices
   */
  async listVoices(language?: string): Promise<HeyGenVoice[]> {
    try {
      const response = await this.client.get<HeyGenVoiceListResponse>('/voices', {
        params: language ? { language } : undefined,
      });
      return response.data.data.voices;
    } catch (error) {
      console.error('[HeyGen] Failed to list voices:', error);
      throw error;
    }
  }

  /**
   * Create a video
   */
  async createVideo(request: HeyGenCreateVideoRequest): Promise<string> {
    try {
      console.log('[HeyGen] Creating video...', {
        inputs: request.video_inputs.length,
        aspectRatio: request.aspect_ratio,
        title: request.title,
      });

      const response = await this.client.post<HeyGenCreateVideoResponse>(
        '/video/generate',
        request
      );

      console.log('[HeyGen] API Response:', JSON.stringify(response.data, null, 2));

      // HeyGen API v2 uses 'error' field instead of 'code'
      if (response.data.error) {
        throw new HeyGenError(
          `Video creation failed: ${response.data.error}`,
          undefined,
          response.data.error
        );
      }

      const videoId = response.data.data?.video_id;
      console.log('[HeyGen] Video creation initiated:', { videoId });
      return videoId;
    } catch (error) {
      console.error('[HeyGen] Failed to create video:', error);
      throw error;
    }
  }

  /**
   * Get video status
   * Note: This endpoint uses v1 API, not v2
   */
  async getVideoStatus(videoId: string): Promise<HeyGenVideoStatusResponse['data']> {
    try {
      const response = await this.client.get<HeyGenVideoStatusResponse>(
        `/v1/video_status.get`,
        {
          params: { video_id: videoId },
          baseURL: 'https://api.heygen.com', // Override baseURL for v1 endpoint
        }
      );

      if (response.data.error) {
        throw new HeyGenError(
          `Failed to get video status: ${response.data.error}`,
          undefined,
          response.data.error
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('[HeyGen] Failed to get video status:', error);
      throw error;
    }
  }

  /**
   * Wait for video completion with polling
   */
  async waitForVideoCompletion(
    videoId: string,
    options: {
      pollingInterval?: number;
      maxAttempts?: number;
      onProgress?: (status: HeyGenVideoStatus, attempt: number) => void;
    } = {}
  ): Promise<string> {
    const {
      pollingInterval = 5000, // 5 seconds
      maxAttempts = 180, // 15 minutes max (180 * 5s)
      onProgress,
    } = options;

    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const status = await this.getVideoStatus(videoId);

        console.log(`[HeyGen] Video status (attempt ${attempts}/${maxAttempts}):`, {
          videoId,
          status: status.status,
        });

        onProgress?.(status.status, attempts);

        if (status.status === 'completed') {
          if (!status.video_url) {
            throw new HeyGenError(
              'Video completed but no URL provided',
              500
            );
          }
          console.log('[HeyGen] Video generation completed:', status.video_url);
          return status.video_url;
        }

        if (status.status === 'failed') {
          const errorMsg = status.error?.message || 'Video generation failed';
          throw new HeyGenError(
            errorMsg,
            status.error?.code ? parseInt(status.error.code) : 500
          );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      } catch (error) {
        if (error instanceof HeyGenError && !error.retryable) {
          throw error;
        }

        // For retryable errors, continue polling
        console.warn(`[HeyGen] Polling error (retrying):`, error);
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }
    }

    throw new HeyGenError(
      `Video generation timed out after ${maxAttempts * pollingInterval / 1000} seconds`,
      408,
      undefined,
      false
    );
  }

  /**
   * Create photo avatar
   */
  async createPhotoAvatar(request: HeyGenCreatePhotoAvatarRequest): Promise<string> {
    try {
      console.log('[HeyGen] Creating photo avatar...', {
        avatarName: request.avatar_name,
      });

      const response = await this.client.post<HeyGenCreatePhotoAvatarResponse>(
        '/avatar/photo',
        request
      );

      if (response.data.error) {
        throw new HeyGenError(
          `Photo avatar creation failed: ${response.data.error}`,
          undefined,
          response.data.error
        );
      }

      const avatarId = response.data.data.avatar_id;
      console.log('[HeyGen] Photo avatar creation initiated:', { avatarId });
      return avatarId;
    } catch (error) {
      console.error('[HeyGen] Failed to create photo avatar:', error);
      throw error;
    }
  }

  /**
   * Get photo avatar status
   */
  async getPhotoAvatarStatus(avatarId: string): Promise<HeyGenPhotoAvatarStatusResponse['data']> {
    try {
      const response = await this.client.get<HeyGenPhotoAvatarStatusResponse>(
        `/avatar/photo/${avatarId}`
      );

      if (response.data.error) {
        throw new HeyGenError(
          `Failed to get photo avatar status: ${response.data.error}`,
          undefined,
          response.data.error
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('[HeyGen] Failed to get photo avatar status:', error);
      throw error;
    }
  }

  /**
   * Wait for photo avatar completion with polling
   */
  async waitForPhotoAvatarCompletion(
    avatarId: string,
    options: {
      pollingInterval?: number;
      maxAttempts?: number;
    } = {}
  ): Promise<HeyGenPhotoAvatarStatusResponse['data']> {
    const {
      pollingInterval = 10000, // 10 seconds
      maxAttempts = 60, // 10 minutes max
    } = options;

    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const status = await this.getPhotoAvatarStatus(avatarId);

        console.log(`[HeyGen] Photo avatar status (attempt ${attempts}/${maxAttempts}):`, {
          avatarId,
          status: status.status,
        });

        if (status.status === 'completed') {
          console.log('[HeyGen] Photo avatar creation completed');
          return status;
        }

        if (status.status === 'failed') {
          const errorMsg = status.error?.message || 'Photo avatar creation failed';
          throw new HeyGenError(
            errorMsg,
            status.error?.code ? parseInt(status.error.code) : 500
          );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      } catch (error) {
        if (error instanceof HeyGenError && !error.retryable) {
          throw error;
        }

        // For retryable errors, continue polling
        console.warn(`[HeyGen] Polling error (retrying):`, error);
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }
    }

    throw new HeyGenError(
      `Photo avatar creation timed out after ${maxAttempts * pollingInterval / 1000} seconds`,
      408,
      undefined,
      false
    );
  }
}
