import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';

export class MessageController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // 发送消息
  async sendMessage(req: Request, res: Response) {
    const { sender, receiver, content } = req.body;

    if (!sender || !receiver || !content) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    try {
      const [result] = await this.pool.query(
        'INSERT INTO messages (sender, receiver, content) VALUES (?, ?, ?)',
        [sender, receiver, content]
      );
      res.status(201).json({ message: '消息发送成功', id: (result as any).insertId });
    } catch (error: any) {
      console.error('发送消息时发生错误:', error);
      res.status(500).json({ error: '发送消息时发生错误', details: error.message });
    }
  }

  // 获取消息
  async getMessages(req: Request, res: Response) {
    const { user } = req.query;

    if (!user) {
      return res.status(400).json({ error: '缺少用户参数' });
    }

    try {
      const [rows] = await this.pool.query(
        'SELECT * FROM messages WHERE sender = ? OR receiver = ? ORDER BY timestamp DESC',
        [user, user]
      );
      res.json(rows);
    } catch (error: any) {
      console.error('获取消息时发生错误:', error);
      res.status(500).json({ error: '获取消息时发生错误', details: error.message });
    }
  }
}

// 新增：创建路由处理函数
export function createMessageRoutes(controller: MessageController) {
  return {
    sendMessage: (req: Request, res: Response) => controller.sendMessage(req, res),
    getMessages: (req: Request, res: Response) => controller.getMessages(req, res)
  };
}