import { Request, Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { hashPassword, comparePassword, generateToken, generateTokenPair, updateUserTokens } from '../utils/auth';
import { sendSuccess, sendError, sendValidationError, sendUnauthorized } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
export interface User extends RowDataPacket {
  id: number;
  nick_name: string;
  password: string;
  email: string;
  phone?: string;
  avatar?: string;
  signature?: string;
  is_online: boolean;
  token?: string;
  created_at: Date;
  updated_at: Date;
  refresh_token?: string;
  token_expires?: Date;
  refresh_token_expires?: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const validateRegisterInput = (
  nick_name?: string, 
  password?: string, 
  email?: string
): string | null => {
  if (!nick_name || !password || !email) {
    return '所有字段都是必填的';
  }
  return null;
};

const validateLoginInput = (
  username?: string, 
  password?: string
): string | null => {
  if (!username || !password) {
    return '用户名和密码都是必填的';
  }
  return null;
};

export const register = (pool: Pool) => async (req: Request, res: Response) => {
  const { nick_name, password, email } = req.body;

  try {
    const validationError = validateRegisterInput(nick_name, password, email);
    if (validationError) {
      return sendValidationError(res, validationError);
    }

    const [existing] = await pool.query<User[]>(
      'SELECT * FROM user WHERE nick_name = ? OR email = ?',
      [nick_name, email]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return sendValidationError(res, '昵称或邮箱已存在');
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await pool.query(
      'INSERT INTO user (nick_name, username, password, email) VALUES (?, ?, ?, ?)',
      [nick_name, nick_name, hashedPassword, email]
    );

    return sendSuccess(res, {
      userId: (result as any).insertId
    }, '注册成功');
  } catch (error) {
    console.error('注册失败:', error);
    return sendError(res, '注册失败');
  }
};

export const login = (pool: Pool) => async (req: Request, res: Response) => {
  const { nick_name, password } = req.body;

  try {
    const validationError = validateLoginInput(nick_name, password);
    if (validationError) {
      return sendValidationError(res, validationError);
    }

    const [rows] = await pool.query<User[]>(
      'SELECT * FROM user WHERE nick_name = ?',
      [nick_name]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return sendUnauthorized(res, '用户名或密码错误');
    }

    const user = rows[0];
    const isValid = await comparePassword(password, user.password);
    
    if (!isValid) {
      return sendUnauthorized(res, '用户名或密码错误');
    }

    // 生成新的token对
    const tokenPair = generateTokenPair(
      { userId: user.id, nick_name: user.nick_name },
      JWT_SECRET
    );

    // 更新数据库中的token
    await updateUserTokens(pool, user.id, tokenPair);

    // 登录成功后设置在线
    await pool.query(
      'UPDATE user SET is_online = ?, last_active = NOW() WHERE id = ?',
      [1, user.id]
    );

    // 从用户对象中移除所有token相关字段
    const { 
      password: _, 
      token: __, 
      refresh_token: ___, 
      token_expires: ____, 
      refresh_token_expires: _____, 
      ...userWithoutTokens 
    } = user;

    return sendSuccess(res, {
      user: {
        ...userWithoutTokens,
        avatar: user.avatar,
        signature: user.signature,
        is_online: Boolean(user.is_online)
      },
      token: tokenPair.token,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.tokenExpires,
      refreshTokenExpiresIn: tokenPair.refreshTokenExpires
    }, '登录成功');

  } catch (error) {
    console.error('登录失败:', error);
    return sendError(res, '登录失败');
  }
};

export const logout = (pool: Pool) => async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // 登出时设置离线
    await pool.query(
      'UPDATE user SET is_online = ?, last_active = NOW() WHERE id = ?',
      [0, userId]
    );

    return sendSuccess(res, null, '退出登录成功');
  } catch (error) {
    return sendError(res, '退出登录失败');
  }
};

export const getAllUsers = (pool: Pool) => async (req: AuthRequest, res: Response) => {
  try {
    const [users] = await pool.query<User[]>(
      'SELECT id, username, email FROM user WHERE id != ?',
      [req.user?.userId] // 排除当前用户
    );
    
    return sendSuccess(res, users, '获取用户列表成功');
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return sendError(res, '获取用户列表失败');
  }
};

export const searchUsers = (pool: Pool) => async (req: AuthRequest, res: Response) => {
  try {
    const { keyword } = req.query;
    const currentUserId = req.user?.userId;

    if (!keyword) {
      return sendError(res, '请输入搜索关键词', 400);
    }

    const [users] = await pool.query<User[]>(
      `SELECT 
        u.id,  
        u.nick_name, 
        u.email,
        COALESCE(
          (SELECT f.status 
           FROM friendships f 
           WHERE (f.user_id = ? AND f.friend_id = u.id) 
           OR (f.friend_id = ? AND f.user_id = u.id)
          ), 
          'none'
        ) as friendship_status
       FROM user u
       WHERE u.id != ? 
       AND ( 
         u.nick_name LIKE ? OR 
         u.email LIKE ? OR 
         u.phone LIKE ?
       )
       ORDER BY u.nick_name`,  // 删除了这里多余的逗号
      [currentUserId, currentUserId, currentUserId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );

    return sendSuccess(res, users, '搜索用户成功');
  } catch (error) {
    console.error('搜索用户失败:', error);
    return sendError(res, '搜索用户失败');
  }
};

export const createUserRoutes = (pool: Pool) => ({
  register: register(pool),
  login: login(pool),
  getAllUsers: getAllUsers(pool),
  searchUsers: searchUsers(pool),
  logout: logout(pool)
});
