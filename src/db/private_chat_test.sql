
-- 创建私人聊天室
INSERT INTO chat_rooms (name, created_by) VALUES 
('孙泽琼-唐三藏', 1);  -- 用孙泽琼创建聊天室

-- 获取新创建的聊天室ID
SET @private_room_id = LAST_INSERT_ID();

-- 将两个用户都加入到聊天室
INSERT INTO room_members (room_id, user_id) VALUES 
(@private_room_id, 1),  -- 孙泽琼
(@private_room_id, 2);  -- 唐三藏

-- 插入一些测试对话消息
INSERT INTO messages (room_id, user_id, content) VALUES 
(@private_room_id, 1, '唐三藏师父，最近供热系统运行如何？'),
(@private_room_id, 2, '阿弥陀佛，系统运行良好，没有发现异常'),
(@private_room_id, 1, '那就好，记得定期检查设备维护状态'),
(@private_room_id, 2, '贫僧明白，已经安排好了维护计划');
