use schedule

CREATE TABLE schedule_editable (
    id INT PRIMARY KEY IDENTITY(1,1),
    level_id INT FOREIGN KEY REFERENCES Levels(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id),
    subject_id INT FOREIGN KEY REFERENCES subjects_editable(id),
    type_id INT FOREIGN KEY REFERENCES Types(id),
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
    week_id INT FOREIGN KEY REFERENCES Weeks(id),
    day_id INT FOREIGN KEY REFERENCES Days(id),
    time_slot_id INT FOREIGN KEY REFERENCES TimeSlots(id),
    weekly_id INT FOREIGN KEY REFERENCES Weekly(id),
    details NVARCHAR(MAX)
);

CREATE TABLE subjects_editable (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
);

SET IDENTITY_INSERT schedule_editable ON;

INSERT INTO schedule_editable (id, level_id, course_id, subject_id, type_id, teacher_id, room_id, week_id, day_id, time_slot_id, weekly_id, details)
SELECT id, level_id, course_id, subject_id, type_id, teacher_id, room_id, week_id, day_id, time_slot_id, weekly_id, details
FROM schedule;

SET IDENTITY_INSERT schedule_editable OFF;

INSERT INTO subjects_editable (name, teacher_id, room_id)
SELECT name, teacher_id, room_id FROM Subjects;


SELECT * FROM Schedule
SELECT * FROM Subjects
select * from schedule_editable
select * from subjects_editable

DROP TABLE IF EXISTS schedule_editable;
DROP TABLE IF EXISTS subjects_editable;