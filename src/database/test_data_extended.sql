-- 报警记录测试数据
DELIMITER //
CREATE PROCEDURE insert_alarm_records()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE station INT;
  DECLARE alarm VARCHAR(20);
  DECLARE sev VARCHAR(20);
  WHILE i <= 100 DO
    SET station = FLOOR(1 + RAND() * 3);
    SET alarm = ELT(FLOOR(1 + RAND() * 4), 'temperature', 'pressure', 'equipment', 'security');
    SET sev = ELT(FLOOR(1 + RAND() * 4), 'low', 'medium', 'high', 'critical');
    INSERT INTO alarm_record 
    (station_id, alarm_type, severity, title, description, status, resolved_by, created_at)
    VALUES
    (station, 
     alarm,
     sev,
     CONCAT('报警-', alarm, '-', i),
     CONCAT('这是一条', alarm, '类型的报警，严重程度为', sev),
     ELT(FLOOR(1 + RAND() * 3), 'active', 'acknowledged', 'resolved'),
     IF(RAND() > 0.5, 1, NULL),
     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY));
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- 能耗记录测试数据
DELIMITER //
CREATE PROCEDURE insert_energy_records()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE station INT;
  DECLARE record_date DATE;
  WHILE i <= 100 DO
    SET station = FLOOR(1 + RAND() * 3);
    SET record_date = DATE_SUB(CURDATE(), INTERVAL i DAY);
    INSERT INTO energy_consumption 
    (station_id, date, heat_supply, power_consumption, water_consumption, efficiency)
    VALUES
    (station,
     record_date,
     ROUND(3000 + RAND() * 2000, 2),  -- 热量在3000-5000之间
     ROUND(500 + RAND() * 300, 2),     -- 电量在500-800之间
     ROUND(100 + RAND() * 50, 2),      -- 水量在100-150之间
     ROUND(75 + RAND() * 20, 2));      -- 效率在75-95之间
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- 客户投诉测试数据
DELIMITER //
CREATE PROCEDURE insert_complaint_records()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE comp_type VARCHAR(20);
  DECLARE comp_status VARCHAR(20);
  DECLARE comp_priority VARCHAR(20);
  WHILE i <= 100 DO
    SET comp_type = ELT(FLOOR(1 + RAND() * 5), 'temperature', 'service', 'billing', 'noise', 'other');
    SET comp_status = ELT(FLOOR(1 + RAND() * 4), 'pending', 'processing', 'resolved', 'closed');
    SET comp_priority = ELT(FLOOR(1 + RAND() * 3), 'low', 'medium', 'high');
    INSERT INTO customer_complaint 
    (customer_name, contact_phone, address, complaint_type, description, 
     status, priority, handler_id, created_at)
    VALUES
    (CONCAT('客户', i),
     CONCAT('1380000', LPAD(i, 4, '0')),
     CONCAT('测试地址', i),
     comp_type,
     CONCAT('这是一条关于', comp_type, '的投诉'),
     comp_status,
     comp_priority,
     IF(comp_status IN ('processing', 'resolved', 'closed'), 1, NULL),
     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY));
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- 设备测试数据
DELIMITER //
CREATE PROCEDURE insert_equipment_records()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE station INT;
  DECLARE equip_type VARCHAR(20);
  DECLARE equip_status VARCHAR(20);
  WHILE i <= 100 DO
    SET station = FLOOR(1 + RAND() * 3);
    SET equip_type = ELT(FLOOR(1 + RAND() * 6), 'pump', 'valve', 'sensor', 'meter', 'pipe', 'other');
    SET equip_status = ELT(FLOOR(1 + RAND() * 4), 'running', 'stopped', 'maintenance', 'fault');
    INSERT INTO equipment 
    (station_id, name, type, model, manufacturer, installation_date, 
     last_maintenance_date, next_maintenance_date, status, specifications)
    VALUES
    (station,
     CONCAT(equip_type, '-', i),
     equip_type,
     CONCAT('Model-', FLOOR(RAND() * 1000)),
     CONCAT('Manufacturer-', FLOOR(RAND() * 10)),
     DATE_SUB(CURDATE(), INTERVAL FLOOR(30 + RAND() * 365) DAY),
     DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY),
     DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY),
     equip_status,
     CONCAT('规格: 型号', FLOOR(RAND() * 1000)));
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- 设备维护记录测试数据
DELIMITER //
CREATE PROCEDURE insert_maintenance_records()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE equip INT;
  DECLARE maint_type VARCHAR(20);
  WHILE i <= 100 DO
    SET equip = FLOOR(1 + RAND() * 100);  -- 假设有100个设备
    SET maint_type = ELT(FLOOR(1 + RAND() * 3), 'routine', 'repair', 'replacement');
    INSERT INTO equipment_maintenance 
    (equipment_id, maintenance_type, description, maintenance_date, 
     cost, maintainer, notes)
    VALUES
    (equip,
     maint_type,
     CONCAT('这是一次', maint_type, '维护'),
     DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY),
     ROUND(1000 + RAND() * 9000, 2),
     CONCAT('维护人员', FLOOR(RAND() * 10)),
     CONCAT('维护记录备注', i));
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- 执行存储过程
CALL insert_alarm_records();
CALL insert_energy_records();
CALL insert_complaint_records();
CALL insert_equipment_records();
CALL insert_maintenance_records();

-- 删除存储过程
DROP PROCEDURE insert_alarm_records;
DROP PROCEDURE insert_energy_records;
DROP PROCEDURE insert_complaint_records;
DROP PROCEDURE insert_equipment_records;
DROP PROCEDURE insert_maintenance_records;
