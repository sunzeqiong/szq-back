import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { sendSuccess, sendError } from '../../utils/response';

export const getOrders = (pool: Pool) => async (req: Request, res: Response) => {
  const { status, assignee_id } = req.query;
  try {
    let query = `
      SELECT m.*, 
             hs.name as station_name,
             u1.username as reporter_name,
             u2.username as assignee_name
      FROM maintenance_order m
      LEFT JOIN heating_station hs ON m.station_id = hs.id
      LEFT JOIN user u1 ON m.reporter_id = u1.id
      LEFT JOIN user u2 ON m.assignee_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }
    if (assignee_id) {
      query += ' AND m.assignee_id = ?';
      params.push(assignee_id);
    }

    query += ' ORDER BY m.created_at DESC';

    const [orders] = await pool.query(query, params);
    return sendSuccess(res, orders);
  } catch (error) {
    return sendError(res, '获取工单列表失败');
  }
};

export const createOrder = (pool: Pool) => async (req: Request, res: Response) => {
  const {
    station_id,
    title,
    description,
    priority,
    reporter_id,
    assignee_id
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO maintenance_order 
       (station_id, title, description, priority, 
        status, reporter_id, assignee_id) 
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [station_id, title, description, priority, 
       reporter_id, assignee_id]
    );
    return sendSuccess(res, { id: (result as any).insertId }, '创建工单成功');
  } catch (error) {
    return sendError(res, '创建工单失败');
  }
};

export const updateOrderStatus = (pool: Pool) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    await pool.query(
      `UPDATE maintenance_order 
       SET status = ?,
           completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [status, status, id]
    );
    return sendSuccess(res, null, '更新工单状态成功');
  } catch (error) {
    return sendError(res, '更新工单状态失败');
  }
};
