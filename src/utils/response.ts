import { Response } from 'express';

export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = '操作成功'
) => {
  const response: ApiResponse<T> = {
    status: 200,
    message,
    data
  };
  return res.json(response);
};

export const sendError = (
  res: Response,
  message: string,
  status: number = 500
) => {
  const response: ApiResponse = {
    status,
    message
  };
  return res.status(status).json(response);
};

export const sendValidationError = (
  res: Response,
  message: string
) => {
  return sendError(res, message, 400);
};

export const sendUnauthorized = (
  res: Response,
  message: string = '未授权访问'
) => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = '禁止访问'
) => {
  return sendError(res, message, 403);
};

export const sendNotFound = (
  res: Response,
  message: string = '资源未找到'
) => {
  return sendError(res, message, 404);
};
