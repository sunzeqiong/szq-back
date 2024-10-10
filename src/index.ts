import express, { Express, Request, Response } from 'express';
import mysql from 'mysql2/promise';

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

// 定义 Note 接口
interface Note {
  id: number;
  title: string;
  content: string;
}

app.get('/', (req: Request, res: Response) => {
  console.log('收到根路径请求');
  res.send('欢迎来到我的 TypeScript 后端服务!');
});

app.get('/api/user', async (req: Request, res: Response) => {
  console.log('收到 /api/user 请求');
  const username = req.query.username as string;

  if (!username) {
    return res.status(400).json({ error: '缺少用户名参数' });
  }

  console.log(`查询的用户名: "${username}"`);

  try {
    console.log(`尝试从数据库获取用户 ${username} 的数据`);
    const [rows] = await pool.query('SELECT * FROM `user` WHERE username = ?', [username]);
    console.log('SQL查询:', 'SELECT * FROM `user` WHERE username = ?', [username]);
    console.log('查询结果:', rows);

    if (Array.isArray(rows) && rows.length > 0) {
      res.json(rows[0]);
    } else {
      console.log('未找到用户，返回404');
      res.status(404).json({ error: '未找到该用户' });
    }
  } catch (error: any) {
    console.error('获取用户数据时发生错误:', error);
    res.status(500).json({ error: '获取用户数据时发生错误', details: error.message });
  }
});

// 添加一个测试路由
app.get('/api/test', (req: Request, res: Response) => {
  console.log('收到 /api/test 请求');
  res.json({ message: 'Test route is working' });
});

// 将错误处理中间件移到这里，并添加日志
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