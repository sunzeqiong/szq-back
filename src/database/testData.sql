-- 插入测试热力站
INSERT INTO heating_station 
(name, address, area_covered, capacity, status, manager_id) VALUES
('第一热力站', '城东区东风路123号', 50000.00, 20.00, 'running', 1),
('第二热力站', '城西区西湖路456号', 45000.00, 18.00, 'running', 1),
('第三热力站', '城南区阳光路789号', 35000.00, 15.00, 'maintenance', 1);

-- 插入测试供热记录
INSERT INTO heating_record 
(station_id, temperature_supply, temperature_return, pressure_supply, pressure_return, flow_rate, heat_supply, record_time) VALUES
(1, 75.5, 50.2, 0.6, 0.3, 150.5, 3750.8, NOW()),
(1, 76.0, 51.0, 0.62, 0.31, 152.0, 3800.5, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 74.8, 49.5, 0.58, 0.29, 145.5, 3650.2, NOW()),
(2, 75.2, 50.0, 0.59, 0.3, 147.0, 3680.4, DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- 插入测试工单
INSERT INTO maintenance_order 
(station_id, title, description, priority, status, reporter_id, assignee_id) VALUES
(1, '一号泵故障', '供热一号泵出现异常噪音，需要检修', 'high', 'pending', 1, 1),
(2, '压力表更换', '二号站压力表显示不准，需要更换新的', 'medium', 'processing', 1, 1),
(3, '管道泄漏', '三号站地下管道疑似泄漏，需要检查维修', 'urgent', 'processing', 1, 1);

-- 插入测试收费记录
INSERT INTO billing_record 
(customer_name, address, area, unit_price, amount, paid_amount, payment_status, billing_period_start, billing_period_end) VALUES
('张三', '东风路123号2单元301', 120.5, 30.00, 3615.00, 3615.00, 'paid', '2023-11-01', '2023-11-30'),
('李四', '西湖路456号1单元102', 85.8, 30.00, 2574.00, 1500.00, 'partial', '2023-11-01', '2023-11-30'),
('王五', '阳光路789号3单元501', 95.2, 30.00, 2856.00, 0.00, 'unpaid', '2023-11-01', '2023-11-30');
