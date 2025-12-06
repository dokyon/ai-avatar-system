import { DIDResponse } from '../types/video-generation.types';

/**
 * D-ID Video Service
 * Handles video generation with lip-sync using D-ID API
 */
export class DIDVideoService {
  private apiKey: string;
  private baseUrl = 'https://api.d-id.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create video with lip-sync from text
   * @param text - Text to convert to speech
   * @param presenterImageUrl - URL of presenter image
   * @returns Promise<DIDResponse>
   */
  async createVideoFromText(text: string, presenterImageUrl: string): Promise<DIDResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: presenterImageUrl,
          script: {
            type: 'text',
            input: text,
            subtitles: false,
          },
          config: {
            fluent: false,
            pad_audio: 0.0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as DIDResponse;
    } catch (error) {
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create video with lip-sync
   * @param audioUrl - URL of audio file
   * @param presenterImageUrl - URL of presenter image
   * @returns Promise<DIDResponse>
   */
  async createVideo(audioUrl: string, presenterImageUrl: string): Promise<DIDResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: presenterImageUrl,
          script: {
            type: 'audio',
            audio_url: audioUrl,
          },
          config: {
            fluent: false,
            pad_audio: 0.0,
            stitch: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as DIDResponse;
    } catch (error) {
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get video status
   * @param videoId - D-ID video ID
   * @returns Promise<DIDResponse>
   */
  async getVideoStatus(videoId: string): Promise<DIDResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/talks/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as DIDResponse;
    } catch (error) {
      throw new Error(`Failed to get video status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for video completion
   * @param videoId - D-ID video ID
   * @param maxAttempts - Maximum polling attempts
   * @param intervalMs - Polling interval in milliseconds
   * @returns Promise<string> - Video URL
   */
  async waitForVideoCompletion(
    videoId: string,
    maxAttempts: number = 30,
    intervalMs: number = 5000
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getVideoStatus(videoId);
      
      if (status.status === 'done' && status.result_url) {
        return status.result_url;
      }
      
      if (status.status === 'error') {
        throw new Error('Video generation failed');
      }
      
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    throw new Error('Video generation timeout');
  }
}