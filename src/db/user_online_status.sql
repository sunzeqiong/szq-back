-- 检查 is_online 字段是否存在，不存在则添加
SET @exist_is_online := (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user' 
    AND COLUMN_NAME = 'is_online'
);

SET @sql_add_is_online := IF(
    @exist_is_online = 0,
    'ALTER TABLE `user` ADD COLUMN `is_online` TINYINT(1) DEFAULT 0 COMMENT "在线状态：0-离线，1-在线"',
    'SELECT "is_online column already exists"'
);

PREPARE stmt FROM @sql_add_is_online;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查 last_active 字段是否存在，不存在则添加
SET @exist_last_active := (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user' 
    AND COLUMN_NAME = 'last_active'
);

SET @sql_add_last_active := IF(
    @exist_last_active = 0,
    'ALTER TABLE `user` ADD COLUMN `last_active` TIMESTAMP NULL DEFAULT NULL COMMENT "最后活跃时间"',
    'SELECT "last_active column already exists"'
);

PREPARE stmt FROM @sql_add_last_active;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
