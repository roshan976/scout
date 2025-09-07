const { App } = require('@slack/bolt');
const { config } = require('./config');
const { processQuery, formatSlackResponse, formatEnhancedSlackResponse, formatHelpResponse, formatQuickResponse } = require('./query-handler');

// Initialize Slack app
const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
  port: process.env.SLACK_PORT || 3001
});

// Listen for messages that mention @scout or contain "scout"
app.message(/scout/i, async ({ message, say }) => {
  try {
    console.log('📩 Received Scout mention:', message.text);
    console.log('👤 From user:', message.user);
    console.log('📍 In channel:', message.channel);
    
    // Extract the query from the message (remove "scout" mentions)
    const query = message.text
      .replace(/@scout\s*/gi, '')
      .replace(/\bscout\b\s*/gi, '')
      .trim();
    
    // Handle help requests
    if (!query || query.length < 3 || /^(help|usage|how to|what can you do)/i.test(query)) {
      const helpResponse = formatHelpResponse();
      await say({
        text: helpResponse.text,
        blocks: helpResponse.blocks,
        thread_ts: message.ts
      });
      return;
    }
    
    // Send "thinking" message
    const thinkingResponse = await say({
      text: '🤖 Searching through company documents...',
      thread_ts: message.ts
    });
    
    // Process the query
    const queryResult = await processQuery(query, message.user, message.channel);
    
    // Format the response for Slack with enhanced formatting
    const slackResponse = formatEnhancedSlackResponse(queryResult, query, {
      responseStyle: 'professional',
      includeQuickActions: true,
      includeTimestamp: true
    });
    
    // Update the thinking message with the actual response
    try {
      await app.client.chat.update({
        token: config.slack.botToken,
        channel: message.channel,
        ts: thinkingResponse.ts,
        text: slackResponse.text,
        blocks: slackResponse.blocks
      });
    } catch (updateError) {
      // If update fails, send a new message
      console.error('Failed to update message, sending new one:', updateError.message);
      await say({
        text: slackResponse.text,
        blocks: slackResponse.blocks,
        thread_ts: message.ts
      });
    }
    
  } catch (error) {
    console.error('❌ Error handling Scout mention:', error);
    
    try {
      await say({
        text: '🚨 Sorry, I encountered an error processing your request. Please try again later.',
        thread_ts: message.ts
      });
    } catch (sayError) {
      console.error('❌ Error sending error message:', sayError);
    }
  }
});

// Listen for app mentions (@scout)
app.event('app_mention', async ({ event, say }) => {
  try {
    console.log('📢 App mention received:', event.text);
    console.log('👤 From user:', event.user);
    console.log('📍 In channel:', event.channel);
    
    // Extract the query from the mention (remove @scout)
    const query = event.text
      .replace(/<@[^>]+>/g, '') // Remove @mentions
      .trim();
    
    // Handle help requests
    if (!query || query.length < 3 || /^(help|usage|how to|what can you do)/i.test(query)) {
      const helpResponse = formatHelpResponse();
      await say({
        text: `Hi <@${event.user}>! ${helpResponse.text}`,
        blocks: helpResponse.blocks,
        thread_ts: event.ts
      });
      return;
    }
    
    // Send "thinking" message
    const thinkingResponse = await say({
      text: '🤖 Searching through company documents...',
      thread_ts: event.ts
    });
    
    // Process the query
    const queryResult = await processQuery(query, event.user, event.channel);
    
    // Format the response for Slack with enhanced formatting
    const slackResponse = formatEnhancedSlackResponse(queryResult, query, {
      responseStyle: 'professional',
      includeQuickActions: true,
      includeTimestamp: true
    });
    
    // Update the thinking message with the actual response
    try {
      await app.client.chat.update({
        token: config.slack.botToken,
        channel: event.channel,
        ts: thinkingResponse.ts,
        text: slackResponse.text,
        blocks: slackResponse.blocks
      });
    } catch (updateError) {
      // If update fails, send a new message
      console.error('Failed to update message, sending new one:', updateError.message);
      await say({
        text: slackResponse.text,
        blocks: slackResponse.blocks,
        thread_ts: event.ts
      });
    }
    
  } catch (error) {
    console.error('❌ Error handling app mention:', error);
  }
});

// Handle direct messages to Scout
app.message({ channel_type: 'im' }, async ({ message, say }) => {
  try {
    console.log('💬 Direct message received:', message.text);
    console.log('👤 From user:', message.user);
    
    await say({
      text: `🤖 Hi there! I'm Scout, Arrow's internal knowledge assistant.\n\n💡 **How to use me:**\n• Mention me in #ask-scout with your questions\n• I'll search through company documents to find answers\n• I provide cited responses with source references\n\n⚙️ **Current Status:** Still being configured\n📁 **Admin Dashboard:** Available for document uploads\n\n🔜 Full search functionality coming soon!`
    });
    
  } catch (error) {
    console.error('❌ Error handling direct message:', error);
  }
});

// Start the Slack app
async function startSlackBot() {
  try {
    await app.start();
    console.log('⚡ Scout Slack bot is running!');
    console.log('🤖 Bot Configuration:');
    console.log('   - Socket Mode: Enabled');
    console.log('   - Port:', process.env.SLACK_PORT || 3001);
    console.log('   - Listening for: @scout mentions, "scout" messages, DMs');
    console.log('');
    console.log('🔗 Ready to receive Slack events');
    
  } catch (error) {
    console.error('❌ Error starting Scout Slack bot:', error.message);
    
    if (error.message.includes('token')) {
      console.log('💡 Make sure these environment variables are set:');
      console.log('   - SLACK_BOT_TOKEN');
      console.log('   - SLACK_SIGNING_SECRET'); 
      console.log('   - SLACK_APP_TOKEN (for Socket Mode)');
    }
    
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Scout Slack bot...');
  await app.stop();
  process.exit(0);
});

module.exports = {
  app,
  startSlackBot
};