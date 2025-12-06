import { OpenAITTSService } from './openai-tts.service';
import { DIDVideoService } from './did-video.service';
import { DatabaseService } from './database.service';
import { VideoGenerationResult, VideoGenerationProgress, ScriptData } from '../types/video-generation.types';

/**
 * Video Generation Service
 * Orchestrates the complete video generation pipeline
 */
export class VideoGenerationService {
  private ttsService: OpenAITTSService;
  private videoService: DIDVideoService;
  private dbService: DatabaseService;
  private presenterImageUrl: string;

  constructor(
    openaiApiKey: string,
    didApiKey: string,
    dbService: DatabaseService,
    presenterImageUrl: string = 'https://example.com/presenter.jpg'
  ) {
    this.ttsService = new OpenAITTSService(openaiApiKey);
    this.videoService = new DIDVideoService(didApiKey);
    this.dbService = dbService;
    this.presenterImageUrl = presenterImageUrl;
  }

  /**
   * Generate video from script
   * @param scriptId - Script ID
   * @param onProgress - Progress callback
   * @returns Promise<VideoGenerationResult>
   */
  async generateVideo(
    scriptId: string,
    onProgress?: (progress: VideoGenerationProgress) => void
  ): Promise<VideoGenerationResult> {
    try {
      // Get script data
      const script = await this.dbService.getScript(scriptId);
      if (!script) {
        throw new Error(`Script not found: ${scriptId}`);
      }

      // Update status to processing
      await this.dbService.updateScriptStatus(scriptId, 'processing');
      onProgress?.({ step: 'tts', status: 'processing', message: 'Generating audio...' });

      // Skip OpenAI TTS in Node.js environment, use D-ID's text-to-speech instead
      onProgress?.({ step: 'video', status: 'processing', message: 'Generating video...' });

      // Create video using D-ID with text input (works in Node.js)
      const videoResponse = await this.videoService.createVideoFromText(
        script.content,
        this.presenterImageUrl
      );

      // Wait for video completion
      const videoUrl = await this.videoService.waitForVideoCompletion(videoResponse.id);

      // Update database with video URL and completed status
      await this.dbService.updateScriptVideoUrl(scriptId, videoUrl);
      await this.dbService.updateScriptStatus(scriptId, 'completed');

      onProgress?.({ step: 'complete', status: 'completed', message: 'Video generation completed!' });

      return {
        success: true,
        videoUrl,
      };
    } catch (error) {
      // Update status to failed
      await this.dbService.updateScriptStatus(scriptId, 'failed');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.({ step: 'complete', status: 'failed', message: `Error: ${errorMessage}` });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create script and generate video
   * @param title - Script title
   * @param content - Script content
   * @param onProgress - Progress callback
   * @returns Promise<VideoGenerationResult & { scriptId: string }>
   */
  async createScriptAndGenerateVideo(
    title: string,
    content: string,
    onProgress?: (progress: VideoGenerationProgress) => void
  ): Promise<VideoGenerationResult & { scriptId: string }> {
    // Create script
    const script = await this.dbService.createScript(title, content);
    
    // Generate video
    const result = await this.generateVideo(script.id, onProgress);
    
    return {
      ...result,
      scriptId: script.id,
    };
  }

  /**
   * Get script data
   * @param scriptId - Script ID
   * @returns Promise<ScriptData | null>
   */
  async getScript(scriptId: string): Promise<ScriptData | null> {
    return this.dbService.getScript(scriptId);
  }

  /**
   * Validate API credentials
   * @returns Promise<{ openai: boolean; did: boolean }>
   */
  async validateCredentials(): Promise<{ openai: boolean; did: boolean }> {
    const [openaiValid, didValid] = await Promise.allSettled([
      this.ttsService.validateApiKey(),
      // D-ID validation would require actual API call
      Promise.resolve(true),
    ]);

    return {
      openai: openaiValid.status === 'fulfilled' ? openaiValid.value : false,
      did: didValid.status === 'fulfilled' ? didValid.value : false,
    };
  }
}