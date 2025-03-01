import { Request, Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { AuthRequest } from '../middleware/auth';

export interface Message extends RowDataPacket {
  id: number;
  userId: number;
  content: string;
  created_at: Date;
}

export class MessageController {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // 发送消息
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!content) {
        return res.status(400).json({ error: '消息内容不能为空' });
      }

      const [result] = await this.pool.query(
        'INSERT INTO messages (user_id, content) VALUES (?, ?)',
        [userId, content]
      );

      res.status(201).json({
        message: '消息发送成功',
        messageId: (result as any).insertId
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      res.status(500).json({ error: '发送消息失败' });
    }
  }

  // 获取消息列表
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const [messages] = await this.pool.query<Message[]>(
        `SELECT m.*, u.username 
         FROM messages m 
         JOIN user u ON m.user_id = u.id 
         ORDER BY m.created_at DESC 
         LIMIT 50`
      );

      res.json(messages);
    } catch (error) {
      console.error('获取消息失败:', error);
      res.status(500).json({ error: '获取消息失败' });
    }
  }

  // 删除消息
  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.userId;

      const [result] = await this.pool.query(
        'DELETE FROM messages WHERE id = ? AND user_id = ?',
        [messageId, userId]
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: '消息不存在或无权删除' });
      }

      res.json({ message: '消息删除成功' });
    } catch (error) {
      console.error('删除消息失败:', error);
      res.status(500).json({ error: '删除消息失败' });
    }
  }
}

export const createMessageRoutes = (controller: MessageController) => ({
  sendMessage: controller.sendMessage.bind(controller),
  getMessages: controller.getMessages.bind(controller),
  deleteMessage: controller.deleteMessage.bind(controller)
});