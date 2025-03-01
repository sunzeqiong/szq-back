import dotenv from 'dotenv';
dotenv.config();
// 数据库设置
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'note',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};
export const jwtConfig={
  
}