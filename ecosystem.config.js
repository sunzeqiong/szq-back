module.exports = {
  apps: [{
    name: 'szq-heating-system',
    script: 'dist/index.js', // 编译后的入口文件
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_USER: 'your_db_user',
      DB_PASSWORD: 'your_db_password',
      DB_NAME: 'heating_system',
      JWT_SECRET: 'your_jwt_secret'
    }
  }]
};
