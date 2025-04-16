import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/auth';
import pool from '../db'; // Assuming pool is imported from a database module
import { SocketEvents } from '../constants/socketEvents';

export const initializeWebSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/ws' // 指定 WebSocket 路径
  });

  // 身份验证中间件
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next(new Error('JWT_SECRET is not configured'));
      return;
    }
    try {
      const decoded = await verifyToken(token, jwtSecret);
      if (!decoded) {
        next(new Error('Invalid token'));
        return;
      }
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // 连接处理
  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    console.log('User connected:', userId);

    // 添加事件监听器调试
    socket.onAny((eventName, ...args) => {
      console.log('Received event:', eventName, 'with args:', args);
    });

    // 更新用户在线状态线
    await pool.query(
      'UPDATE user SET is_online = ?, last_active = NOW() WHERE id = ?',
      [1, userId]
    );

    // 添加心跳检测
    const heartbeatInterval = setInterval(async () => {
      if (socket.connected) {
        await pool.query(
          'UPDATE user SET last_active = NOW() WHERE id = ?',
          [socket.data.userId]
        );
      }
    }, 30000); // 每30秒更新一次

    // 加入房间
    socket.on(SocketEvents.JOIN_ROOM, (roomId) => {
      const parsedRoomId = parseInt(roomId, 10);
      if (isNaN(parsedRoomId)) {
        socket.emit('error', { message: '无效的房间ID' });
        return;
      }
      console.log(`User ${socket.data.userId} joining room ${parsedRoomId}`);
      socket.join(`room-${parsedRoomId}`);
    });

    // 新消息处理
    socket.on(SocketEvents.NEW_MESSAGE, async (data) => {
      console.log('NEW_MESSAGE event triggered with data:', data);
      try {
        console.log('Received message:', data);
        const { content, roomId } = data;
        const userId = socket.data.userId;

        // 验证和转换 roomId
        const parsedRoomId = parseInt(roomId, 10);
        if (isNaN(parsedRoomId)) {
          socket.emit('error', { message: '无效的房间ID' });
          return;
        }

        // 验证用户是否在房间中
        const [memberCheck] = await pool.query(
          'SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?',
          [parsedRoomId, userId]
        );

        if (!Array.isArray(memberCheck) || memberCheck.length === 0) {
          socket.emit('error', { message: '您不是该聊天室的成员' });
          return;
        }

        // 将消息保存到数据库
        const [result] = await pool.query(
          'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
          [parsedRoomId, userId, content]
        );

        const messageId = (result as any).insertId;

        // 查询完整的消息信息
        const [messages] = await pool.query(
          `SELECT 
            m.*,
            u.nick_name as sender_name,
            DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as formatted_time
           FROM messages m 
           JOIN user u ON m.user_id = u.id 
           WHERE m.id = ?`,
          [messageId]
        ) as [any[], any];

        const message = messages[0];
        
        // 广播消息给房间内所有人，包括发送者
        io.to(`room-${parsedRoomId}`).emit(SocketEvents.MESSAGE, {
          ...message,
          is_sender: false
        });

        // 单独给发送者发送一个带有 is_sender: true 的消息
        socket.emit(SocketEvents.MESSAGE, {
          ...message,
          is_sender: true
        });

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit(SocketEvents.ERROR, { message: '消息发送失败' });
      }
    });

    socket.on(SocketEvents.LEAVE_ROOM, (roomId) => {
      const parsedRoomId = parseInt(roomId, 10);//置离线
      if (isNaN(parsedRoomId)) {
        socket.emit('error', { message: '无效的房间ID' });
        return;
      }
      socket.leave(`room-${parsedRoomId}`);
    });

    socket.on('disconnect', async () => {
      clearInterval(heartbeatInterval);
      console.log('User disconnected:', userId);
      // 更新用户离线状态
      await pool.query(
        'UPDATE user SET is_online = ?, last_active = NOW() WHERE id = ?',
        [0, userId]
      );
    });
  });

  return io;
};
