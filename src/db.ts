import mysql from 'mysql2/promise';
import { dbConfig } from './config';
// 创建数据库连接池
const pool = mysql.createPool({
  ...dbConfig,
  password: String(dbConfig.password)
});
// 检查数据库连接
export const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

export default pool;