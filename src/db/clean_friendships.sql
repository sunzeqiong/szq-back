-- 临时关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 清空 friendships 表
TRUNCATE TABLE friendships;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;
