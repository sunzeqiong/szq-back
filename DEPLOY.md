# 部署指南

## 服务器要求
- Node.js >= 14
- MySQL >= 8.0
- PM2 (用于进程管理)
- Nginx (用于反向代理)

## 部署步骤

### 1. 准备服务器环境
```bash
# 更新系统包
sudo apt update && sudo apt upgrade

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
npm install -p pm2 -g

# 安装 MySQL
sudo apt install mysql-server
```

### 2. 配置 MySQL
```bash
# 登录 MySQL
sudo mysql

# 创建数据库和用户
CREATE DATABASE heating_system;
CREATE USER 'heating_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON heating_system.* TO 'heating_user'@'localhost';
FLUSH PRIVILEGES;

# 导入数据库结构和测试数据
mysql -u heating_user -p heating_system < database/schema.sql
mysql -u heating_user -p heating_system < database/test_data_extended.sql
```

### 3. 部署项目
```bash
# 克隆项目
git clone [your-repository-url]
cd szq-back

# 安装依赖
npm install

# 修改配置
# 编辑 ecosystem.config.js 填入正确的数据库配置和其他环境变量

# 构建和启动
npm run deploy

# 查看运行状态
pm2 status
pm2 logs szq-heating-system
```

### 4. 配置 Nginx

```nginx
# /etc/nginx/sites-available/heating-system
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点配置
sudo ln -s /etc/nginx/sites-available/heating-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 配置 SSL（推荐）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

## 维护命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs szq-heating-system

# 重启应用
pm2 restart szq-heating-system

# 停止应用
pm2 stop szq-heating-system

# 更新部署
git pull
npm install
npm run deploy
```

## 常见问题

1. 如果遇到权限问题：
```bash
sudo chown -R $USER:$USER /var/www/heating-system
```

2. 如果需要修改端口：
- 修改 ecosystem.config.js 中的 PORT
- 更新 Nginx 配置中的 proxy_pass

3. 数据库备份：
```bash
# 创建备份
mysqldump -u heating_user -p heating_system > backup.sql

# 恢复备份
mysql -u heating_user -p heating_system < backup.sql
```
```

</file>

主要部署步骤总结：
1. 准备服务器环境（Node.js、MySQL、PM2、Nginx）
2. 配置数据库
3. 部署后端代码
4. 配置 Nginx 反向代理
5. 配置 SSL 证书（可选但推荐）

安全建议：
1. 使用环境变量存储敏感信息
2. 配置防火墙
3. 定期备份数据库
4. 使用 PM2 进行进程管理
5. 启用 HTTPS
6. 设置适当的文件权限

维护建议：
1. 设置日志轮转
2. 配置监控告警
3. 建立定期备份机制
4. 制定更新策略