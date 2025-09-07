#!/bin/bash

# Scout Production Monitoring Script
# Run this script to check the health of Scout services

echo "🔍 Scout System Monitor - $(date)"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "✅ ${GREEN}$2${NC}"
    else
        echo -e "❌ ${RED}$2${NC}"
    fi
}

print_warning() {
    echo -e "⚠️  ${YELLOW}$1${NC}"
}

# Check if PM2 is running
echo "📊 Process Status:"
echo "------------------"

if command -v pm2 &> /dev/null; then
    pm2 list | grep -E "(scout-server|scout-slack-bot)"
    SERVER_STATUS=$(pm2 jlist | jq '.[] | select(.name=="scout-server") | .pm2_env.status' 2>/dev/null)
    SLACK_STATUS=$(pm2 jlist | jq '.[] | select(.name=="scout-slack-bot") | .pm2_env.status' 2>/dev/null)
    
    if [ "$SERVER_STATUS" = '"online"' ]; then
        print_status 0 "Scout Server is running"
    else
        print_status 1 "Scout Server is not running"
    fi
    
    if [ "$SLACK_STATUS" = '"online"' ]; then
        print_status 0 "Scout Slack Bot is running"
    else
        print_status 1 "Scout Slack Bot is not running or not configured"
    fi
else
    print_warning "PM2 not installed - checking node processes manually"
    if pgrep -f "node.*src/server.js" > /dev/null; then
        print_status 0 "Scout Server process found"
    else
        print_status 1 "Scout Server process not found"
    fi
    
    if pgrep -f "node.*slack-bot.js" > /dev/null; then
        print_status 0 "Scout Slack Bot process found"
    else
        print_status 1 "Scout Slack Bot process not found"
    fi
fi

# Check web server health
echo ""
echo "🌐 Web Server Health:"
echo "--------------------"

PORT=${PORT:-3000}
if curl -f -s http://localhost:$PORT/health > /dev/null; then
    print_status 0 "Web server responding on port $PORT"
    RESPONSE=$(curl -s http://localhost:$PORT/health)
    echo "   Response: $RESPONSE"
else
    print_status 1 "Web server not responding on port $PORT"
fi

# Check disk space
echo ""
echo "💾 Disk Usage:"
echo "-------------"

UPLOAD_SIZE=$(du -sh uploads/ 2>/dev/null | cut -f1)
DATA_SIZE=$(du -sh data/ 2>/dev/null | cut -f1)
LOG_SIZE=$(du -sh logs/ 2>/dev/null | cut -f1)

echo "   Uploads directory: ${UPLOAD_SIZE:-N/A}"
echo "   Data directory: ${DATA_SIZE:-N/A}"
echo "   Logs directory: ${LOG_SIZE:-N/A}"

# Check available disk space
DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    print_status 1 "Disk usage is ${DISK_USAGE}% - consider cleanup"
elif [ "$DISK_USAGE" -gt 70 ]; then
    print_warning "Disk usage is ${DISK_USAGE}% - monitor closely"
else
    print_status 0 "Disk usage is ${DISK_USAGE}% - healthy"
fi

# Check memory usage
echo ""
echo "🧠 Memory Usage:"
echo "---------------"

if command -v ps &> /dev/null; then
    SERVER_PID=$(pgrep -f "node.*src/server.js" | head -1)
    SLACK_PID=$(pgrep -f "node.*slack-bot.js" | head -1)
    
    if [ ! -z "$SERVER_PID" ]; then
        SERVER_MEM=$(ps -p $SERVER_PID -o %mem --no-headers 2>/dev/null | tr -d ' ')
        echo "   Scout Server: ${SERVER_MEM}% memory"
    fi
    
    if [ ! -z "$SLACK_PID" ]; then
        SLACK_MEM=$(ps -p $SLACK_PID -o %mem --no-headers 2>/dev/null | tr -d ' ')
        echo "   Scout Slack Bot: ${SLACK_MEM}% memory"
    fi
fi

# Check log files for recent errors
echo ""
echo "📝 Recent Log Analysis:"
echo "----------------------"

if [ -f "logs/error.log" ]; then
    ERROR_COUNT=$(tail -100 logs/error.log 2>/dev/null | grep -i error | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_warning "$ERROR_COUNT recent errors found in logs"
        echo "   Latest errors:"
        tail -5 logs/error.log 2>/dev/null | grep -i error | sed 's/^/   /'
    else
        print_status 0 "No recent errors in logs"
    fi
else
    print_warning "Error log file not found"
fi

# Check configuration
echo ""
echo "⚙️  Configuration:"
echo "------------------"

if [ -f ".env" ]; then
    print_status 0 ".env file exists"
    
    # Check required variables (without showing values)
    if grep -q "OPENAI_API_KEY" .env 2>/dev/null; then
        print_status 0 "OPENAI_API_KEY configured"
    else
        print_status 1 "OPENAI_API_KEY not configured"
    fi
    
    if grep -q "OPENAI_ASSISTANT_ID" .env 2>/dev/null; then
        print_status 0 "OPENAI_ASSISTANT_ID configured"
    else
        print_status 1 "OPENAI_ASSISTANT_ID not configured"
    fi
    
    # Check Slack configuration
    if grep -q "SLACK_BOT_TOKEN" .env 2>/dev/null; then
        print_status 0 "SLACK_BOT_TOKEN configured"
    else
        print_warning "SLACK_BOT_TOKEN not configured (Slack bot disabled)"
    fi
    
else
    print_status 1 ".env file missing"
fi

# Check network connectivity
echo ""
echo "🌍 Network Connectivity:"
echo "------------------------"

if curl -s --max-time 5 https://api.openai.com > /dev/null; then
    print_status 0 "OpenAI API reachable"
else
    print_status 1 "OpenAI API not reachable"
fi

if curl -s --max-time 5 https://slack.com > /dev/null; then
    print_status 0 "Slack API reachable"
else
    print_status 1 "Slack API not reachable"
fi

echo ""
echo "=================================="
echo "Monitor completed at $(date)"
echo "Run 'npm run pm2:logs' to view detailed logs"
echo "Run 'npm run health' to test web server"