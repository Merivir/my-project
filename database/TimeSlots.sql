CREATE TABLE TimeSlots (
    id INT PRIMARY KEY IDENTITY(1,1),
    slot NVARCHAR(50) NOT NULL, -- Например, "1-2"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Пример данных
INSERT INTO TimeSlots (slot, start_time, end_time) 
VALUES ('1-2', '09:30', '10:50'), ('3-4', '11:00', '12:20'), 
	   ('5-6', '12:50', '14:10'), ('7-8', '14:20', '15:40'),
	   ('9-10', '15:50', '17:10');

CREATE TABLE TimeSlots (
    id INT PRIMARY KEY,
    slot VARCHAR(10),
    start_time TIME,
    end_time TIME
);

DROP TABLE TimeSlots;

CREATE TABLE TimeSlots (
    id INT PRIMARY KEY,
    slot VARCHAR(10),
    start_time TIME,
    end_time TIME
);

INSERT INTO TimeSlots (id, slot, start_time, end_time)
VALUES 
    (1, '1-2', '09:30:00', '10:50:00'),
    (2, '3-4', '11:00:00', '12:20:00'),
    (3, '5-6', '12:50:00', '14:10:00'),
    (4, '7-8', '14:20:00', '15:40:00'),
    (5, '9-10', '15:50:00', '17:10:00');


INSERT INTO TimeSlotsNew (id, slot, start_time, end_time)
SELECT 
    id, 
    CASE 
        WHEN id = 1 THEN '1-2'
        WHEN id = 2 THEN '3-4'
        WHEN id = 3 THEN '5-6'
        WHEN id = 4 THEN '7-8'
        WHEN id = 5 THEN '9-10'
    END AS slot,
    start_time,
    end_time
FROM TimeSlots;

ALTER TABLE Schedule DROP CONSTRAINT FK__Schedule__time_s__451F3D2B;

DROP TABLE TimeSlotsNew;

EXEC sp_rename 'TimeSlotsNew', 'TimeSlots';

select * from TimeSlotsNew

ALTER TABLE Schedule
ADD CONSTRAINT FK__Schedule__time_s__451F3D2B FOREIGN KEY (time_slot_id) REFERENCES TimeSlots(id);

SELECT * FROM Schedule;
