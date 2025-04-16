import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'mysql2/promise';

export const hashPassword = (password: string): Promise<string> => 
  bcrypt.hash(password, 10);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

interface TokenPayload {
  userId: number;
  nick_name: string;
}

interface TokenPair {
  token: string;
  refreshToken: string;
  tokenExpires: Date;
  refreshTokenExpires: Date;
}

export const generateToken = (
  payload: { userId: number; username: string },
  secret: string
): string =>
  jwt.sign(payload, secret, { expiresIn: '24h' });

export const generateTokenPair = (
  payload: TokenPayload,
  secret: string
): TokenPair => {
  const token = jwt.sign(payload, secret, { expiresIn: '2h' });
  const refreshToken = jwt.sign(payload, secret + '-refresh', { expiresIn: '7d' });
  
  const now = new Date();
  const tokenExpires = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2小时
  const refreshTokenExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天

  return {
    token,
    refreshToken,
    tokenExpires,
    refreshTokenExpires
  };
};

export const verifyToken = (token: string, secret: string): TokenPayload | null => {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string, secret: string): TokenPayload | null => {
  try {
    return jwt.verify(token, secret + '-refresh') as TokenPayload;
  } catch {
    return null;
  }
};

export const updateUserTokens = async (
  pool: Pool,
  userId: number,
  tokenPair: TokenPair
): Promise<void> => {
  await pool.query(
    `UPDATE user SET 
     token = ?,
     refresh_token = ?,
     token_expires = ?,
     refresh_token_expires = ?
     WHERE id = ?`,
    [
      tokenPair.token,
      tokenPair.refreshToken,
      tokenPair.tokenExpires,
      tokenPair.refreshTokenExpires,
      userId
    ]
  );
};
