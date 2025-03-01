import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { verifyRefreshToken, generateTokenPair, updateUserTokens } from '../utils/auth';
import { sendSuccess, sendUnauthorized, sendError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const refreshToken = (pool: Pool) => async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendUnauthorized(res, 'Refresh token is required');
  }

  try {
    // 验证refresh token
    const payload = verifyRefreshToken(refreshToken, JWT_SECRET);
    if (!payload) {
      return sendUnauthorized(res, 'Invalid refresh token');
    }

    // 检查数据库中的refresh token
    const [rows] = await pool.query(
      'SELECT * FROM user WHERE id = ? AND refresh_token = ?',
      [payload.userId, refreshToken]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return sendUnauthorized(res, 'Refresh token not found');
    }

    const user = rows[0] as { id: number; username: string; refresh_token_expires: string };

    // 检查refresh token是否过期
    if (new Date(user.refresh_token_expires) < new Date()) {
      return sendUnauthorized(res, 'Refresh token has expired');
    }

    // 生成新的token对
    const tokenPair = generateTokenPair(
      { userId: user.id, username: user.username },
      JWT_SECRET
    );

    // 更新数据库中的token
    await updateUserTokens(pool, user.id, tokenPair);

    return sendSuccess(res, {
      token: tokenPair.token,
      refreshToken: tokenPair.refreshToken
    }, 'Token refreshed successfully');
  } catch (error) {
    console.error('Token refresh failed:', error);
    return sendError(res, 'Token refresh failed');
  }
};
