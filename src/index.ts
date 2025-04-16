import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { checkDatabaseConnection } from './db';
import routes from './routes';
import { corsMiddleware, errorHandler, notFoundHandler } from './middleware';
import { initializeWebSocket } from './websocket/chatSocket';

// 加载环境变量
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// 创建 HTTP 服务器
const httpServer = createServer(app);

// 初始化 WebSocket
const io = initializeWebSocket(httpServer);

// 中间件设置
app.use(express.json());
app.use(corsMiddleware);

// API 路由 - 添加 /api 前缀
app.use('/api', routes);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
httpServer.listen(port, async () => {
  console.log(`正在启动服务器...`);
  try {
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      console.log(`服务器启动成功:`);
      console.log(`- HTTP API: http://localhost:${port}/api`);
      console.log(`- WebSocket: ws://localhost:${port}/ws`);
      console.log('数据库连接正常');
    } else {
      console.error('服务器启动，但数据库连接失败');
    }
  } catch (error) {
    console.error('服务器启动过程中发生错误:', error);
  }
});

// 处理进程退出
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  httpServer.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});