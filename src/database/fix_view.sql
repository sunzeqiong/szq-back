USE your_database_name;  -- 替换为你的实际数据库名

DROP VIEW IF EXISTS v_operation_overview;
CREATE VIEW v_operation_overview AS
SELECT 
    DATE(NOW()) as report_date,    -- 改用 report_date 而不是 current_date
    (SELECT COUNT(*) FROM heating_station) as total_stations,
    (SELECT COUNT(*) FROM heating_station WHERE status = 'running') as running_stations,
    (SELECT COUNT(*) FROM alarm_record WHERE status = 'active') as active_alarms,
    (SELECT COUNT(*) FROM maintenance_order WHERE status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM customer_complaint WHERE status = 'pending') as pending_complaints,
    (SELECT AVG(efficiency) FROM energy_consumption WHERE date = CURDATE()) as today_avg_efficiency;

-- 验证视图
SELECT * FROM v_operation_overview;
