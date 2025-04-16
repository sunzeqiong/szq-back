CREATE TABLE IF NOT EXISTS user_online_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    status TINYINT(1) NOT NULL COMMENT '状态：0-离线，1-在线',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
