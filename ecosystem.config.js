module.exports = {
  apps: [
    {
      // Scout Web Server
      name: 'scout-server',
      script: 'src/server.js',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process Management
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      monitoring: false,
      pmx: true,
      
      // Advanced Settings
      kill_timeout: 5000,
      listen_timeout: 5000,
      wait_ready: true,
      
      // Auto restart on file changes (development only)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'data'],
      
      // Environment variables from .env file
      env_file: '.env'
    },
    {
      // Scout Slack Bot
      name: 'scout-slack-bot',
      script: 'slack-bot.js',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      // Logging
      log_file: './logs/slack-combined.log',
      out_file: './logs/slack-out.log',
      error_file: './logs/slack-error.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process Management
      max_memory_restart: '512M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      monitoring: false,
      pmx: true,
      
      // Advanced Settings
      kill_timeout: 5000,
      listen_timeout: 5000,
      
      // Auto restart on file changes (development only)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'data'],
      
      // Environment variables from .env file
      env_file: '.env'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'scout',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/yourorg/scout.git',
      path: '/home/scout/scout',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};