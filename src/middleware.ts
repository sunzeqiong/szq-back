import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

export const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
};

export const notFoundHandler = (req: Request, res: Response) => {
  console.log(`收到未匹配的请求: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found' });
};