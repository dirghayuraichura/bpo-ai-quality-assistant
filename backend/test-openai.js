import dotenv from 'dotenv';
import sttService from './services/sttService.js';
import llmService from './services/llmService.js';


dotenv.config();

/**
 * Test OpenAI API Integration
 * This script tests the connectivity to OpenAI Whisper and GPT APIs
 */
async function testOpenAIIntegration() {
  console.log('🧪 Testing OpenAI API Integration...\n');

  // Test API key configuration
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 API Key Status:');
  console.log(`   Configured: ${!!apiKey}`);
  console.log(`   Valid format: ${apiKey?.startsWith('sk-')}`);
  console.log(`   Preview: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set'}\n`);

  // Test STT Service Connection
  console.log('🎯 Testing STT Service (Whisper API):');
  try {
    const sttConnected = await sttService.testConnection();
    console.log(`   Status: ${sttConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   File size limit: ${Math.round(sttService.getFileSizeLimit() / (1024 * 1024))}MB`);
    console.log(`   Supported languages: ${sttService.getSupportedLanguages().length} languages`);
  } catch (error) {
    console.log(`   Error: ❌ ${error.message}`);
  }
  console.log();

  // Test LLM Service Connection
  console.log('🧠 Testing LLM Service (GPT API):');
  try {
    const llmConnected = await llmService.testConnection();
    console.log(`   Status: ${llmConnected ? '✅ Connected' : '❌ Disconnected'}`);
  } catch (error) {
    console.log(`   Error: ❌ ${error.message}`);
  }
  console.log();

  // Check API key configuration
  if (!apiKey || apiKey === 'mock_openai_key') {
    console.log('⚠️  OpenAI API key not configured');
    console.log('   To use OpenAI services, set OPENAI_API_KEY in your .env file');
    console.log('   Services will return errors when API key is not configured');
  } else {
    console.log('✅ OpenAI API key configured - services will use real OpenAI APIs');
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testOpenAIIntegration().catch(console.error); 