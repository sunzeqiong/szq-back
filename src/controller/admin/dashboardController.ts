import { Request, Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { sendSuccess, sendError } from '../../utils/response';

// 获取运营总览数据（统计数据和趋势分析）
export const getDashboardOverview = (pool: Pool) => async (req: Request, res: Response) => {
  try {
    // 基础统计数据
    const [statistics] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM v_operation_overview
    `);

    // 本月目标完成情况
    const [targets] = await pool.query(`
      SELECT 
        target_type,
        target_value,
        actual_value,
        status
      FROM operation_targets
      WHERE year = YEAR(CURDATE())
      AND month = MONTH(CURDATE())
    `);

    // 近30天工单处理统计
    const [orderStats] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(TIMESTAMPDIFF(HOUR, created_at, 
          CASE 
            WHEN status = 'completed' THEN completed_at
            ELSE NOW()
          END)) as avg_process_time
      FROM maintenance_order
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status
    `);

    // 近7天能耗趋势
    const [energyTrend] = await pool.query(`
      SELECT 
        DATE(date) as date,
        SUM(heat_supply) as total_heat,
        SUM(power_consumption) as total_power,
        SUM(water_consumption) as total_water,
        AVG(efficiency) as avg_efficiency
      FROM energy_consumption
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date)
      ORDER BY date
    `);

    return sendSuccess(res, {
      currentStatistics: {
        ...statistics[0],
        current_date: statistics[0].report_date  // 为了保持前端兼容性，可以在这里映射回 current_date
      },
      monthlyTargets: targets,
      orderStatistics: orderStats,
      energyTrend
    });
  } catch (error) {
    console.error('获取运营概览失败:', error);
    return sendError(res, '获取运营概览失败');
  }
};

// 获取实时监控数据（实时数据和告警）
export const getRealTimeMonitoring = (pool: Pool) => async (req: Request, res: Response) => {
  try {
    // 热力站实时运行状态
    const [stationStatus] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.status,
        COALESCE(hr.temperature_supply, 0) as current_temperature,
        COALESCE(hr.pressure_supply, 0) as current_pressure,
        COALESCE(hr.flow_rate, 0) as current_flow,
        COALESCE(e.running_count, 0) as running_equipment,
        COALESCE(e.fault_count, 0) as fault_equipment,
        COALESCE(a.alarm_count, 0) as active_alarms
      FROM heating_station s
      LEFT JOIN (
        SELECT h.station_id, h.temperature_supply, h.pressure_supply, h.flow_rate
        FROM heating_record h
        INNER JOIN (
          SELECT station_id, MAX(record_time) as latest_time
          FROM heating_record
          GROUP BY station_id
        ) latest ON h.station_id = latest.station_id AND h.record_time = latest.latest_time
      ) hr ON s.id = hr.station_id
      LEFT JOIN (
        SELECT station_id,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_count,
          SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault_count
        FROM equipment
        GROUP BY station_id
      ) e ON s.id = e.station_id
      LEFT JOIN (
        SELECT station_id, COUNT(*) as alarm_count
        FROM alarm_record
        WHERE status = 'active'
        GROUP BY station_id
      ) a ON s.id = a.station_id
    `);

    // 最新告警（只获取最近的10条重要告警）
    const [latestAlarms] = await pool.query(`
      SELECT a.*, s.name as station_name
      FROM alarm_record a
      LEFT JOIN heating_station s ON a.station_id = s.id
      WHERE a.status = 'active' AND a.severity IN ('critical', 'high')
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    // 获取所有热力站的当前效率
    const [efficiency] = await pool.query(`
      SELECT 
        e.station_id,
        s.name as station_name,
        e.efficiency as current_efficiency
      FROM energy_consumption e
      INNER JOIN (
        SELECT station_id, MAX(date) as latest_date
        FROM energy_consumption
        GROUP BY station_id
      ) latest ON e.station_id = latest.station_id AND e.date = latest.latest_date
      LEFT JOIN heating_station s ON e.station_id = s.id
    `);

    return sendSuccess(res, {
      stationStatus,
      latestAlarms,
      efficiency
    });
  } catch (error) {
    console.error('获取实时监控数据失败:', error);
    return sendError(res, '获取实时监控数据失败');
  }
};

// 获取性能分析数据
export const getPerformanceAnalysis = (pool: Pool) => async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  try {
    // 热力站效率分析
    const [efficiency] = await pool.query(`
      SELECT 
        s.name as station_name,
        AVG(e.efficiency) as avg_efficiency,
        MAX(e.efficiency) as max_efficiency,
        MIN(e.efficiency) as min_efficiency
      FROM energy_consumption e
      LEFT JOIN heating_station s ON e.station_id = s.id
      WHERE e.date BETWEEN ? AND ?
      GROUP BY e.station_id
    `, [startDate, endDate]);

    // 能耗趋势
    const [consumption] = await pool.query(`
      SELECT 
        DATE(date) as date,
        SUM(heat_supply) as total_heat,
        SUM(power_consumption) as total_power,
        SUM(water_consumption) as total_water
      FROM energy_consumption
      WHERE date BETWEEN ? AND ?
      GROUP BY DATE(date)
      ORDER BY date
    `, [startDate, endDate]);

    return sendSuccess(res, {
      efficiency,
      consumption
    });
  } catch (error) {
    console.error('获取性能分析数据失败:', error);
    return sendError(res, '获取性能分析数据失败');
  }
};
