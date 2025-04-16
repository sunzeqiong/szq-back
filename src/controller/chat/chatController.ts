import { Response } from 'express';
import { Pool } from 'mysql2/promise';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class ChatController {
  constructor(private readonly pool: Pool) {}

  // 获取用户的所有聊天列表（包括私聊和群聊）
  async getChatList(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      const [chats] = await this.pool.query(
        `SELECT 
          r.*, 
          rm.role,
          CASE 
            WHEN r.room_type = 'private' THEN (
              SELECT username FROM user 
              WHERE id IN (
                SELECT user_id FROM room_members 
                WHERE room_id = r.id AND user_id != ?
              ) LIMIT 1
            )
            ELSE r.name 
          END as display_name,
          (
            SELECT m.content 
            FROM messages m 
            WHERE m.room_id = r.id 
            ORDER BY m.created_at DESC LIMIT 1
          ) as last_message,
          (
            SELECT COUNT(*) 
            FROM messages m 
            WHERE m.room_id = r.id 
            AND m.user_id != ? 
            AND m.status = 'sent'
          ) as unread_count
         FROM chat_rooms r
         JOIN room_members rm ON r.id = rm.room_id
         WHERE rm.user_id = ?
         ORDER BY (
           SELECT created_at 
           FROM messages 
           WHERE room_id = r.id 
           ORDER BY created_at DESC LIMIT 1
         ) DESC`,
        [userId, userId, userId]
      );
      
      return sendSuccess(res, chats, '获取聊天列表成功');
    } catch (error) {
      console.error('获取聊天列表失败:', error);
      return sendError(res, '获取聊天列表失败');
    }
  }

  // 搜索聊天记录
  async searchMessages(req: AuthRequest, res: Response) {
    try {
      const { keyword, roomId } = req.query;
      const userId = req.user?.userId;

      if (!keyword) {
        return sendError(res, '请输入搜索关键词', 400);
      }

      const [messages] = await this.pool.query(
        `SELECT m.*, u.nick_name as sender_name
         FROM messages m
         JOIN user u ON m.user_id = u.id
         JOIN room_members rm ON m.room_id = rm.room_id
         WHERE rm.user_id = ?
         AND m.room_id = ?
         AND m.content LIKE ?
         ORDER BY m.created_at DESC`,
        [userId, roomId, `%${keyword}%`]
      );

      return sendSuccess(res, messages, '搜索消息成功');
    } catch (error) {
      console.error('搜索消息失败:', error);
      return sendError(res, '搜索消息失败');
    }
  }

  // 创建群聊
  async createGroupChat(req: AuthRequest, res: Response) {
    try {
      const { name, members, description } = req.body;
      const userId = req.user?.userId;

      if (!name || !members || !Array.isArray(members)) {
        return sendError(res, '缺少必要参数', 400);
      }

      const [result] = await this.pool.query(
        'INSERT INTO chat_rooms (name, room_type, created_by, description) VALUES (?, "group", ?, ?)',
        [name, userId, description]
      );

      const roomId = (result as any).insertId;

      // 添加成员（包括创建者）
      const memberValues = [...new Set([userId, ...members])]
        .map(memberId => [roomId, memberId, memberId === userId ? 'owner' : 'member']);

      await this.pool.query(
        'INSERT INTO room_members (room_id, user_id, role) VALUES ?',
        [memberValues]
      );

      return sendSuccess(res, { roomId }, '群聊创建成功');
    } catch (error) {
      console.error('创建群聊失败:', error);
      return sendError(res, '创建群聊失败');
    }
  }
}

export const createChatRoutes = (pool: Pool) => {
  const controller = new ChatController(pool);
  return {
    getChatList: controller.getChatList.bind(controller),
    searchMessages: controller.searchMessages.bind(controller),
    createGroupChat: controller.createGroupChat.bind(controller)
  };
};
