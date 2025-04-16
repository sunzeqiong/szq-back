import { Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export interface Room extends RowDataPacket {
  id: number;
  name: string;
  created_by: number;
  created_at: Date;
}

export class RoomController {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRoom(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const userId = req.user?.userId;

      if (!name) {
        return sendError(res, '聊天室名称不能为空', 400);
      }

      const [result] = await this.pool.query(
        'INSERT INTO chat_rooms (name, created_by) VALUES (?, ?)',
        [name, userId]
      );

      const roomId = (result as any).insertId;
      
      // 创建者自动加入聊天室
      await this.pool.query(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, userId]
      );

      return sendSuccess(res, { roomId }, '聊天室创建成功');
    } catch (error) {
      console.error('创建聊天室失败:', error);
      return sendError(res, '创建聊天室失败');
    }
  }

  async joinRoom(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;

      const [room] = await this.pool.query<Room[]>(
        'SELECT * FROM chat_rooms WHERE id = ?',
        [roomId]
      );

      if (!room.length) {
        return sendError(res, '聊天室不存在', 404);
      }

      await this.pool.query(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, userId]
      );

      return sendSuccess(res, null, '成功加入聊天室');
    } catch (error) {
      console.error('加入聊天室失败:', error);
      return sendError(res, '加入聊天室失败');
    }
  }

  async leaveRoom(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;

      await this.pool.query(
        'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );

      return sendSuccess(res, null, '已退出聊天室');
    } catch (error) {
      console.error('退出聊天室失败:', error);
      return sendError(res, '退出聊天室失败');
    }
  }

  async getRooms(req: AuthRequest, res: Response) {
    try {
      const [rooms] = await this.pool.query<Room[]>(
        `SELECT r.*, COUNT(rm.user_id) as member_count 
         FROM chat_rooms r 
         LEFT JOIN room_members rm ON r.id = rm.room_id 
         GROUP BY r.id 
         ORDER BY r.created_at DESC`
      );

      return sendSuccess(res, rooms, '获取聊天室列表成功');
    } catch (error) {
      console.error('获取聊天室列表失败:', error);
      return sendError(res, '获取聊天室列表失败');
    }
  }

  async getOrCreatePrivateRoom(req: AuthRequest, res: Response) {
    try {
      const targetUserId = Number(req.params.userId);
      const currentUserId = req.user?.userId;
      console.log('获取/创建私聊房间',  currentUserId, targetUserId);
      // 先检查是否已存在私聊房间
      // 获取目标用户名 - 修改为使用 nick_name
      const [targetUser] = await this.pool.query<(RowDataPacket & { nick_name: string })[]>(
        'SELECT nick_name FROM user WHERE id = ?',
        [targetUserId]
      );

      const [existingRooms] = await this.pool.query(
        `SELECT r.* FROM chat_rooms r
         JOIN room_members rm1 ON r.id = rm1.room_id
         JOIN room_members rm2 ON r.id = rm2.room_id
         WHERE rm1.user_id = ? AND rm2.user_id = ?
         AND (r.name LIKE '%私聊%' OR r.name LIKE '%private%')`,
        [currentUserId, targetUserId]
      );

      if (Array.isArray(existingRooms) && existingRooms.length > 0) {
        return sendSuccess(res, {
          ...existingRooms[0],
          targetUserId,
          targetUsername: targetUser[0].nick_name
        }, '获取私聊房间成功');
      }

      // 获取当前用户名 - 修改为使用 nick_name
      const [currentUser] = await this.pool.query<(RowDataPacket & { nick_name: string })[]>(
        'SELECT nick_name FROM user WHERE id = ?',
        [currentUserId]
      );

      // 创建新的私聊房间 - 使用 nick_name
      const roomName = `私聊-${currentUser[0].nick_name}-${targetUser[0].nick_name}`;
      const [result] = await this.pool.query(
        'INSERT INTO chat_rooms (name, created_by) VALUES (?, ?)',
        [roomName, currentUserId]
      );

      const roomId = (result as any).insertId;

      // 将两个用户加入房间
      await this.pool.query(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?), (?, ?)',
        [roomId, currentUserId, roomId, targetUserId]
      );

      return sendSuccess(res, {
        id: roomId,
        name: roomName,
        targetUserId,
        targetUsername: targetUser[0].nick_name,
        created_by: currentUserId
      }, '创建私聊房间成功');
    } catch (error) {
      console.error('获取/创建私聊房间失败:', error);
      return sendError(res, '获取/创建私聊房间失败');
    }
  }
}

export const createRoomRoutes = (controller: RoomController) => ({
  createRoom: controller.createRoom.bind(controller),
  joinRoom: controller.joinRoom.bind(controller),
  leaveRoom: controller.leaveRoom.bind(controller),
  getRooms: controller.getRooms.bind(controller),
  getOrCreatePrivateRoom: controller.getOrCreatePrivateRoom.bind(controller)
});
