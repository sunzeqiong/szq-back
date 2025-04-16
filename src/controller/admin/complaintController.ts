import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { sendSuccess, sendError } from '../../utils/response';

export const getComplaints = (pool: Pool) => async (req: Request, res: Response) => {
  const { status, priority } = req.query;
  try {
    let query = `
      SELECT c.*, u.nick_name as handler_name
      FROM customer_complaint c
      LEFT JOIN user u ON c.handler_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND c.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY c.created_at DESC';

    const [complaints] = await pool.query(query, params);
    return sendSuccess(res, complaints);
  } catch (error) {
    return sendError(res, '获取投诉列表失败');
  }
};

export const createComplaint = (pool: Pool) => async (req: Request, res: Response) => {
  const {
    customer_name,
    contact_phone,
    address,
    complaint_type,
    description,
    priority
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO customer_complaint 
       (customer_name, contact_phone, address, complaint_type,
        description, status, priority) 
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [customer_name, contact_phone, address, complaint_type,
       description, priority]
    );
    return sendSuccess(res, { id: (result as any).insertId }, '创建投诉记录成功');
  } catch (error) {
    return sendError(res, '创建投诉记录失败');
  }
};

export const updateComplaintStatus = (pool: Pool) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, handler_id, solution } = req.body;
  try {
    await pool.query(
      `UPDATE customer_complaint 
       SET status = ?,
           handler_id = ?,
           solution = ?,
           resolved_at = CASE WHEN ? IN ('resolved', 'closed') THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [status, handler_id, solution, status, id]
    );
    return sendSuccess(res, null, '更新投诉状态成功');
  } catch (error) {
    return sendError(res, '更新投诉状态失败');
  }
};
