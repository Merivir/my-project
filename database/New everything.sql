-- 🔹 1. Հիմնում ենք բազայի աղյուսակները
CREATE TABLE Weeks (
    id INT PRIMARY KEY IDENTITY(1,1),
    type NVARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE Days (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE TimeSlots (
    id INT PRIMARY KEY IDENTITY(1,1),
    slot NVARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE Types (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Courses (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Rooms (
    id INT PRIMARY KEY IDENTITY(1,1),
    number NVARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Subjects (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    type_id INT FOREIGN KEY REFERENCES Types(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id)
);

CREATE TABLE Schedule (
    id INT PRIMARY KEY IDENTITY(1,1),
    course_id INT FOREIGN KEY REFERENCES Courses(id),
    day_id INT FOREIGN KEY REFERENCES Days(id),
    week_id INT FOREIGN KEY REFERENCES Weeks(id),
    time_slot_id INT FOREIGN KEY REFERENCES TimeSlots(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
    subject_id INT FOREIGN KEY REFERENCES Subjects(id),
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    type_id INT FOREIGN KEY REFERENCES Types(id),
    details NVARCHAR(MAX)
);

CREATE TABLE Subject_Teachers (
    subject_id INT NOT NULL FOREIGN KEY REFERENCES Subjects(id),
    teacher_id INT NOT NULL FOREIGN KEY REFERENCES Teachers(id),
    PRIMARY KEY (subject_id, teacher_id)
);

CREATE TABLE Subject_Rooms (
    subject_id INT NOT NULL FOREIGN KEY REFERENCES Subjects(id),
    room_id INT NOT NULL FOREIGN KEY REFERENCES Rooms(id),
    PRIMARY KEY (subject_id, room_id)
);
GO

PRINT '✅ Բոլոր աղյուսակները հաջողությամբ ստեղծվեցին';

-- 🔹 2. Լրացնում ենք հիմնական տվյալները
INSERT INTO Weeks (type) VALUES (N'համարիչ'), (N'հայտարար');
INSERT INTO Days (name) VALUES (N'Երկուշաբթի'), (N'Երեքշաբթի'), (N'Չորեքշաբթի'), (N'Հինգշաբթի'), (N'Ուրբաթ');
INSERT INTO TimeSlots (slot) VALUES ('09:30-10:50'), ('11:00-12:20'), ('12:50-14:10'), ('14:20-15:40');
INSERT INTO Types (name) VALUES (N'Գործ'), (N'Գործ1'), (N'Գործ2'), (N'Գործ3'), (N'Գործ4'), (N'Գործ5'), (N'Դաս'), (N'Լաբ1'), (N'Լաբ2'), (N'Լաբ3'), (N'Լաբ4'), (N'Լաբ5');
GO

PRINT '✅ Տվյալները հաջողությամբ ավելացվեցին';


use schedule
SELECT * FROM Courses;
SELECT * FROM Subjects;
SELECT * FROM Teachers;
SELECT * FROM Rooms;
SELECT * FROM Weeks;
SELECT * FROM Days;
SELECT * FROM TimeSlots;
SELECT * FROM Schedule;
SELECT * FROM Levels;

SELECT 
    s.id, 
    s.course_id,  -- ✅ Տեսնենք, արդյոք `course_id`-ները կան
    c.id AS course_id_from_courses, 
    c.code AS course_code,  
    d.name AS day_name, 
    w.type AS week_type, 
    ts.slot AS time_slot, 
    r.number AS room_number, 
    sub.name AS subject_name, 
    t.name AS teacher_name, 
    ty.name AS type_name
FROM Schedule s
LEFT JOIN Courses c ON s.course_id = c.id  
JOIN Days d ON s.day_id = d.id
JOIN Weeks w ON s.week_id = w.id
JOIN TimeSlots ts ON s.time_slot_id = ts.id
JOIN Rooms r ON s.room_id = r.id
JOIN Subjects sub ON s.subject_id = sub.id
JOIN Teachers t ON s.teacher_id = t.id
JOIN Types ty ON s.type_id = ty.id
ORDER BY d.id, ts.id;
