import { Router } from 'express';
import { createUserRoutes } from './controller/userController';
import { refreshToken } from './controller/tokenController';
import * as heatingStationController from './controller/heatingStationController';
import * as heatingRecordController from './controller/heatingRecordController';
import * as maintenanceController from './controller/maintenanceController';
import { authenticateToken } from './middleware/auth';
import pool from './db';
import * as alarmController from './controller/alarmController';
import * as energyController from './controller/energyController';
import * as complaintController from './controller/complaintController';
import * as equipmentController from './controller/equipmentController';
import * as dashboardController from './controller/dashboardController';

const router = Router();

// 用户认证相关路由
const userRoutes = createUserRoutes(pool);
router.post('/auth/register', userRoutes.register);
router.post('/auth/login', userRoutes.login);
router.post('/auth/refresh-token', refreshToken(pool));

// 热力站管理路由
router.get('/stations', authenticateToken, heatingStationController.getStations(pool));
router.get('/stations/:id', authenticateToken, heatingStationController.getStationById(pool));
router.post('/stations', authenticateToken, heatingStationController.createStation(pool));
router.patch('/stations/:id/status', authenticateToken, heatingStationController.updateStationStatus(pool));

// 供热数据记录路由
router.get('/heating-records', authenticateToken, heatingRecordController.getStationRecords(pool));
router.post('/heating-records', authenticateToken, heatingRecordController.addRecord(pool));

// 维修工单路由
router.get('/maintenance/orders', authenticateToken, maintenanceController.getOrders(pool));
router.post('/maintenance/orders', authenticateToken, maintenanceController.createOrder(pool));
router.patch('/maintenance/orders/:id/status', authenticateToken, maintenanceController.updateOrderStatus(pool));

// 报警管理路由
router.get('/alarms', authenticateToken, alarmController.getAlarms(pool));
router.post('/alarms', authenticateToken, alarmController.createAlarm(pool));
router.patch('/alarms/:id/status', authenticateToken, alarmController.updateAlarmStatus(pool));

// 能耗分析路由
router.get('/energy/consumption', authenticateToken, energyController.getEnergyConsumption(pool));
router.post('/energy/consumption', authenticateToken, energyController.addEnergyRecord(pool));
router.get('/energy/analysis', authenticateToken, energyController.getEnergyAnalysis(pool));

// 客户投诉路由
router.get('/complaints', authenticateToken, complaintController.getComplaints(pool));
router.post('/complaints', authenticateToken, complaintController.createComplaint(pool));
router.patch('/complaints/:id/status', authenticateToken, complaintController.updateComplaintStatus(pool));

// 设备管理路由
router.get('/equipment', authenticateToken, equipmentController.getEquipments(pool));
router.post('/equipment', authenticateToken, equipmentController.createEquipment(pool));
router.post('/equipment/maintenance', authenticateToken, equipmentController.addMaintenanceRecord(pool));

// 运营概览路由
router.get('/dashboard/overview', authenticateToken, dashboardController.getDashboardOverview(pool));
router.get('/dashboard/realtime', authenticateToken, dashboardController.getRealTimeMonitoring(pool));
router.get('/dashboard/performance', authenticateToken, dashboardController.getPerformanceAnalysis(pool));

export default router;