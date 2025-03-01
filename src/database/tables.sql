-- 首先检查并创建基础表（如果还未创建）
CREATE TABLE IF NOT EXISTS heating_station (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    area_covered DECIMAL(10,2) NOT NULL,
    capacity DECIMAL(10,2) NOT NULL,
    status ENUM('running', 'stopped', 'maintenance') NOT NULL,
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES user(id)
);

-- 检查已有的表:
-- heating_station (热力站)
-- heating_record (供热记录)
-- maintenance_order (维修工单)
-- billing_record (收费记录)
-- alarm_record (报警记录)
-- energy_consumption (能耗记录)
-- customer_complaint (客户投诉)
-- equipment (设备管理)
-- equipment_maintenance (设备维护记录)

-- 新增统计数据汇总表，用于存储历史统计数据
CREATE TABLE IF NOT EXISTS operation_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    total_heat_supply DECIMAL(15,2),       -- 总供热量
    total_power_consumption DECIMAL(15,2),  -- 总耗电量
    total_water_consumption DECIMAL(15,2),  -- 总耗水量
    average_efficiency DECIMAL(5,2),        -- 平均效率
    active_stations INT,                    -- 运行中的热力站数量
    fault_equipment_count INT,              -- 故障设备数量
    active_alarms_count INT,               -- 活跃报警数量
    pending_orders_count INT,              -- 待处理工单数量
    pending_complaints_count INT,          -- 待处理投诉数量
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_date` (date)
);

-- 新增系统指标表，用于存储关键性能指标
CREATE TABLE IF NOT EXISTS system_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    station_id INT NOT NULL,
    metric_type ENUM('temperature', 'pressure', 'flow', 'efficiency') NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    record_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES heating_station(id),
    INDEX `idx_station_type_time` (station_id, metric_type, record_time)
);

-- 新增运营目标表，用于存储和跟踪业务目标
CREATE TABLE IF NOT EXISTS operation_targets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    month INT NOT NULL,
    target_type ENUM('heat_supply', 'power_consumption', 'water_consumption', 'efficiency', 'customer_satisfaction') NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    actual_value DECIMAL(15,2),
    status ENUM('pending', 'in_progress', 'achieved', 'missed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_year_month_type` (year, month, target_type)
);

-- 新增定时任务记录表，用于记录数据统计任务的执行
CREATE TABLE IF NOT EXISTS statistics_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status ENUM('running', 'completed', 'failed') NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_task_type_status` (task_type, status)
);

-- 修正插入语句，删除重复的表名
INSERT INTO operation_targets 
(year, month, target_type, target_value, status) VALUES 
(2024, 1, 'heat_supply', 100000.00, 'in_progress'),
(2024, 1, 'power_consumption', 50000.00, 'in_progress'),
(2024, 1, 'water_consumption', 10000.00, 'in_progress'),
(2024, 1, 'efficiency', 90.00, 'in_progress'),
(2024, 1, 'customer_satisfaction', 95.00, 'in_progress');

-- 创建视图（确保所有依赖表都已创建）
DROP VIEW IF EXISTS v_operation_overview;
CREATE VIEW v_operation_overview AS
SELECT 
    DATE(NOW()) as current_date,
    (SELECT COUNT(*) FROM heating_station) as total_stations,
    (SELECT COUNT(*) FROM heating_station WHERE status = 'running') as running_stations,
    (SELECT COUNT(*) FROM alarm_record WHERE status = 'active') as active_alarms,
    (SELECT COUNT(*) FROM maintenance_order WHERE status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM customer_complaint WHERE status = 'pending') as pending_complaints,
    (SELECT AVG(efficiency) FROM energy_consumption WHERE date = CURDATE()) as today_avg_efficiency;

-- 向视图中插入测试数据前，确保基础表中有数据
INSERT INTO heating_station (name, address, area_covered, capacity, status, manager_id)
SELECT * FROM (
    SELECT '第一热力站', '城东区东风路123号', 50000.00, 20.00, 'running', 1
) AS tmp
WHERE NOT EXISTS (
    SELECT id FROM heating_station WHERE name = '第一热力站'
) LIMIT 1;
