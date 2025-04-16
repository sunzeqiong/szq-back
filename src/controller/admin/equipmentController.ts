import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { sendSuccess, sendError } from '../../utils/response';

export const getEquipments = (pool: Pool) => async (req: Request, res: Response) => {
  const { station_id, type, status } = req.query;
  try {
    let query = `
      SELECT e.*, s.name as station_name
      FROM equipment e
      LEFT JOIN heating_station s ON e.station_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (station_id) {
      query += ' AND e.station_id = ?';
      params.push(station_id);
    }
    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    const [equipments] = await pool.query(query, params);
    return sendSuccess(res, equipments);
  } catch (error) {
    return sendError(res, '获取设备列表失败');
  }
};

export const createEquipment = (pool: Pool) => async (req: Request, res: Response) => {
  const {
    station_id,
    name,
    type,
    model,
    manufacturer,
    installation_date,
    specifications
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO equipment 
       (station_id, name, type, model, manufacturer,
        installation_date, status, specifications) 
       VALUES (?, ?, ?, ?, ?, ?, 'stopped', ?)`,
      [station_id, name, type, model, manufacturer,
       installation_date, specifications]
    );
    return sendSuccess(res, { id: (result as any).insertId }, '创建设备成功');
  } catch (error) {
    return sendError(res, '创建设备失败');
  }
};

export const addMaintenanceRecord = (pool: Pool) => async (req: Request, res: Response) => {
  const {
    equipment_id,
    maintenance_type,
    description,
    maintenance_date,
    cost,
    maintainer,
    notes
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO equipment_maintenance 
       (equipment_id, maintenance_type, description,
        maintenance_date, cost, maintainer, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [equipment_id, maintenance_type, description,
       maintenance_date, cost, maintainer, notes]
    );

    // 更新设备的最后维护日期
    await pool.query(
      `UPDATE equipment 
       SET last_maintenance_date = ?,
           next_maintenance_date = DATE_ADD(?, INTERVAL 30 DAY)
       WHERE id = ?`,
      [maintenance_date, maintenance_date, equipment_id]
    );

    return sendSuccess(res, { id: (result as any).insertId }, '添加维护记录成功');
  } catch (error) {
    return sendError(res, '添加维护记录失败');
  }
};
