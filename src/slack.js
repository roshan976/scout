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

// Global error handler - must be defined before other handlers
app.error(async (error) => {
  console.error('❌ Global Slack error handler:', error);
});

// Debug middleware with proper error handling
app.use(async ({ payload, next }) => {
  try {
    console.log('🔔 Slack Event Received:', payload.type, payload.event?.type || 'no event type');
    if (payload.event) {
      console.log('📩 Event details:', {
        type: payload.event.type,
        text: payload.event.text,
        user: payload.event.user,
        channel: payload.event.channel
      });
    }
    await next();
  } catch (error) {
    console.error('❌ Middleware error:', error);
    // Don't re-throw to prevent cascade failures
  }
});

// Consolidated message handler with proper error boundaries
app.message(async ({ message, say }) => {
  try {
    // Skip if this is a bot message or from Scout itself
    if (message.bot_id || message.subtype === 'bot_message') {
      return;
    }
    
    console.log('📥 Processing message:', {
      text: message.text?.substring(0, 100) + '...',
      user: message.user,
      channel: message.channel,
      thread_ts: message.thread_ts
    });
    
    // Check if this is a thread reply where Scout has already responded
    if (message.thread_ts) {
      try {
        // Get the thread history to see if Scout has responded
        const threadHistory = await app.client.conversations.replies({
          token: config.slack.botToken,
          channel: message.channel,
          ts: message.thread_ts,
          limit: 50
        });
        
        // Check if Scout (bot) has replied in this thread
        const scoutHasReplied = threadHistory.messages.some(msg => 
          msg.bot_id && (msg.text?.toLowerCase().includes('scout') || msg.blocks)
        );
        
        if (scoutHasReplied) {
          console.log('📝 Thread reply detected - Scout responding without mention required');
          await handleScoutQuery(message, say, message.text);
          return;
        }
      } catch (threadError) {
        console.error('❌ Error checking thread history:', threadError.message);
      }
    }
    
    // Check if message mentions scout or contains "scout"
    if (message.text && /scout/i.test(message.text)) {
      console.log('📩 Received Scout mention:', message.text);
      console.log('👤 From user:', message.user);
      console.log('📍 In channel:', message.channel);
      
      // Extract the query from the message (remove "scout" mentions)
      const query = message.text
        .replace(/@scout\s*/gi, '')
        .replace(/\bscout\b\s*/gi, '')
        .trim();
      
      await handleScoutQuery(message, say, query);
    }
    
  } catch (error) {
    console.error('❌ Error in message handler:', error);
    
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

// Listen for app mentions (@scout) with proper error handling
app.event('app_mention', async ({ event, say }) => {
  try {
    console.log('📢 App mention received:', event.text);
    console.log('👤 From user:', event.user);
    console.log('📍 In channel:', event.channel);
    
    // Extract the query from the mention (remove @mentions)
    const query = event.text
      .replace(/<@[^>]+>/g, '') // Remove @mentions
      .trim();
    
    // Create a mock message object for consistency with handleScoutQuery
    const mockMessage = {
      user: event.user,
      channel: event.channel,
      ts: event.ts,
      text: query
    };
    
    await handleScoutQuery(mockMessage, say, query);
    
  } catch (error) {
    console.error('❌ Error handling app mention:', error);
    // Don't re-throw to prevent framework errors
  }
});

// Handle direct messages to Scout with proper error handling
app.message({ channel_type: 'im' }, async ({ message, say }) => {
  try {
    console.log('💬 Direct message received:', message.text);
    console.log('👤 From user:', message.user);
    
    await say({
      text: `🤖 Hi there! I'm Scout, Arrow's internal knowledge assistant.\n\n💡 **How to use me:**\n• Mention me in #ask-scout with your questions\n• I'll search through company documents to find answers\n• I provide cited responses with source references\n\n⚙️ **Current Status:** Fully operational\n📁 **Admin Dashboard:** Available for document uploads\n\n✅ Ready to answer your questions!`
    });
    
  } catch (error) {
    console.error('❌ Error handling direct message:', error);
    // Don't re-throw to prevent framework errors
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

// Centralized Scout query handler with comprehensive error handling
async function handleScoutQuery(message, say, query) {
  try {
    console.log('💬 Processing Scout query:', query);
    console.log('👤 From user:', message.user);
    console.log('📍 In channel:', message.channel);
    
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
      includeQuickActions: false, // Buttons are disabled
      includeTimestamp: false // Timestamp disabled per user request
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
    console.error('❌ Error processing Scout query:', error);
    
    try {
      await say({
        text: '🚨 Sorry, I encountered an error processing your request. Please try again later.',
        thread_ts: message.ts
      });
    } catch (sayError) {
      console.error('❌ Error sending error message:', sayError);
    }
    // Don't re-throw to prevent framework cascade failures
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