/**
 * Video generation related types
 */

/** Video generation status */
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Script data for video generation */
export interface ScriptData {
  id: string;
  title: string;
  content: string;
  status: VideoStatus;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** OpenAI TTS API response */
export interface TTSResponse {
  audioBuffer: ArrayBuffer;
  audioUrl: string;
}

/** D-ID API response */
export interface DIDResponse {
  id: string;
  status: string;
  result_url?: string;
}

/** Video generation result */
export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

/** Video generation progress */
export interface VideoGenerationProgress {
  step: 'tts' | 'video' | 'complete';
  status: VideoStatus;
  message: string;
}