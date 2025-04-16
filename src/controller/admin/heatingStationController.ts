import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { sendSuccess, sendError } from '../../utils/response';

export const getStations = (pool: Pool) => async (req: Request, res: Response) => {
  try {
    const [stations] = await pool.query(
      `SELECT h.*, u.nick_name as manager_name 
       FROM heating_station h 
       LEFT JOIN user u ON h.manager_id = u.id`
    );
    return sendSuccess(res, stations);
  } catch (error) {
    return sendError(res, '获取热力站列表失败');
  }
};

export const getStationById = (pool: Pool) => async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [stations] = await pool.query(
      `SELECT h.*, u.nick_name as manager_name 
       FROM heating_station h 
       LEFT JOIN user u ON h.manager_id = u.id 
       WHERE h.id = ?`,
      [id]
    );
    if (Array.isArray(stations) && stations.length > 0) {
      return sendSuccess(res, stations[0]);
    }
    return sendError(res, '热力站不存在', 404);
  } catch (error) {
    return sendError(res, '获取热力站详情失败');
  }
};

export const createStation = (pool: Pool) => async (req: Request, res: Response) => {
  const { name, address, area_covered, capacity, manager_id, temperature, pressure } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO heating_station 
       (name, address, area_covered, capacity, status, manager_id, temperature, pressure) 
       VALUES (?, ?, ?, ?, 'stopped', ?, ?, ?)`,
      [name, address, area_covered, capacity, manager_id, temperature, pressure]
    );
    return sendSuccess(res, { id: (result as any).insertId }, '创建热力站成功');
  } catch (error) {
    return sendError(res, '创建热力站失败');
  }
};

export const updateStationStatus = (pool: Pool) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query(
      'UPDATE heating_station SET status = ? WHERE id = ?',
      [status, id]
    );
    return sendSuccess(res, null, '更新状态成功');
  } catch (error) {
    return sendError(res, '更新状态失败');
  }
};

export const updateStationValues = (pool: Pool) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const { temperature, pressure } = req.body;
  try {
    await pool.query(
      'UPDATE heating_station SET temperature = ?, pressure = ? WHERE id = ?',
      [temperature, pressure, id]
    );
    return sendSuccess(res, null, '更新温度压力成功');
  } catch (error) {
    return sendError(res, '更新温度压力失败');
  }
};
