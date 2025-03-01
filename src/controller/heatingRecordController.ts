import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { sendSuccess, sendError } from '../utils/response';

export const getStationRecords = (pool: Pool) => async (req: Request, res: Response) => {
  const { station_id, start_date, end_date } = req.query;
  try {
    const [records] = await pool.query(
      `SELECT * FROM heating_record 
       WHERE station_id = ? 
       AND record_time BETWEEN ? AND ?
       ORDER BY record_time DESC`,
      [station_id, start_date, end_date]
    );
    return sendSuccess(res, records);
  } catch (error) {
    return sendError(res, '获取供热记录失败');
  }
};

export const addRecord = (pool: Pool) => async (req: Request, res: Response) => {
  const {
    station_id,
    temperature_supply,
    temperature_return,
    pressure_supply,
    pressure_return,
    flow_rate,
    heat_supply
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO heating_record 
       (station_id, temperature_supply, temperature_return, 
        pressure_supply, pressure_return, flow_rate, 
        heat_supply, record_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [station_id, temperature_supply, temperature_return,
       pressure_supply, pressure_return, flow_rate,
       heat_supply]
    );
    return sendSuccess(res, { id: (result as any).insertId }, '添加记录成功');
  } catch (error) {
    return sendError(res, '添加记录失败');
  }
};
