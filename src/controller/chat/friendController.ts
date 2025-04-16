import { Response } from 'express';
import { Pool } from 'mysql2/promise';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class FriendController {
  constructor(private readonly pool: Pool) {}

  // 获取好友列表
  async getFriends(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      const [friends] = await this.pool.query(
        `SELECT 
          u.id, 
          u.nick_name, 
          u.email, 
          u.avatar,
          u.signature,
          u.is_online,
          u.last_active,
          f.status, 
          f.created_at as friend_since
         FROM friendships f
         JOIN user u ON f.friend_id = u.id
         WHERE f.user_id = ? AND f.status = 'accepted'
         ORDER BY u.is_online DESC, u.nick_name ASC`,  // 在线用户排在前面
        [userId]
      );
      
      return sendSuccess(res, friends, '获取好友列表成功');
    } catch (error) {
      console.error('获取好友列表失败:', error);
      return sendError(res, '获取好友列表失败');
    }
  }

  // 发送好友请求
  async addFriend(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { friendId } = req.body;

      if (userId === friendId) {
        return sendError(res, '不能添加自己为好友', 400);
      }

      // 检查是否已经是好友
      const [existing] = await this.pool.query(
        'SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?',
        [userId, friendId]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        return sendError(res, '已经发送过好友请求或已经是好友', 400);
      }

      // 创建好友请求
      await this.pool.query(
        'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "pending")',
        [userId, friendId]
      );

      return sendSuccess(res, null, '好友请求已发送');
    } catch (error) {
      console.error('发送好友请求失败:', error);
      return sendError(res, '发送好友请求失败');
    }
  }

  // 处理好友请求
  async handleFriendRequest(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { friendId, action } = req.body; // action: 'accept' | 'reject'

      // 添加参数验证
      if (!friendId) {
        return sendError(res, '缺少好友ID', 400);
      }

      if (!action || !['accept', 'reject'].includes(action)) {
        return sendError(res, '无效的操作类型', 400);
      }

      // 验证请求是否存在
      const [existingRequest] = await this.pool.query(
        'SELECT * FROM friendships WHERE user_id = ? AND friend_id = ? AND status = "pending"',
        [friendId, userId]  // friendId是发送者，userId是接收者
      );

      if (!Array.isArray(existingRequest) || existingRequest.length === 0) {
        return sendError(res, '好友请求不存在', 404);
      }

      if (action === 'accept') {
        // 获取连接并开始事务
        const connection = await this.pool.getConnection();
        try {
          await connection.beginTransaction();

          // 先删除原有的可能存在的任何关系
          await connection.query(
            'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [userId, friendId, friendId, userId]
          );

          // 创建双向的好友关系
          await connection.query(
            'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "accepted"), (?, ?, "accepted")',
            [userId, friendId, friendId, userId]
          );

          await connection.commit();
          connection.release();
          return sendSuccess(res, null, '已接受好友请求');
        } catch (error) {
          await connection.rollback();
          connection.release();
          throw error;
        }
      } else {
        // 拒绝请求则删除
        await this.pool.query(
          'DELETE FROM friendships WHERE user_id = ? AND friend_id = ?',
          [friendId, userId]
        );
        return sendSuccess(res, null, '已拒绝好友请求');
      }
    } catch (error) {
      console.error('处理好友请求失败:', error);
      return sendError(res, '处理好友请求失败');
    }
  }

  // 删除好友
  async deleteFriend(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { friendId } = req.params;

      // 删除双向好友关系
      await this.pool.query(
        'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
        [userId, friendId, friendId, userId]
      );

      return sendSuccess(res, null, '已删除好友');
    } catch (error) {
      console.error('删除好友失败:', error);
      return sendError(res, '删除好友失败');
    }
  }

  // 获取好友请求列表
  async getFriendRequests(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      const [requests] = await this.pool.query(
        `SELECT f.*, u.nick_name, u.email ,u.avatar
         FROM friendships f
         JOIN user u ON f.user_id = u.id
         WHERE f.friend_id = ? AND f.status = 'pending'`,
        [userId]
      );
      
      return sendSuccess(res, requests, '获取好友请求列表成功');
    } catch (error) {
      console.error('获取好友请求列表失败:', error);
      return sendError(res, '获取好友请求列表失败');
    }
  }
}

export const createFriendRoutes = (pool: Pool) => {
  const controller = new FriendController(pool);
  return {
    getFriends: controller.getFriends.bind(controller),
    addFriend: controller.addFriend.bind(controller),
    handleFriendRequest: controller.handleFriendRequest.bind(controller),
    deleteFriend: controller.deleteFriend.bind(controller),
    getFriendRequests: controller.getFriendRequests.bind(controller)
  };
};
