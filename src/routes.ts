import { Router } from 'express';
import { createUserRoutes } from './controller/userController';
import { refreshToken } from './controller/tokenController';
import * as heatingStationController from './controller/admin/heatingStationController';
import * as heatingRecordController from './controller/admin/heatingRecordController';
import * as maintenanceController from './controller/admin/maintenanceController';
import { authenticateToken } from './middleware/auth';
import pool from './db';
import * as alarmController from './controller/admin/alarmController';
import * as energyController from './controller/admin/energyController';
import * as complaintController from './controller/admin/complaintController';
import * as equipmentController from './controller/admin/equipmentController';
import * as dashboardController from './controller/admin/dashboardController';
import { messageRoutes } from './controller/chat/messageController';
import { RoomController, createRoomRoutes } from './controller/chat/roomController';
import { createFriendRoutes } from './controller/chat/friendController';

const router = Router();
const roomController = new RoomController(pool);
const roomRoutes = createRoomRoutes(roomController);
const messageController = messageRoutes(pool);
const friendRoutes = createFriendRoutes(pool);

// 用户认证相关路由
const userRoutes = createUserRoutes(pool);
router.post('/auth/register', userRoutes.register);
router.post('/auth/login', userRoutes.login);
router.post('/auth/refresh-token', refreshToken(pool));

// 用户相关路由
router.get('/users', authenticateToken, userRoutes.getAllUsers);
router.get('/users/search', authenticateToken, userRoutes.searchUsers); // 添加搜索用户路由
router.post('/auth/logout', authenticateToken, userRoutes.logout);      // 添加登出路由

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

// 消息相关路由
router.post('/messages', authenticateToken, messageController.sendMessage);
router.get('/messages', authenticateToken, messageController.getMessages);
router.delete('/messages/:messageId', authenticateToken, messageController.deleteMessage);

// 聊天室相关路由
router.post('/rooms', authenticateToken, roomRoutes.createRoom);
router.post('/rooms/:roomId/join', authenticateToken, roomRoutes.joinRoom);
router.post('/rooms/:roomId/leave', authenticateToken, roomRoutes.leaveRoom);
router.get('/rooms', authenticateToken, roomRoutes.getRooms);
router.post('/rooms/private/:userId', authenticateToken, roomRoutes.getOrCreatePrivateRoom);

// 好友相关路由
router.get('/friends', authenticateToken, friendRoutes.getFriends);
router.post('/friends/add', authenticateToken, friendRoutes.addFriend);
router.post('/friends/handle-request', authenticateToken, friendRoutes.handleFriendRequest);
router.delete('/friends/:friendId', authenticateToken, friendRoutes.deleteFriend);
router.get('/friends/requests', authenticateToken, friendRoutes.getFriendRequests);

export default router;