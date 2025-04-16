ALTER TABLE chat_rooms
ADD COLUMN room_type ENUM('private', 'group') DEFAULT 'group'
AFTER created_by;
