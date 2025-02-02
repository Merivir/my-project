CREATE TABLE Schedule (
    id INT PRIMARY KEY IDENTITY(1,1),
    day_id INT NOT NULL FOREIGN KEY REFERENCES Days(id),
    week_id INT NOT NULL FOREIGN KEY REFERENCES Weeks(id),
    time_slot_id INT NOT NULL FOREIGN KEY REFERENCES TimeSlots(id),
    room_id INT NOT NULL FOREIGN KEY REFERENCES Rooms(id),
    subject_id INT NOT NULL FOREIGN KEY REFERENCES Subjects(id),
    teacher_id INT NOT NULL FOREIGN KEY REFERENCES Teachers(id),
    group_id INT NOT NULL FOREIGN KEY REFERENCES Groups(id),
    type_id INT NOT NULL FOREIGN KEY REFERENCES Type(id), -- Correctly reference the Type table
    details NVARCHAR(MAX) -- JSON-данные
);

INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id, details)
VALUES (1, 1, 1, 1, 1, 1, 1, 1, '{"format": "online", "notes": "Bring a calculator"}');

INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id, details)
VALUES (2, 2, 3, 2, 2, 2, 2, 2, '{"format": "offline", "notes": "Bring a notebook"}');

INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id, details)
VALUES 
(3, 1, 2, 3, 3, 2, 2, 2, '{"format": "offline", "zoom_link": "", "notes": "Lab materials required"}'),
(4, 2, 4, 2, 2, 2, 2, 2, '{"format": "online", "zoom_link": "https://zoom.us/j/987654321", "notes": "Lecture will be recorded"}'),
(5, 1, 1, 2, 2, 2, 2, 2, '{"format": "offline", "notes": "Group presentation today"}');
 


select * from schedule

