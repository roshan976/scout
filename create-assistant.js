#!/usr/bin/env node

/**
 * Script to create Scout OpenAI Assistant
 * 
 * Usage:
 * 1. Set OPENAI_API_KEY in .env file
 * 2. Run: node create-assistant.js
 * 3. Assistant ID will be saved to .env file
 */

const { createAssistant } = require('./src/openai');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    console.log('🚀 Creating Scout Assistant...');
    
    // Check if API key is set
    require('dotenv').config();
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.error('❌ Please set OPENAI_API_KEY in .env file first');
      process.exit(1);
    }
    
    // Create Assistant
    const assistant = await createAssistant();
    
    // Update .env file with Assistant ID
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace or add OPENAI_ASSISTANT_ID
    if (envContent.includes('OPENAI_ASSISTANT_ID=')) {
      envContent = envContent.replace(
        /OPENAI_ASSISTANT_ID=.*/,
        `OPENAI_ASSISTANT_ID=${assistant.id}`
      );
    } else {
      envContent += `\nOPENAI_ASSISTANT_ID=${assistant.id}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Scout Assistant created and configured!');
    console.log(`📝 Assistant ID saved to .env: ${assistant.id}`);
    console.log('🔧 You can now upload files and use Scout');
    
  } catch (error) {
    console.error('❌ Failed to create Assistant:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}