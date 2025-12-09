module.exports = {
  apps: [{
    name: 'frontend-psi-prod',
    script: 'server.js',
    cwd: '/www/wwwroot/app.psifernandacosta.com/front-end/.next/standalone',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: '/root/.pm2/logs/frontend-psi-prod-error.log',
    out_file: '/root/.pm2/logs/frontend-psi-prod-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
}

