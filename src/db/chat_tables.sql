-- 先检查并删除已存在的外键约束
SET FOREIGN_KEY_CHECKS = 0;

-- 聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    room_type ENUM('private', 'group') NOT NULL DEFAULT 'group', -- 添加聊天室类型
    avatar VARCHAR(255), -- 群聊头像
    description TEXT,   -- 群聊描述
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- 聊天室成员表
CREATE TABLE IF NOT EXISTS room_members (
    room_id INT,
    user_id INT,
    role ENUM('owner', 'admin', 'member') DEFAULT 'member', -- 成员角色
    nickname VARCHAR(255), -- 群聊中的昵称
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    msg_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text', -- 消息类型
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent', -- 消息状态
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 消息已读表（用于跟踪消息已读状态）
CREATE TABLE IF NOT EXISTS message_reads (
    message_id INT,
    user_id INT,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

SET FOREIGN_KEY_CHECKS = 1;
