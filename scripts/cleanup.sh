#!/bin/bash

# Scout Log Cleanup Script
# Safely rotates and compresses old log files

echo "🧹 Scout Log Cleanup - $(date)"
echo "==============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Check if logs directory exists
if [ ! -d "logs" ]; then
    echo "No logs directory found, creating it..."
    mkdir -p logs
    print_status 0 "Created logs directory"
    exit 0
fi

# Get current date for archiving
DATE=$(date +%Y%m%d-%H%M%S)
ARCHIVE_DIR="logs/archive"

# Create archive directory if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

# Function to rotate log file
rotate_log() {
    local log_file="$1"
    local max_size_mb="$2"
    
    if [ -f "$log_file" ]; then
        # Get file size in MB
        local size_mb=$(du -m "$log_file" | cut -f1)
        
        if [ "$size_mb" -gt "$max_size_mb" ]; then
            echo "Rotating $log_file (${size_mb}MB > ${max_size_mb}MB limit)"
            
            # Compress and move to archive
            local filename=$(basename "$log_file")
            local archive_name="${filename%.log}-${DATE}.log.gz"
            
            gzip -c "$log_file" > "$ARCHIVE_DIR/$archive_name"
            
            if [ $? -eq 0 ]; then
                # Clear the original file (keep it for PM2/app to continue writing)
                > "$log_file"
                print_status 0 "Rotated $log_file -> $archive_name"
            else
                print_status 1 "Failed to rotate $log_file"
            fi
        else
            echo "Skipping $log_file (${size_mb}MB < ${max_size_mb}MB limit)"
        fi
    fi
}

# Function to clean old archives
clean_old_archives() {
    local days="$1"
    echo ""
    echo "🗂️  Cleaning archives older than $days days..."
    
    if [ -d "$ARCHIVE_DIR" ]; then
        local count=$(find "$ARCHIVE_DIR" -name "*.log.gz" -type f -mtime +$days | wc -l)
        
        if [ "$count" -gt 0 ]; then
            find "$ARCHIVE_DIR" -name "*.log.gz" -type f -mtime +$days -delete
            print_status 0 "Removed $count old archive files"
        else
            print_status 0 "No old archives to clean"
        fi
    fi
}

# Function to show disk usage
show_disk_usage() {
    echo ""
    echo "💾 Current Disk Usage:"
    echo "---------------------"
    
    if [ -d "logs" ]; then
        echo "   Total logs: $(du -sh logs | cut -f1)"
        
        if [ -d "$ARCHIVE_DIR" ]; then
            echo "   Archives: $(du -sh $ARCHIVE_DIR | cut -f1)"
        fi
        
        echo "   Current logs:"
        for log in logs/*.log; do
            if [ -f "$log" ]; then
                echo "     $(basename "$log"): $(du -sh "$log" | cut -f1)"
            fi
        done
    fi
    
    echo "   Uploads: $(du -sh uploads 2>/dev/null | cut -f1 || echo 'N/A')"
    echo "   Data: $(du -sh data 2>/dev/null | cut -f1 || echo 'N/A')"
}

# Main cleanup process
echo ""
echo "📋 Log Rotation (files > 50MB will be rotated):"
echo "-----------------------------------------------"

# Rotate main application logs (50MB limit)
rotate_log "logs/combined.log" 50
rotate_log "logs/out.log" 50
rotate_log "logs/error.log" 50

# Rotate Slack bot logs (25MB limit)
rotate_log "logs/slack-combined.log" 25
rotate_log "logs/slack-out.log" 25
rotate_log "logs/slack-error.log" 25

# Clean old archives (keep for 30 days)
clean_old_archives 30

# Clean old uploaded files if needed
echo ""
echo "📁 Upload Directory Cleanup:"
echo "---------------------------"

if [ -d "uploads" ]; then
    UPLOAD_SIZE=$(du -sm uploads | cut -f1)
    
    if [ "$UPLOAD_SIZE" -gt 1000 ]; then
        print_warning "Upload directory is ${UPLOAD_SIZE}MB - consider manual cleanup"
        echo "   Files older than 90 days:"
        find uploads -type f -mtime +90 -ls 2>/dev/null | head -5
        
        if [ $(find uploads -type f -mtime +90 | wc -l) -gt 0 ]; then
            echo "   Run 'find uploads -type f -mtime +90 -delete' to remove old files"
        fi
    else
        print_status 0 "Upload directory size is reasonable (${UPLOAD_SIZE}MB)"
    fi
else
    print_warning "Upload directory not found"
fi

# Show final disk usage
show_disk_usage

echo ""
echo "==============================="
echo "Cleanup completed at $(date)"
echo ""
echo "💡 Tips:"
echo "  - Run this script weekly or monthly"
echo "  - Set up a cron job for automatic cleanup:"
echo "    0 2 * * 0 /path/to/scout/scripts/cleanup.sh"
echo "  - Monitor disk usage with ./scripts/monitor.sh"