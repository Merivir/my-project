-- Teachers
INSERT INTO Teachers (name) VALUES ('John Doe'), ('Jane Smith'), ('Alex Brown');

-- Rooms
INSERT INTO Rooms (name, capacity) VALUES ('Room 101', 30), ('Room 102', 20), ('Room 103', 25);

-- Groups
INSERT INTO Groups (name, size) VALUES ('Group A', 20), ('Group B', 25);

-- Subjects
INSERT INTO Subjects (name, teacher_id) VALUES ('Math', 1), ('Physics', 2), ('History', 3);

-- TimeSlots
INSERT INTO TimeSlots (start_time, end_time) VALUES ('09:00', '10:30'), ('11:00', '12:30'), ('13:00', '14:30');
