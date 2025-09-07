# Scout - Internal Knowledge Assistant

Scout is an AI-powered Slack bot that helps Arrow employees quickly find information from company documents using natural language queries.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Slack workspace with admin access
- OpenAI API account (optional for demo mode)

### Installation
```bash
# Clone and install dependencies
cd scout
npm install

# Start the server
npm start
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file with the following variables:

```bash
# Server Configuration
PORT=3000

# OpenAI Configuration (Optional - runs in demo mode without these)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_assistant_id_here

# Slack Configuration (Required for Slack integration)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your_signing_secret
SLACK_APP_TOKEN=xapp-your-app-token
```

### Setup Process
1. **Upload Documents**: Visit `http://localhost:3000` to upload company documents
2. **Configure API Keys**: Add OpenAI credentials for live AI responses
3. **Install Slack App**: Add the Scout bot to your Slack workspace
4. **Start Using**: Mention `@scout` in Slack channels or DM the bot

## 📋 Features

### 🤖 AI-Powered Search
- Natural language queries: "What's our vacation policy?"
- Intelligent document search using OpenAI Assistants API
- Cited responses with source references

### 📁 Document Management
- Web interface for file uploads (PDF, CSV, TXT, DOCX)
- File descriptions for better search accuracy
- Automatic metadata tracking and storage

### 💬 Slack Integration
- Respond to @scout mentions in channels
- Support for direct messages
- Enhanced formatting with action buttons
- Help functionality with `/scout help`

### 🔒 Security & Validation
- File type restrictions (.pdf, .csv, .txt, .docx only)
- 10MB file size limit
- Input validation and sanitization
- Error handling with user-friendly messages

## 🏗️ Architecture

### Core Components
```
scout/
├── src/
│   ├── server.js           # Express server and API endpoints
│   ├── slack.js            # Slack bot integration
│   ├── query-handler.js    # Query processing and OpenAI integration
│   ├── response-formatter.js # Enhanced Slack response formatting
│   ├── storage.js          # File metadata management
│   ├── openai.js          # OpenAI Assistant management
│   └── config.js          # Configuration management
├── public/
│   └── index.html         # File upload web interface
├── data/
│   └── files.json         # File metadata storage
├── uploads/               # Uploaded document storage
└── package.json          # Dependencies and scripts
```

### Technology Stack
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI Assistants API
- **Chat Platform**: Slack Bolt SDK
- **File Handling**: Multer
- **Storage**: JSON-based metadata, filesystem for files

## 📖 Usage Guide

### For End Users

#### Slack Usage
```
# In any channel
@scout What's our vacation policy?
scout how do I submit expenses?

# Direct message
What are the office hours?
```

#### Web Interface
1. Visit `http://localhost:3000`
2. Select a document (PDF, CSV, TXT, or DOCX)
3. Add a description explaining what the document contains
4. Click "Upload File"

### For Administrators

#### Document Management
- Monitor uploads via the web interface
- Check `data/files.json` for metadata tracking
- Files stored in `uploads/` directory with timestamps

#### Configuration Management
- Update API keys in `.env` file
- Restart server after configuration changes
- Monitor logs for system health

## 🔧 API Reference

### REST Endpoints

#### Health Check
```bash
GET /health
Response: {"status": "ok"}
```

#### Query Processing
```bash
POST /query
Content-Type: application/json
Body: {"query": "What is our vacation policy?"}
Response: {
  "query": "What is our vacation policy?",
  "raw": {...},
  "slack": {...},
  "slackEnhanced": {...}
}
```

#### File Upload
```bash
POST /upload
Content-Type: multipart/form-data
Fields:
  - file: Document file (PDF, CSV, TXT, DOCX)
  - description: Text description of document contents
Response: {
  "message": "File uploaded successfully",
  "filename": "timestamp-filename.ext",
  "openai": {...}
}
```

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**: Configure production environment variables
2. **Process Management**: Use PM2 or similar for process management
3. **Reverse Proxy**: Configure nginx/Apache for production serving
4. **SSL Certificate**: Enable HTTPS for secure communication
5. **Monitoring**: Set up logging and monitoring solutions

### Recommended Production Setup
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name "scout-server"
pm2 start slack-bot.js --name "scout-slack-bot"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔍 Troubleshooting

### Common Issues

#### "OpenAI not configured" messages
- **Cause**: Missing OPENAI_API_KEY or OPENAI_ASSISTANT_ID
- **Solution**: Add credentials to .env file or run in demo mode

#### Slack bot not responding
- **Cause**: Missing Slack tokens or incorrect permissions
- **Solution**: Verify SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN

#### File upload failures
- **Cause**: Invalid file type or size too large
- **Solution**: Use supported formats (PDF, CSV, TXT, DOCX) under 10MB

#### Server won't start
- **Cause**: Port already in use or missing dependencies
- **Solution**: Change PORT in .env or run `npm install`

### Log Interpretation
```
✅ Required directories verified    # Startup successful
🔍 API Query received              # Query processing
⚠️ OpenAI not configured          # Demo mode active
❌ Error processing query          # System error
```

## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Run with custom port
PORT=3001 npm start
```

### Code Structure
- Follow existing patterns in each module
- Add error handling for all user inputs
- Include logging for debugging purposes
- Test changes with both demo and live modes

## 📄 License

Internal use only - Arrow company property.

## 📞 Support

For technical support or feature requests:
- Create an issue in the internal repository
- Contact the development team via Slack
- Check logs in the console for error details

---

**Scout v1.0** - Built for Arrow's internal knowledge sharing