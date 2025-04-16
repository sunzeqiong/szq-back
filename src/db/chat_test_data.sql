
-- 查看现有用户ID（假设我们用这个用户作为测试数据）
SELECT id FROM user LIMIT 1 INTO @user_id;

-- 插入测试聊天室
INSERT INTO chat_rooms (name, created_by) VALUES 
('系统通知', @user_id),
('技术支持', @user_id),
('供热交流', @user_id);

-- 获取插入的聊天室ID
SET @room1_id = LAST_INSERT_ID();
SET @room2_id = @room1_id + 1;
SET @room3_id = @room1_id + 2;

-- 将用户加入所有聊天室
INSERT INTO room_members (room_id, user_id) VALUES 
(@room1_id, @user_id),
(@room2_id, @user_id),
(@room3_id, @user_id);

-- 在每个聊天室插入一些测试消息
INSERT INTO messages (room_id, user_id, content) VALUES 
(@room1_id, @user_id, '欢迎使用智慧供热管理系统！'),
(@room1_id, @user_id, '系统已更新到最新版本v1.0.1'),
(@room2_id, @user_id, '如果遇到问题请在此反馈'),
(@room2_id, @user_id, '技术支持在线时间：工作日 9:00-18:00'),
(@room3_id, @user_id, '今日供热运行正常'),
(@room3_id, @user_id, '设备维护计划已更新，请查看');
