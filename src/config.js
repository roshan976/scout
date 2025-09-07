require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    assistantId: process.env.OPENAI_ASSISTANT_ID
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SLACK_BOT_TOKEN', 
  'SLACK_SIGNING_SECRET',
  'SLACK_APP_TOKEN'
];

function validateConfig() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file');
    return false;
  }
  
  return true;
}

module.exports = { config, validateConfig };