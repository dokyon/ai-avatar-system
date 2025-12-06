import OpenAI from 'openai';
import { TTSResponse } from '../types/video-generation.types';

/**
 * OpenAI TTS Service
 * Handles text-to-speech conversion using OpenAI API
 */
export class OpenAITTSService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Convert text to speech
   * @param text - Text to convert to speech
   * @param voice - Voice to use (default: 'alloy')
   * @returns Promise<TTSResponse>
   */
  async generateSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'
  ): Promise<TTSResponse> {
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        response_format: 'mp3',
      });

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioBuffer,
        audioUrl,
      };
    } catch (error) {
      throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate API key
   * @returns Promise<boolean>
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch {
      return false;
    }
  }
}