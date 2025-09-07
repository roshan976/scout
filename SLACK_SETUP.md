# Scout Slack App Setup Guide

## 1. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. App Name: **Scout**
4. Pick your workspace

## 2. Configure OAuth & Permissions

Go to **OAuth & Permissions** in the sidebar:

### Bot Token Scopes (Required):
- `app_mentions:read` - View messages that directly mention Scout
- `chat:write` - Send messages as Scout
- `channels:read` - View basic information about public channels
- `groups:read` - View basic information about private channels Scout has been added to
- `im:read` - View basic information about direct messages that Scout has been added to
- `mpim:read` - View basic information about group direct messages that Scout has been added to
- `files:read` - View files shared in channels and conversations that Scout has been added to

### User Token Scopes:
- None required

## 3. Install App to Workspace

1. Click **"Install to Workspace"**
2. Review permissions and click **"Allow"**
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

## 4. Enable Socket Mode

1. Go to **Socket Mode** in the sidebar
2. Toggle **"Enable Socket Mode"** to **On**
3. Create an **App-Level Token**:
   - Token Name: `socket_connection`
   - Scopes: `connections:write`
4. Copy the **App-Level Token** (starts with `xapp-`)

## 5. Configure Event Subscriptions

Go to **Event Subscriptions**:

1. Toggle **"Enable Events"** to **On**
2. **Request URL**: Leave empty (using Socket Mode)

### Subscribe to Bot Events:
- `app_mention` - When Scout is mentioned with @scout
- `message.channels` - Message events in channels
- `message.groups` - Message events in private channels  
- `message.im` - Message events in direct messages

## 6. Update Environment Variables

Update your `.env` file:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-actual-bot-token-here
SLACK_SIGNING_SECRET=your-actual-signing-secret-here  
SLACK_APP_TOKEN=xapp-your-actual-app-token-here
```

Get these values:
- **SLACK_BOT_TOKEN**: From OAuth & Permissions → Bot User OAuth Token
- **SLACK_SIGNING_SECRET**: From Basic Information → App Credentials → Signing Secret
- **SLACK_APP_TOKEN**: From Socket Mode → App-Level Token

## 7. Test the Bot

1. Start the Slack bot:
   ```bash
   npm run slack
   ```

2. Invite Scout to a channel:
   ```
   /invite @scout
   ```

3. Test mentions:
   ```
   @scout hello
   ```

4. Test keyword detection:
   ```
   Can scout help with this?
   ```

5. Test direct messages:
   - Send a DM to Scout

## 8. Expected Bot Behavior

- **@scout mentions**: Responds with acknowledgment
- **"scout" keyword**: Responds when word "scout" is mentioned  
- **Direct messages**: Provides help information
- **Thread replies**: Responds in threads to keep conversations organized

## Troubleshooting

### Bot not responding:
1. Check Socket Mode is enabled
2. Verify all tokens are correct in `.env`
3. Ensure bot is invited to the channel
4. Check console logs for errors

### Permission errors:
1. Review OAuth scopes match the required list above
2. Reinstall the app if scopes were changed
3. Ensure bot is added to channels where you're testing

### Socket connection issues:
1. Verify SLACK_APP_TOKEN is set correctly
2. Check firewall/network restrictions
3. Restart the bot application

## Production Deployment

For production:
1. Deploy both the web server (`npm start`) and bot (`npm run slack`)
2. Use process managers like PM2 for reliability
3. Set up proper logging and monitoring
4. Configure environment variables on your server

## Next Steps

Once the bot is responding:
1. Test the query functionality (Step 11)
2. Configure OpenAI Assistant integration
3. Add the bot to your #ask-scout channel
4. Train team members on usage