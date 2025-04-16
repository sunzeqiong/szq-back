
-- 关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 先删除已存在的相关表（如果需要重新创建）
DROP TABLE IF EXISTS message_reads;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS friendships;

-- 创建聊天室表
CREATE TABLE chat_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    room_type ENUM('private', 'group') NOT NULL,
    created_by INT NOT NULL,
    avatar VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- 创建聊天室成员表
CREATE TABLE room_members (
    room_id INT,
    user_id INT,
    nickname VARCHAR(255),
    role ENUM('owner', 'admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 创建消息表
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    msg_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 创建好友关系表
CREATE TABLE friendships (
    user_id INT,
    friend_id INT,
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
    remark VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (friend_id) REFERENCES user(id)
);

-- 开启外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 插入一些测试数据（可选）
INSERT INTO chat_rooms (name, room_type, created_by) 
SELECT '系统通知', 'group', id FROM user LIMIT 1;

SET @room_id = LAST_INSERT_ID();

-- 将所有用户加入系统通知群
INSERT INTO room_members (room_id, user_id, role)
SELECT @room_id, id, 'member' FROM user;

-- 设置第一个用户为群主
UPDATE room_members 
SET role = 'owner' 
WHERE room_id = @room_id 
AND user_id = (SELECT id FROM user ORDER BY id LIMIT 1);
