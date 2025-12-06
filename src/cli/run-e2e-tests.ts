#!/usr/bin/env node

import { runE2ETests, defaultTestConfig } from '../e2e-test.runner';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * CLI interface for running E2E tests
 */
async function main(): Promise<void> {
  console.log('🎬 Video Generation E2E Test Runner');
  console.log('====================================\n');
  
  // Validate required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  if (!process.env.DID_API_KEY) {
    console.error('❌ Error: DID_API_KEY environment variable is required');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const customTitle = args.find(arg => arg.startsWith('--title='))?.split('=')[1];
  const customContent = args.find(arg => arg.startsWith('--content='))?.split('=')[1];
  const presenterImage = args.find(arg => arg.startsWith('--presenter='))?.split('=')[1];
  
  // Override default config with command line arguments
  const config = {
    ...defaultTestConfig,
    openaiApiKey: process.env.OPENAI_API_KEY,
    didApiKey: process.env.DID_API_KEY,
    presenterImageUrl: presenterImage || defaultTestConfig.presenterImageUrl,
    testScript: {
      title: customTitle || defaultTestConfig.testScript.title,
      content: customContent || defaultTestConfig.testScript.content,
    },
  };
  
  if (verbose) {
    console.log('📝 Test Configuration:');
    console.log(`  Title: ${config.testScript.title}`);
    console.log(`  Content: ${config.testScript.content}`);
    console.log(`  Presenter Image: ${config.presenterImageUrl}`);
    console.log(`  OpenAI API Key: ${config.openaiApiKey.substring(0, 10)}...`);
    console.log(`  D-ID API Key: ${config.didApiKey.substring(0, 10)}...`);
    console.log('');
  }
  
  try {
    const results = await runE2ETests(config);
    
    // Exit with appropriate code
    process.exit(results.passed ? 0 : 1);
  } catch (error) {
    console.error('💥 Fatal error running E2E tests:');
    console.error(error);
    process.exit(1);
  }
}

// Show usage information
function showUsage(): void {
  console.log('Usage: npm run test:e2e [options]');
  console.log('');
  console.log('Options:');
  console.log('  --verbose, -v              Show verbose output');
  console.log('  --title="Custom Title"     Override test script title');
  console.log('  --content="Custom text"    Override test script content');
  console.log('  --presenter="image.jpg"    Override presenter image URL');
  console.log('');
  console.log('Environment Variables:');
  console.log('  OPENAI_API_KEY            OpenAI API key (required)');
  console.log('  DID_API_KEY              D-ID API key (required)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:e2e');
  console.log('  npm run test:e2e -- --verbose');
  console.log('  npm run test:e2e -- --title="My Test" --content="Hello world"');
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});