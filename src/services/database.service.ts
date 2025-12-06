import { ScriptData, VideoStatus } from '../types/video-generation.types';

/**
 * Database Service
 * Handles database operations for script data
 */
export class DatabaseService {
  private scripts: Map<string, ScriptData> = new Map();

  /**
   * Create new script
   * @param title - Script title
   * @param content - Script content
   * @returns Promise<ScriptData>
   */
  async createScript(title: string, content: string): Promise<ScriptData> {
    const id = `script_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const script: ScriptData = {
      id,
      title,
      content,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scripts.set(id, script);
    return script;
  }

  /**
   * Get script by ID
   * @param id - Script ID
   * @returns Promise<ScriptData | null>
   */
  async getScript(id: string): Promise<ScriptData | null> {
    const script = this.scripts.get(id);
    return script || null;
  }

  /**
   * Update script status
   * @param id - Script ID
   * @param status - New status
   * @returns Promise<void>
   */
  async updateScriptStatus(id: string, status: VideoStatus): Promise<void> {
    const script = this.scripts.get(id);
    if (!script) {
      throw new Error(`Script not found: ${id}`);
    }

    script.status = status;
    script.updatedAt = new Date();
    this.scripts.set(id, script);
  }

  /**
   * Update script video URL
   * @param id - Script ID
   * @param videoUrl - Video URL
   * @returns Promise<void>
   */
  async updateScriptVideoUrl(id: string, videoUrl: string): Promise<void> {
    const script = this.scripts.get(id);
    if (!script) {
      throw new Error(`Script not found: ${id}`);
    }

    script.videoUrl = videoUrl;
    script.updatedAt = new Date();
    this.scripts.set(id, script);
  }

  /**
   * Get all scripts
   * @returns Promise<ScriptData[]>
   */
  async getAllScripts(): Promise<ScriptData[]> {
    return Array.from(this.scripts.values());
  }

  /**
   * Delete script
   * @param id - Script ID
   * @returns Promise<void>
   */
  async deleteScript(id: string): Promise<void> {
    const deleted = this.scripts.delete(id);
    if (!deleted) {
      throw new Error(`Script not found: ${id}`);
    }
  }

  /**
   * Clear all scripts (for testing)
   * @returns Promise<void>
   */
  async clearAll(): Promise<void> {
    this.scripts.clear();
  }
}