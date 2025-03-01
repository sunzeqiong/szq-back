import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Request 类型以包含用户信息
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

// Token 认证中间件
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 从请求头获取 token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    // 将用户信息添加到请求对象
    req.user = decoded as { userId: number; username: string };
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的认证令牌' });
  }
};