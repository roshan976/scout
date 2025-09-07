# Scout Deployment Guide

This guide covers production deployment options for Scout, from simple server deployments to containerized environments.

## 🎯 Deployment Overview

Scout can be deployed in several ways:
- **Single Server**: Traditional server deployment with PM2
- **Docker**: Containerized deployment
- **Cloud Platforms**: AWS, Azure, GCP, or similar
- **Kubernetes**: Scalable container orchestration

## 🖥️ Single Server Deployment

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+ installed
- nginx for reverse proxy
- SSL certificate (Let's Encrypt recommended)
- Domain name pointing to server

### Step 1: Server Preparation

#### Install Node.js
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x+
npm --version   # Should be 8.x+
```

#### Install PM2 Process Manager
```bash
sudo npm install -g pm2
```

#### Create Application User
```bash
sudo useradd -m -s /bin/bash scout
sudo usermod -aG sudo scout
```

### Step 2: Application Deployment

#### Clone and Setup Application
```bash
# Switch to scout user
sudo su - scout

# Clone repository
git clone <your-repository-url> /home/scout/scout
cd /home/scout/scout

# Install dependencies
npm install --production

# Create required directories
mkdir -p uploads data logs

# Set permissions
chmod 755 uploads data
chmod 644 package.json
```

#### Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Production .env Example:**
```bash
NODE_ENV=production
PORT=3000

# OpenAI Configuration
OPENAI_API_KEY=sk-prod-your-actual-key
OPENAI_ASSISTANT_ID=asst-prod-your-assistant

# Slack Configuration  
SLACK_BOT_TOKEN=xoxb-prod-your-token
SLACK_SIGNING_SECRET=your-prod-signing-secret
SLACK_APP_TOKEN=xapp-prod-your-app-token

# Production settings
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
```

### Step 3: Process Management

#### Create PM2 Ecosystem File
```bash
# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'scout-server',
      script: 'src/server.js',
      cwd: '/home/scout/scout',
      user: 'scout',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: '/home/scout/scout/logs/combined.log',
      out_file: '/home/scout/scout/logs/out.log',
      error_file: '/home/scout/scout/logs/error.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 5000
    },
    {
      name: 'scout-slack-bot',
      script: 'slack-bot.js',
      cwd: '/home/scout/scout',
      user: 'scout',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: '/home/scout/scout/logs/slack-combined.log',
      out_file: '/home/scout/scout/logs/slack-out.log',
      error_file: '/home/scout/scout/logs/slack-error.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 5000
    }
  ]
};
EOF
```

#### Start Applications
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
# Follow the instructions to enable auto-start
```

### Step 4: Nginx Reverse Proxy

#### Install Nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

#### Configure Nginx
```bash
# Create configuration file
sudo cat > /etc/nginx/sites-available/scout << 'EOF'
server {
    listen 80;
    server_name scout.yourcompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name scout.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/scout.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scout.yourcompany.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    client_max_body_size 11M;  # Slightly larger than Scout's 10MB limit
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/scout /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 5: SSL Certificate

#### Install Certbot
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

#### Obtain Certificate
```bash
sudo certbot --nginx -d scout.yourcompany.com
```

#### Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 6: Monitoring and Logging

#### Setup Log Rotation
```bash
sudo cat > /etc/logrotate.d/scout << 'EOF'
/home/scout/scout/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 scout scout
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

#### System Monitoring
```bash
# Create monitoring script
cat > /home/scout/monitor.sh << 'EOF'
#!/bin/bash
# Scout monitoring script

# Check if PM2 processes are running
pm2 ping >/dev/null
if [ $? -ne 0 ]; then
    echo "PM2 is not running, restarting..."
    pm2 resurrect
fi

# Check if applications are responding
curl -f http://localhost:3000/health >/dev/null
if [ $? -ne 0 ]; then
    echo "Scout server not responding, restarting..."
    pm2 restart scout-server
fi

# Check disk space
disk_usage=$(df /home/scout/scout/uploads | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $disk_usage -gt 85 ]; then
    echo "Warning: Disk usage is ${disk_usage}%"
fi
EOF

chmod +x /home/scout/monitor.sh

# Add to crontab
crontab -e
# Add this line:
*/5 * * * * /home/scout/monitor.sh >> /home/scout/monitor.log 2>&1
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S scout -u 1001

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads data logs && \
    chown -R scout:nodejs /app

# Switch to non-root user
USER scout

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  scout-server:
    build: .
    container_name: scout-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  scout-slack-bot:
    build: .
    container_name: scout-slack-bot  
    restart: unless-stopped
    command: ["node", "slack-bot.js"]
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    depends_on:
      - scout-server

  nginx:
    image: nginx:alpine
    container_name: scout-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - scout-server
```

### Build and Deploy
```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☁️ Cloud Platform Deployment

### AWS EC2 Deployment

#### Launch EC2 Instance
1. **Instance Type**: t3.small or larger
2. **AMI**: Ubuntu 20.04 LTS
3. **Storage**: 20GB+ EBS volume
4. **Security Groups**: 
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere

#### User Data Script
```bash
#!/bin/bash
apt-get update
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx
npm install -g pm2

# Create scout user
useradd -m -s /bin/bash scout
mkdir -p /home/scout/scout
chown scout:scout /home/scout/scout

# Clone and setup application (you'll need to customize this)
# git clone <your-repo> /home/scout/scout
# Follow setup steps from single server deployment
```

### Azure App Service

#### Create App Service
```bash
# Using Azure CLI
az webapp create \
  --resource-group scout-rg \
  --plan scout-plan \
  --name scout-app \
  --runtime "NODE|18-lts"

# Configure app settings
az webapp config appsettings set \
  --resource-group scout-rg \
  --name scout-app \
  --settings \
    NODE_ENV=production \
    OPENAI_API_KEY="your-key" \
    SLACK_BOT_TOKEN="your-token"

# Deploy from Git
az webapp deployment source config \
  --resource-group scout-rg \
  --name scout-app \
  --repo-url https://github.com/yourorg/scout \
  --branch main
```

### Google Cloud Platform

#### Deploy to Cloud Run
```bash
# Build and deploy
gcloud run deploy scout \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --memory 1Gi \
  --cpu 1
```

## 🔍 Production Monitoring

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs scout-server --lines 100

# Check resource usage
pm2 show scout-server
```

### System Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check application logs
tail -f /home/scout/scout/logs/combined.log
```

### Health Checks
```bash
# Application health
curl https://scout.yourcompany.com/health

# Detailed status
curl -s https://scout.yourcompany.com/health | jq '.'

# Response time check
time curl -s https://scout.yourcompany.com/health
```

## 🔄 Backup and Recovery

### Backup Strategy
```bash
#!/bin/bash
# backup-scout.sh

BACKUP_DIR="/backups/scout"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/scout/scout/uploads/

# Backup data
cp /home/scout/scout/data/files.json $BACKUP_DIR/files_$DATE.json

# Backup configuration
cp /home/scout/scout/.env $BACKUP_DIR/env_$DATE.backup

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*" -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Recovery Process
```bash
# Stop services
pm2 stop all

# Restore uploads
tar -xzf /backups/scout/uploads_YYYYMMDD_HHMMSS.tar.gz -C /

# Restore data
cp /backups/scout/files_YYYYMMDD_HHMMSS.json /home/scout/scout/data/files.json

# Restore configuration
cp /backups/scout/env_YYYYMMDD_HHMMSS.backup /home/scout/scout/.env

# Set permissions
chown -R scout:scout /home/scout/scout

# Start services
pm2 start all
```

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs scout-server

# Check configuration
node -e "console.log(require('./src/config.js'))"

# Test dependencies
npm ls
```

#### High Memory Usage
```bash
# Check process memory
pm2 show scout-server

# Restart if needed
pm2 restart scout-server

# Monitor with htop
htop
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Check nginx config
sudo nginx -t
```

## 📞 Support

For deployment issues:
1. Check application logs first
2. Verify all environment variables are set
3. Test individual components (server, Slack bot, nginx)
4. Review system resources and disk space
5. Contact development team with specific error details

---

**Ready for production?** Follow this guide step-by-step for a robust Scout deployment!