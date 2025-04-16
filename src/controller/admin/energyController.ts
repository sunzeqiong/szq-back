import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { sendSuccess, sendError } from '../../utils/response';

export const getEnergyConsumption = (pool: Pool) => async (req: Request, res: Response) => {
  const { station_id, start_date, end_date } = req.query;
  try {
    const [records] = await pool.query(
      `SELECT e.*, s.name as station_name
       FROM energy_consumption e
       LEFT JOIN heating_station s ON e.station_id = s.id
       WHERE e.station_id = ? 
       AND e.date BETWEEN ? AND ?
       ORDER BY e.date`,
      [station_id, start_date, end_date]
    );
    return sendSuccess(res, records);
  } catch (error) {
    return sendError(res, '获取能耗数据失败');
  }
};

export const addEnergyRecord = (pool: Pool) => async (req: Request, res: Response) => {
  const {
    station_id,
    date,
    heat_supply,
    power_consumption,
    water_consumption,
    efficiency
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO energy_consumption 
       (station_id, date, heat_supply, power_consumption, 
        water_consumption, efficiency) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [station_id, date, heat_supply, power_consumption,
       water_consumption, efficiency]
    );
    return sendSuccess(res, { id: (result as any).insertId }, '添加能耗记录成功');
  } catch (error) {
    return sendError(res, '添加能耗记录失败');
  }
};

export const getEnergyAnalysis = (pool: Pool) => async (req: Request, res: Response) => {
  const { station_id, period } = req.query;
  try {
    let query = '';
    if (period === 'daily') {
      query = `
        SELECT 
          DATE(date) as date,
          SUM(heat_supply) as total_heat,
          SUM(power_consumption) as total_power,
          SUM(water_consumption) as total_water,
          AVG(efficiency) as avg_efficiency
        FROM energy_consumption
        WHERE station_id = ?
        GROUP BY DATE(date)
        ORDER BY date DESC
        LIMIT 30
      `;
    } else if (period === 'monthly') {
      query = `
        SELECT 
          DATE_FORMAT(date, '%Y-%m') as month,
          SUM(heat_supply) as total_heat,
          SUM(power_consumption) as total_power,
          SUM(water_consumption) as total_water,
          AVG(efficiency) as avg_efficiency
        FROM energy_consumption
        WHERE station_id = ?
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `;
    }

    const [analysis] = await pool.query(query, [station_id]);
    return sendSuccess(res, analysis);
  } catch (error) {
    return sendError(res, '获取能耗分析失败');
  }
};
