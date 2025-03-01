import express from 'express';
import { checkDatabaseConnection } from './db';
import routes from './routes';
import { corsMiddleware, errorHandler, notFoundHandler } from './middleware';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// 中间件
app.use(express.json());
app.use(corsMiddleware);
// API 路由
app.use('/api', routes);
// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);
// 服务器启动
app.listen(port, async () => {
  console.log(`服务器正在尝试启动...`);
  try {
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      console.log(`服务器成功启动，运行在 http://localhost:${port}`);
    } else {
      console.log(`服务器启动，但数据库连接失败。运行在 http://localhost:${port}`);
    }
  } catch (error) {
    console.error('服务器启动过程中发生错误:', error);
  }
});