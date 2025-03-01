import { Request, Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { hashPassword, comparePassword, generateToken, generateTokenPair, updateUserTokens } from '../utils/auth';
import { sendSuccess, sendError, sendValidationError, sendUnauthorized } from '../utils/response';

export interface User extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  email: string;
  phone?: string;
  token?: string;
  created_at: Date;
  updated_at: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const validateRegisterInput = (
  username?: string, 
  password?: string, 
  email?: string
): string | null => {
  if (!username || !password || !email) {
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
  const { username, password, email } = req.body;

  try {
    const validationError = validateRegisterInput(username, password, email);
    if (validationError) {
      return sendValidationError(res, validationError);
    }

    const [existing] = await pool.query<User[]>(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, email]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return sendValidationError(res, '用户名或邮箱已存在');
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await pool.query(
      'INSERT INTO user (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
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
  const { username, password } = req.body;

  try {
    const validationError = validateLoginInput(username, password);
    if (validationError) {
      return sendValidationError(res, validationError);
    }

    const [rows] = await pool.query<User[]>(
      'SELECT * FROM user WHERE username = ?',
      [username]
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
      { userId: user.id, username: user.username },
      JWT_SECRET
    );

    // 更新数据库中的token
    await updateUserTokens(pool, user.id, tokenPair);

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
      user: userWithoutTokens,
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

export const createUserRoutes = (pool: Pool) => ({
  register: register(pool),
  login: login(pool)
});
