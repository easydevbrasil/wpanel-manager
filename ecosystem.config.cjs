module.exports = {
  apps: [
    {
      name: 'wPanel',
      script: 'npm',
      args: 'run dev:node',
      cwd: '/docker/wpanel',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env_file: '/docker/.env',
      env: {
        PORT: 8000,
        NODE_ENV: 'development'
      },
      log_file: './logs/wpanel.log',
      out_file: './logs/wpanel-out.log',
      error_file: './logs/wpanel-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      autorestart: true,
      kill_timeout: 5000
    }
  ]
};
