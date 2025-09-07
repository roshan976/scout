# Scout Setup Guide

This guide walks through the complete setup process for Scout, from initial installation to production deployment.

## 📋 Prerequisites Checklist

### System Requirements
- [ ] Node.js 18.0+ installed
- [ ] npm package manager
- [ ] Git access to repository
- [ ] Administrator access to Slack workspace
- [ ] OpenAI API account (optional for demo mode)

### Account Setup
- [ ] Slack workspace admin permissions
- [ ] OpenAI API key and credits available
- [ ] Domain/server for production deployment

## 🛠️ Installation Steps

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd scout

# Install dependencies
npm install

# Verify installation
node --version  # Should be 18.0+
npm --version   # Should be 8.0+
```

### 2. Configuration Files

#### Create Environment File
```bash
# Create .env file
cp .env.example .env  # If example exists, or create new file
```

#### Basic .env Template
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration (Optional - runs in demo mode without these)
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...

# Slack Configuration (Required for Slack bot functionality)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
```

### 3. Test Basic Functionality

```bash
# Start the server
npm start

# Verify endpoints (in separate terminal)
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# Check web interface
open http://localhost:3000
# Should show file upload form
```

## 🤖 OpenAI Assistant Setup

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create new secret key
4. Copy key to `OPENAI_API_KEY` in .env

### 2. Create Assistant
```bash
# With server running and OPENAI_API_KEY set
# Upload a test document via http://localhost:3000
# Assistant will be created automatically
```

### 3. Manual Assistant Creation (Alternative)
```javascript
// Use OpenAI console or API to create assistant with:
{
  "name": "Scout Knowledge Assistant",
  "instructions": "You are Scout, Arrow's internal knowledge assistant...",
  "tools": [{"type": "file_search"}],
  "model": "gpt-4-turbo-preview"
}
```

## 📱 Slack App Setup

### 1. Create Slack App
1. Visit [Slack API Console](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. App Name: "Scout"
4. Workspace: Select your workspace

### 2. Configure App Settings

#### Bot Token Scopes
Add these OAuth scopes in "OAuth & Permissions":
```
app_mentions:read
channels:history
channels:read
chat:write
files:read
groups:history
groups:read
im:history
im:read
im:write
mpim:history
mpim:read
users:read
```

#### Event Subscriptions
Enable events and add these bot events:
```
app_mention
message.channels
message.groups
message.im
message.mpim
```

#### Socket Mode
1. Enable Socket Mode
2. Generate App-Level Token with `connections:write` scope
3. Copy token to `SLACK_APP_TOKEN`

### 3. Install App to Workspace
1. Go to "Install App" section
2. Click "Install to Workspace"
3. Copy "Bot User OAuth Token" to `SLACK_BOT_TOKEN`
4. Copy "Signing Secret" to `SLACK_SIGNING_SECRET`

### 4. Test Slack Integration
```bash
# Start Slack bot (separate from web server)
node slack-bot.js

# In Slack, mention @scout in a channel
@scout hello

# Should receive response from bot
```

## 📁 File Upload Configuration

### 1. Directory Structure
```bash
# Ensure required directories exist (auto-created on startup)
mkdir -p uploads data public

# Verify permissions
ls -la uploads/ data/ public/
```

### 2. Test File Upload
1. Visit http://localhost:3000
2. Upload a test file (PDF, TXT, CSV, or DOCX)
3. Add meaningful description
4. Verify file appears in `uploads/` directory
5. Check `data/files.json` for metadata

### 3. File Validation
Scout accepts these file types:
- `.pdf` - PDF documents
- `.txt` - Text files
- `.csv` - Comma-separated values
- `.docx` - Microsoft Word documents

Maximum file size: 10MB

## 🚀 Production Deployment

### 1. Server Setup

#### Option A: PM2 Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Start applications
pm2 start src/server.js --name "scout-server"
pm2 start slack-bot.js --name "scout-slack-bot"

# Save configuration
pm2 save
pm2 startup  # Follow instructions for auto-start
```

#### Option B: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Reverse Proxy Configuration

#### Nginx Example
```nginx
server {
    listen 80;
    server_name scout.yourcompany.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL Certificate
```bash
# Using Certbot for Let's Encrypt
sudo certbot --nginx -d scout.yourcompany.com
```

### 4. Environment Variables (Production)
```bash
# Production .env
NODE_ENV=production
PORT=3000

# Use production OpenAI keys
OPENAI_API_KEY=sk-prod-...
OPENAI_ASSISTANT_ID=asst_prod-...

# Production Slack tokens
SLACK_BOT_TOKEN=xoxb-prod-...
SLACK_SIGNING_SECRET=prod-...
SLACK_APP_TOKEN=xapp-prod-...
```

## ✅ Verification Checklist

### Basic Functionality
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Web interface loads
- [ ] File upload works
- [ ] Files stored in uploads/
- [ ] Metadata tracked in data/files.json

### OpenAI Integration
- [ ] API key configured
- [ ] Assistant created/configured
- [ ] Query processing works
- [ ] Mock responses work without API key

### Slack Integration
- [ ] Bot installed in workspace
- [ ] Socket mode connected
- [ ] @scout mentions work
- [ ] Direct messages work
- [ ] Enhanced formatting appears
- [ ] Help command works

### Production Readiness
- [ ] Process management configured
- [ ] Reverse proxy setup
- [ ] SSL certificate installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Error logging setup

## 🐛 Common Setup Issues

### Server Won't Start
```bash
# Check port availability
lsof -i :3000
# Kill process if needed
kill -9 <PID>

# Check Node.js version
node --version
# Update if < 18.0

# Check dependencies
npm install
```

### Slack Bot Not Responding
1. **Socket Mode**: Verify enabled with correct app token
2. **Permissions**: Check OAuth scopes match requirements
3. **Events**: Verify event subscriptions enabled
4. **Tokens**: Confirm all three tokens are correct

### File Upload Issues
1. **Directory Permissions**: Ensure uploads/ directory is writable
2. **File Size**: Check files are under 10MB limit
3. **File Type**: Verify extensions are .pdf, .txt, .csv, or .docx
4. **Disk Space**: Ensure sufficient storage available

### OpenAI Integration Problems
1. **API Key**: Verify key is valid and has credits
2. **Assistant ID**: Ensure assistant exists and is configured
3. **File Search**: Confirm assistant has file_search tool enabled
4. **Rate Limits**: Check if hitting API rate limits

## 📞 Getting Help

### Logs and Debugging
```bash
# View application logs
pm2 logs scout-server
pm2 logs scout-slack-bot

# Check system logs
tail -f /var/log/nginx/error.log  # For nginx issues

# Debug mode
DEBUG=* npm start  # Verbose logging
```

### Support Resources
- Check README.md for general usage
- Review API documentation
- Examine server logs for error details
- Test individual components separately

### Escalation Path
1. Check logs for specific error messages
2. Verify configuration against this guide
3. Test individual components (server, Slack, OpenAI)
4. Contact development team with specific error details

---

**Setup completed successfully?** Your Scout installation should now be ready for production use!