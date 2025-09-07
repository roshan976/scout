#!/usr/bin/env node

/**
 * Scout Slack Bot Entry Point
 * 
 * This is the main entry point for running the Scout Slack bot as a standalone process.
 * It imports and starts the Slack bot defined in src/slack.js.
 */

const { startSlackBot } = require('./src/slack');

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Scout Slack bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Scout Slack bot...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the Slack bot
async function main() {
  try {
    console.log('🚀 Starting Scout Slack Bot...');
    console.log('');
    await startSlackBot();
  } catch (error) {
    console.error('❌ Failed to start Scout Slack bot:', error.message);
    
    // Provide helpful error guidance
    if (error.message.includes('invalid_auth')) {
      console.log('\n💡 Authentication Error - Check these environment variables:');
      console.log('   - SLACK_BOT_TOKEN (should start with xoxb-)');
      console.log('   - SLACK_SIGNING_SECRET');
      console.log('   - SLACK_APP_TOKEN (should start with xapp-)');
      console.log('\n📖 See SETUP.md for detailed Slack configuration instructions.');
    } else if (error.message.includes('missing')) {
      console.log('\n💡 Missing Configuration - Ensure all required environment variables are set');
      console.log('📖 Check .env.example for required configuration');
    } else {
      console.log('\n📞 For additional support, check the logs above and contact the development team');
    }
    
    process.exit(1);
  }
}

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  main();
}

module.exports = {
  main
};