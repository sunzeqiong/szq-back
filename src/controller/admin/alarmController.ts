import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { sendSuccess, sendError } from '../../utils/response';

export const getAlarms = (pool: Pool) => async (req: Request, res: Response) => {
  const { station_id, status, severity } = req.query;
  try {
    let query = `
      SELECT a.*, s.name as station_name, u.nick_name as resolved_by_name
      FROM alarm_record a
      LEFT JOIN heating_station s ON a.station_id = s.id
      LEFT JOIN user u ON a.resolved_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (station_id) {
      query += ' AND a.station_id = ?';
      params.push(station_id);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (severity) {
      query += ' AND a.severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY a.created_at DESC';

    const [alarms] = await pool.query(query, params);
    return sendSuccess(res, alarms);
  } catch (error) {
    return sendError(res, '获取报警记录失败');
  }
};

export const createAlarm = (pool: Pool) => async (req: Request, res: Response) => {
  const { station_id, alarm_type, severity, title, description } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO alarm_record 
       (station_id, alarm_type, severity, title, description, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [station_id, alarm_type, severity, title, description]
    );
    return sendSuccess(res, { id: (result as any).insertId }, '创建报警记录成功');
  } catch (error) {
    return sendError(res, '创建报警记录失败');
  }
};

export const updateAlarmStatus = (pool: Pool) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolved_by } = req.body;
  try {
    await pool.query(
      `UPDATE alarm_record 
       SET status = ?,
           resolved_by = ?,
           resolved_at = CASE WHEN ? = 'resolved' THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [status, resolved_by, status, id]
    );
    return sendSuccess(res, null, '更新报警状态成功');
  } catch (error) {
    return sendError(res, '更新报警状态失败');
  }
};
