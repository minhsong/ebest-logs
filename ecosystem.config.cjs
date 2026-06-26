/**
 * PM2 — production (VPS)
 *
 *   cd ebest-activity-log
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *
 * Bind 127.0.0.1 — chỉ CRM proxy gọi nội bộ.
 */
module.exports = {
  apps: [
    {
      name: 'ebest-activity-log',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
        HOST: '127.0.0.1',
      },
    },
  ],
};
