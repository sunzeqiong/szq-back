import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';

export class UserController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getUser(req: Request, res: Response) {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: '缺少用户名参数' });
    }

    try {
      const [rows] = await this.pool.query('SELECT * FROM `user` WHERE username = ?', [username]);
      
      if (Array.isArray(rows) && rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).json({ error: '未找到该用户' });
      }
    } catch (error: any) {
      console.error('获取用户数据时发生错误:', error);
      res.status(500).json({ error: '获取用户数据时发生错误', details: error.message });
    }
  }
}

export function createUserRoutes(controller: UserController) {
  return {
    getUser: (req: Request, res: Response) => controller.getUser(req, res)
  };
}