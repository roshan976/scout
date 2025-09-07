# Scout Production Deployment Checklist

Use this checklist to ensure Scout is properly configured and ready for production deployment.

## 📋 Pre-Deployment Checklist

### ✅ Environment Configuration

#### Required Environment Variables
- [ ] `OPENAI_API_KEY` - Valid OpenAI API key with credits
- [ ] `OPENAI_ASSISTANT_ID` - Created OpenAI Assistant ID
- [ ] `SLACK_BOT_TOKEN` - Valid Slack Bot User OAuth Token (xoxb-)
- [ ] `SLACK_SIGNING_SECRET` - Slack app signing secret
- [ ] `SLACK_APP_TOKEN` - Slack App-Level Token for Socket Mode (xapp-)
- [ ] `NODE_ENV=production` - Set to production
- [ ] `PORT` - Configured port (default: 3000)

#### Optional Configuration
- [ ] `LOG_LEVEL` - Set appropriate log level (info/warn/error)
- [ ] `MAX_FILE_SIZE` - File upload size limit (default: 10MB)
- [ ] Custom upload/data directories if needed

### ✅ System Requirements

#### Server Specifications
- [ ] Node.js 18.0+ installed
- [ ] npm 8.0+ installed
- [ ] Minimum 2GB RAM available
- [ ] Minimum 10GB disk space available
- [ ] Network connectivity to OpenAI API
- [ ] Network connectivity to Slack API

#### System Dependencies
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] nginx installed and configured (for reverse proxy)
- [ ] SSL certificate obtained and configured
- [ ] Firewall configured (ports 80, 443 open)

### ✅ Application Setup

#### Code and Dependencies
- [ ] Latest Scout code deployed
- [ ] `npm ci --production` completed successfully
- [ ] All required directories created (`uploads/`, `data/`, `logs/`)
- [ ] Proper file permissions set (scout user owns files)
- [ ] Configuration validated (`npm run validate`)

#### File Structure Verification
```
scout/
├── src/               ✅ Source code
├── public/            ✅ Web interface
├── uploads/           ✅ File storage (writable)
├── data/              ✅ Metadata storage (writable)  
├── logs/              ✅ Log files (writable)
├── .env               ✅ Environment configuration
├── package.json       ✅ Dependencies
├── ecosystem.config.js ✅ PM2 configuration
└── README.md          ✅ Documentation
```

### ✅ Security Configuration

#### Application Security
- [ ] `.env` file has restricted permissions (600)
- [ ] API keys are not logged or exposed
- [ ] File upload restrictions enforced (.pdf, .csv, .txt, .docx only)
- [ ] File size limits enforced (10MB default)
- [ ] No debug information exposed in production

#### Server Security
- [ ] Non-root user created for Scout (`scout` user)
- [ ] Application runs as non-root user
- [ ] Firewall configured appropriately
- [ ] SSH keys configured (no password auth)
- [ ] Regular security updates scheduled

### ✅ Integration Testing

#### OpenAI Integration
- [ ] API key valid and has credits
- [ ] Assistant created successfully
- [ ] File upload to OpenAI working
- [ ] Query processing working
- [ ] Response generation working
- [ ] Error handling working (invalid queries, API failures)

#### Slack Integration  
- [ ] Bot installed in workspace
- [ ] Socket Mode enabled and connected
- [ ] `@scout` mentions working in channels
- [ ] Direct messages working
- [ ] Enhanced formatting displaying correctly
- [ ] Help commands working
- [ ] Error messages user-friendly

#### Web Interface
- [ ] Web interface loads at configured URL
- [ ] File upload form working
- [ ] File type validation working
- [ ] File size validation working
- [ ] Upload progress feedback working
- [ ] Success/error messages clear

## 🚀 Deployment Steps

### Step 1: Server Preparation
- [ ] Create `scout` user account
- [ ] Install Node.js, npm, PM2, nginx
- [ ] Configure firewall and security settings
- [ ] Obtain and configure SSL certificate

### Step 2: Application Deployment
- [ ] Clone/copy Scout code to server
- [ ] Install production dependencies
- [ ] Configure `.env` file with production values
- [ ] Set proper file permissions
- [ ] Create required directories

### Step 3: Process Management
- [ ] Configure PM2 with `ecosystem.config.js`
- [ ] Start applications with PM2
- [ ] Save PM2 configuration
- [ ] Configure PM2 auto-startup
- [ ] Verify processes running correctly

### Step 4: Reverse Proxy Setup
- [ ] Configure nginx virtual host
- [ ] Set up SSL/TLS termination
- [ ] Configure proxy headers
- [ ] Set client_max_body_size for file uploads
- [ ] Test nginx configuration
- [ ] Reload nginx configuration

### Step 5: Monitoring Setup
- [ ] Configure log rotation
- [ ] Set up health check monitoring
- [ ] Configure backup procedures
- [ ] Set up alerting (optional)
- [ ] Document monitoring procedures

## 🔍 Post-Deployment Verification

### ✅ Functional Testing

#### Health Checks
- [ ] `curl https://your-domain.com/health` returns `{"status":"ok"}`
- [ ] Server responds within 2 seconds
- [ ] SSL certificate valid and working
- [ ] No SSL/TLS warnings in browser

#### Web Interface Testing
- [ ] Upload form loads correctly
- [ ] Can upload each supported file type (.pdf, .csv, .txt, .docx)
- [ ] File validation working (rejects unsupported types)
- [ ] Size validation working (rejects files > 10MB)
- [ ] Success messages display correctly
- [ ] Files stored in `uploads/` directory
- [ ] Metadata saved to `data/files.json`

#### API Testing
- [ ] `/query` endpoint accepts POST requests
- [ ] Valid queries return formatted responses
- [ ] Invalid queries return appropriate errors
- [ ] Response includes both basic and enhanced formatting
- [ ] OpenAI integration working (or mock responses if not configured)

#### Slack Integration Testing
- [ ] Bot appears online in workspace
- [ ] `@scout help` displays help message
- [ ] `@scout test query` returns formatted response
- [ ] Direct messages to bot work
- [ ] Response formatting appears correctly
- [ ] Error messages are user-friendly
- [ ] Bot responds in reasonable time (< 10 seconds)

### ✅ Performance Testing

#### Load Testing
- [ ] Server handles concurrent requests
- [ ] File uploads work under load
- [ ] Response times acceptable (< 5 seconds for queries)
- [ ] Memory usage stable under load
- [ ] No memory leaks detected

#### Resource Monitoring
- [ ] CPU usage reasonable (< 80% average)
- [ ] Memory usage stable (< 1GB per process)
- [ ] Disk space sufficient (monitor `uploads/` growth)
- [ ] Network connectivity stable

### ✅ Error Handling Verification

#### Application Errors
- [ ] Invalid file uploads handled gracefully
- [ ] OpenAI API failures handled gracefully
- [ ] Slack API failures handled gracefully
- [ ] Network timeouts handled appropriately
- [ ] Invalid queries return helpful messages

#### System Errors
- [ ] Process crashes restart automatically (PM2)
- [ ] nginx handles backend failures gracefully
- [ ] SSL certificate renewal working
- [ ] Log rotation working correctly
- [ ] Disk space monitoring in place

## 🔄 Ongoing Maintenance

### ✅ Regular Tasks

#### Daily Monitoring
- [ ] Check application logs for errors
- [ ] Verify health check endpoints
- [ ] Monitor disk space usage
- [ ] Check PM2 process status

#### Weekly Tasks
- [ ] Review upload volume and storage growth
- [ ] Check SSL certificate expiration
- [ ] Review system resource usage
- [ ] Update security patches as needed

#### Monthly Tasks
- [ ] Backup configuration and data
- [ ] Review and rotate log files
- [ ] Update dependencies (security patches)
- [ ] Review performance metrics

## 📞 Support Information

### Emergency Contacts
- Development Team: [contact info]
- System Administrator: [contact info]
- OpenAI Support: [account info]
- Slack Admin: [workspace admin]

### Key Commands
```bash
# Check application status
pm2 status
npm run health

# View logs
pm2 logs
tail -f /var/log/nginx/error.log

# Restart applications
pm2 restart all
sudo systemctl reload nginx

# Check system resources
htop
df -h
free -h
```

### Documentation Links
- [Setup Guide](./SETUP.md)
- [User Guide](./USER_GUIDE.md)
- [API Documentation](./API_DOCS.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**✅ Production Deployment Complete!**

Once all items in this checklist are verified, Scout is ready for production use. Keep this checklist for reference during future deployments and maintenance.