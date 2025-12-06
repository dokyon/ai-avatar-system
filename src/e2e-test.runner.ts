import { VideoGenerationService } from './services/video-generation.service';
import { DatabaseService } from './services/database.service';
import { VideoGenerationProgress, ScriptData } from './types/video-generation.types';

/**
 * E2E Test Configuration
 */
interface E2ETestConfig {
  openaiApiKey: string;
  didApiKey: string;
  presenterImageUrl: string;
  testScript: {
    title: string;
    content: string;
  };
}

/**
 * E2E Test Results
 */
interface E2ETestResults {
  passed: boolean;
  testResults: {
    audioGeneration: boolean;
    videoGeneration: boolean;
    databaseUpdate: boolean;
    errorHandling: boolean;
    overallFlow: boolean;
  };
  errors: string[];
  scriptId?: string;
  videoUrl?: string;
  executionTime: number;
}

/**
 * E2E Test Runner
 * Executes complete end-to-end tests for video generation pipeline
 */
export class E2ETestRunner {
  private config: E2ETestConfig;
  private videoService: VideoGenerationService;
  private dbService: DatabaseService;
  private results: E2ETestResults;

  constructor(config: E2ETestConfig) {
    this.config = config;
    this.dbService = new DatabaseService();
    this.videoService = new VideoGenerationService(
      config.openaiApiKey,
      config.didApiKey,
      this.dbService,
      config.presenterImageUrl
    );
    
    this.results = {
      passed: false,
      testResults: {
        audioGeneration: false,
        videoGeneration: false,
        databaseUpdate: false,
        errorHandling: false,
        overallFlow: false,
      },
      errors: [],
      executionTime: 0,
    };
  }

  /**
   * Run complete E2E test suite
   * @returns Promise<E2ETestResults>
   */
  async runE2ETests(): Promise<E2ETestResults> {
    const startTime = Date.now();
    console.log('🚀 Starting E2E Tests for Video Generation Pipeline');
    
    try {
      // Clear database before tests
      await this.dbService.clearAll();
      
      // Test 1: API Credentials Validation
      await this.testApiCredentials();
      
      // Test 2: Complete Video Generation Flow
      await this.testCompleteVideoFlow();
      
      // Test 3: Database Operations
      await this.testDatabaseOperations();
      
      // Test 4: Error Handling
      await this.testErrorHandling();
      
      // Calculate overall pass/fail
      this.results.passed = Object.values(this.results.testResults).every(result => result);
      
    } catch (error) {
      this.results.errors.push(`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.results.executionTime = Date.now() - startTime;
      this.printResults();
    }
    
    return this.results;
  }

  /**
   * Test API credentials validation
   */
  private async testApiCredentials(): Promise<void> {
    console.log('\n🔐 Testing API Credentials...');
    
    try {
      const validation = await this.videoService.validateCredentials();
      
      if (!validation.openai) {
        this.results.errors.push('OpenAI API key validation failed');
      }
      
      if (!validation.did) {
        this.results.errors.push('D-ID API key validation failed');
      }
      
      console.log(`✅ OpenAI API: ${validation.openai ? 'Valid' : 'Invalid'}`);
      console.log(`✅ D-ID API: ${validation.did ? 'Valid' : 'Invalid'}`);
      
    } catch (error) {
      this.results.errors.push(`API validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test complete video generation flow
   */
  private async testCompleteVideoFlow(): Promise<void> {
    console.log('\n🎬 Testing Complete Video Generation Flow...');
    
    const progressLog: VideoGenerationProgress[] = [];
    
    try {
      const result = await this.videoService.createScriptAndGenerateVideo(
        this.config.testScript.title,
        this.config.testScript.content,
        (progress) => {
          progressLog.push(progress);
          console.log(`📊 Progress: ${progress.step} - ${progress.status} - ${progress.message}`);
        }
      );
      
      if (result.success && result.videoUrl && result.scriptId) {
        this.results.testResults.overallFlow = true;
        this.results.scriptId = result.scriptId;
        this.results.videoUrl = result.videoUrl;
        
        // Check if audio generation step was logged
        this.results.testResults.audioGeneration = progressLog.some(p => p.step === 'tts');
        
        // Check if video generation step was logged
        this.results.testResults.videoGeneration = progressLog.some(p => p.step === 'video');
        
        console.log('✅ Video generation completed successfully');
        console.log(`📹 Video URL: ${result.videoUrl}`);
      } else {
        this.results.errors.push(`Video generation failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      this.results.errors.push(`Video flow error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test database operations
   */
  private async testDatabaseOperations(): Promise<void> {
    console.log('\n🗄️ Testing Database Operations...');
    
    try {
      if (!this.results.scriptId) {
        this.results.errors.push('No script ID available for database testing');
        return;
      }
      
      // Test script retrieval
      const script = await this.videoService.getScript(this.results.scriptId);
      
      if (script) {
        console.log(`✅ Script retrieved: ${script.title}`);
        console.log(`✅ Status: ${script.status}`);
        console.log(`✅ Video URL: ${script.videoUrl || 'Not set'}`);
        
        // Verify status progression
        if (script.status === 'completed' && script.videoUrl) {
          this.results.testResults.databaseUpdate = true;
        } else {
          this.results.errors.push(`Incorrect script state: status=${script.status}, videoUrl=${script.videoUrl}`);
        }
      } else {
        this.results.errors.push('Failed to retrieve script from database');
      }
      
    } catch (error) {
      this.results.errors.push(`Database test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    console.log('\n❌ Testing Error Handling...');
    
    try {
      // Test with invalid script ID
      const nonExistentScript = await this.videoService.getScript('invalid-id');
      
      if (nonExistentScript === null) {
        console.log('✅ Correctly handled non-existent script');
        this.results.testResults.errorHandling = true;
      } else {
        this.results.errors.push('Failed to handle non-existent script correctly');
      }
      
      // Test database error handling
      try {
        await this.dbService.updateScriptStatus('invalid-id', 'completed');
        this.results.errors.push('Database should have thrown error for invalid script ID');
      } catch {
        console.log('✅ Database correctly threw error for invalid script ID');
      }
      
    } catch (error) {
      this.results.errors.push(`Error handling test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 E2E TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Overall Result: ${this.results.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`⏱️ Execution Time: ${this.results.executionTime}ms`);
    
    console.log('\n📋 Individual Test Results:');
    Object.entries(this.results.testResults).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (this.results.scriptId) {
      console.log(`\n📄 Script ID: ${this.results.scriptId}`);
    }
    
    if (this.results.videoUrl) {
      console.log(`📹 Video URL: ${this.results.videoUrl}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Create test runner instance with configuration
   * @param config - E2E test configuration
   * @returns E2ETestRunner instance
   */
  static create(config: E2ETestConfig): E2ETestRunner {
    return new E2ETestRunner(config);
  }
}

/**
 * Example usage and configuration
 */
export const defaultTestConfig: E2ETestConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  didApiKey: process.env.DID_API_KEY || '',
  presenterImageUrl: 'https://example.com/presenter.jpg',
  testScript: {
    title: 'E2Eテスト動画',
    content: 'こんにちは。これはエンドツーエンドテストの動画です。AIアバターシステムが正常に動作しています。',
  },
};

/**
 * Run E2E tests (can be called from CLI or other scripts)
 */
export async function runE2ETests(config: E2ETestConfig = defaultTestConfig): Promise<E2ETestResults> {
  const runner = E2ETestRunner.create(config);
  return await runner.runE2ETests();
}