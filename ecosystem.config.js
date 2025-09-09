module.exports = {
  apps: [{
    name: 'wPanel',
    script: 'npm',
    args: 'run dev',
    cwd: '/docker/wpanel',
    env_file: '.env',
    env: {
      NODE_ENV: 'development'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/wPanel-error.log',
    out_file: '/root/.pm2/logs/wPanel-out.log',
    log_file: '/root/.pm2/logs/wPanel-combined.log',
    time: true
  }]
};
