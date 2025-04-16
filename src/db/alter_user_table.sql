
-- 添加新字段到用户表
ALTER TABLE `user`
ADD COLUMN `avatar` varchar(255) DEFAULT NULL COMMENT '用户头像URL' AFTER `email`,
ADD COLUMN `signature` varchar(500) DEFAULT NULL COMMENT '个性签名' AFTER `avatar`,
ADD COLUMN `is_online` tinyint(1) DEFAULT 0 COMMENT '在线状态：0-离线，1-在线' AFTER `signature`;

-- 为现有数据设置默认值（可选）
UPDATE `user` SET
  `avatar` = 'default-avatar.png',
  `signature` = '这个人很懒，什么都没留下',
  `is_online` = 0
WHERE `avatar` IS NULL;
