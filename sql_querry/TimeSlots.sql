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
