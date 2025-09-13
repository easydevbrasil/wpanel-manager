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
      env: {
        NODE_ENV: 'development',
        PORT: 8000
      },
      log_file: './logs/wpanel.log',
      out_file: './logs/wpanel-out.log',
      error_file: './logs/wpanel-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 2000
    }
  ]
};
