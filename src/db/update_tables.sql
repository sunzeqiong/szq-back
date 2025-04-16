-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 修改 friendships 表
ALTER TABLE friendships 
DROP PRIMARY KEY,
ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST,
ADD UNIQUE KEY `unique_friendship` (user_id, friend_id);

-- 修改 room_members 表
ALTER TABLE room_members 
DROP PRIMARY KEY,
ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST,
ADD UNIQUE KEY `unique_membership` (room_id, user_id);

-- 修改 message_reads 表
ALTER TABLE message_reads 
DROP PRIMARY KEY,
ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST,
ADD UNIQUE KEY `unique_message_read` (message_id, user_id);

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;
