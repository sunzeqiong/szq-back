import express, { Express, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { MessageController, createMessageRoutes } from './messageController';
import { UserController, createUserRoutes } from './userController';

const app: Express = express();
const port: number = 3000;

app.use(express.json());

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 123456 ,
  database: 'note',
  port: 3306
};

// 创建数据库连接池
const pool = mysql.createPool({
  ...dbConfig,
  password: String(dbConfig.password)
});

// 检查数据库连接
async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}


// 创建控制器实例
const messageController = new MessageController(pool);
const userController = new UserController(pool);

// 获取路由处理函数
const messageRoutes = createMessageRoutes(messageController);
const userRoutes = createUserRoutes(userController);

// 设置路由
app.post('/api/messages', messageRoutes.sendMessage);
app.get('/api/messages', messageRoutes.getMessages);
app.get('/api/user', userRoutes.getUser);

app.get('/', (req: Request, res: Response) => {
  console.log('收到根路径请求');
  res.send('欢迎来到我的 TypeScript 后端服务!');
});

// 添加一个测试路由
app.get('/api/test', (req: Request, res: Response) => {
  console.log('收到 /api/test 请求');
  res.json({ message: 'Test route is working' });
});

// 错误处理中间件
app.use((req: Request, res: Response) => {
  console.log(`收到未匹配的请求: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found' });
});

// 修改服务器启动逻辑
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