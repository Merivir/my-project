INSERT INTO Teachers (name) VALUES
('Иванов Иван'), 
('Петров Петр');

INSERT INTO Rooms (name, capacity) VALUES
('Ауд. 5214', 30),
('Ауд. 5306', 25);

INSERT INTO Groups (name, size) VALUES
('Группа 1', 20),
('Группа 2', 25);

INSERT INTO Subjects (name, teacher_id) VALUES
('Математика', 1), 
('Физика', 2);

INSERT INTO TimeSlots (start_time, end_time) VALUES
('09:30', '10:50'),
('11:00', '12:20'),
('12:50', '14:10'),
('14:20', '15:40'),
('15:50', '17:10');

