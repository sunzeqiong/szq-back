-- 临时关闭安全模式
SET SQL_SAFE_UPDATES = 0;

-- 添加新字段
ALTER TABLE `user` 
ADD COLUMN `nick_name` varchar(255) NOT NULL AFTER `username`;

-- 将现有username数据复制到nick_name
UPDATE `user` SET `nick_name` = `username`;

-- 更新唯一约束
ALTER TABLE `user` ADD UNIQUE KEY `nick_name` (`nick_name`);

-- 如果需要保留原username字段，可以不执行以下语句
-- ALTER TABLE `user` DROP COLUMN `username`;

-- 恢复安全模式
SET SQL_SAFE_UPDATES = 1;
