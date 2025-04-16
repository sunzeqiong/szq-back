import { Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class MessageController {
  constructor(private readonly pool: Pool) {}

  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { content, roomId } = req.body;
      const userId = req.user?.userId;

      if (!content || !roomId) {
        return sendError(res, '消息内容和房间ID不能为空', 400);
      }

      // 插入消息
      const [result] = await this.pool.query(
        'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
        [roomId, userId, content]
      );

      const messageId = (result as any).insertId;

      // 查询完整的消息信息
      const [messages] = await this.pool.query<RowDataPacket[]>(
        `SELECT 
          m.*,
          u.nick_name as sender_name,
          TRUE as is_sender,
          DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as formatted_time
         FROM messages m 
         JOIN user u ON m.user_id = u.id 
         WHERE m.id = ?`,
        [messageId]
      );

      return sendSuccess(res, messages[0], '消息发送成功');
    } catch (error) {
      console.error('发送消息失败:', error);
      return sendError(res, '发送消息失败');
    }
  }

  async getMessages(req: AuthRequest, res: Response) {
    try {
      console.log('获取消息:', req.query);
      const { roomId } = req.query;
      const userId = req.user?.userId;
      console.log('roomId:', roomId);
      if (!roomId) {
        return sendError(res, '需要提供房间ID', 400);
      }

      // 验证用户是否在房间中
      const [isMember] = await this.pool.query(
        'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );

      if (!Array.isArray(isMember) || isMember.length === 0) {
        return sendError(res, '您不是该聊天室的成员', 403);
      }

      // 获取消息记录
      const [messages] = await this.pool.query(
        `SELECT 
          m.*,
          u.nick_name as sender_name,
          u.id as sender_id,
          CASE 
            WHEN m.user_id = ? THEN true
            ELSE false
          END as is_sender,
          DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as formatted_time
         FROM messages m 
         JOIN user u ON m.user_id = u.id 
         WHERE m.room_id = ?
         ORDER BY m.created_at`,
        [userId, roomId]
      );

      // 获取聊天室信息
      const [roomInfo] = await this.pool.query<RowDataPacket[]>(
        `SELECT 
          r.*,
          u.nick_name as target_username
         FROM chat_rooms r
         LEFT JOIN room_members rm ON r.id = rm.room_id
         LEFT JOIN user u ON rm.user_id = u.id
         WHERE r.id = ? AND u.id != ?
         LIMIT 1`,
        [roomId, userId]
      );

      // 更新消息已读状态
      await this.pool.query(
        `UPDATE messages 
         SET status = 'read' 
         WHERE room_id = ? AND user_id != ? AND status = 'sent'`,
        [roomId, userId]
      );

      return sendSuccess(res, {
        messages,
        currentUserId: userId,
        roomInfo: roomInfo[0]
      }, '获取消息成功');
    } catch (error) {
      console.error('获取消息失败:', error);
      return sendError(res, '获取消息失败');
    }
  }

  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.userId;

      const [result] = await this.pool.query(
        'DELETE FROM messages WHERE id = ? AND user_id = ?',
        [messageId, userId]
      );

      if ((result as any).affectedRows === 0) {
        return sendError(res, '消息不存在或无权删除', 404);
      }

      return sendSuccess(res, null, '消息删除成功');
    } catch (error) {
      console.error('删除消息失败:', error);
      return sendError(res, '删除消息失败');
    }
  }
}

// 修改导出方式
export const messageRoutes = (pool: Pool) => {
  const controller = new MessageController(pool);
  return {
    sendMessage: (req: AuthRequest, res: Response) => controller.sendMessage(req, res),
    getMessages: (req: AuthRequest, res: Response) => controller.getMessages(req, res),
    deleteMessage: (req: AuthRequest, res: Response) => controller.deleteMessage(req, res)
  };
};
