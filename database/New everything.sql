use schedule-- 1. Уровни обучения (Например: Первый, Второй курс и т.д.)
CREATE TABLE Levels (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) UNIQUE NOT NULL
);

-- 2. Курсы (Например: МԹ440, ИТ407)
CREATE TABLE Courses (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) UNIQUE NOT NULL
);

-- 3. Преподаватели
CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) UNIQUE NOT NULL
);

-- 4. Аудитории
CREATE TABLE Rooms (
    id INT PRIMARY KEY IDENTITY(1,1),
    number NVARCHAR(50) UNIQUE NOT NULL
);

-- 5. Дни недели
CREATE TABLE Days (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(20) UNIQUE NOT NULL
);

-- 6. Временные слоты (Например, 09:30-10:50, 11:00-12:20)
CREATE TABLE TimeSlots (
    id INT PRIMARY KEY IDENTITY(1,1),
    slot NVARCHAR(20) UNIQUE NOT NULL
);

-- 7. Недели (Например: Номер недели, четная/нечетная)
CREATE TABLE Weeks (
    id INT PRIMARY KEY IDENTITY(1,1),
    type NVARCHAR(20) UNIQUE NOT NULL
);

-- 8. Типы занятий (Лекция, Групповая работа, Лабораторная и т.д.)
CREATE TABLE Types (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) UNIQUE NOT NULL
);

-- 10. Предметы
CREATE TABLE Subjects (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    type_id INT FOREIGN KEY REFERENCES Types(id),
    level_id INT FOREIGN KEY REFERENCES Levels(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id)
);

-- 11. Расписание (Основная таблица) – նորացված
CREATE TABLE Schedule (
    id INT PRIMARY KEY IDENTITY(1,1),
    course_id INT FOREIGN KEY REFERENCES Courses(id),  -- Ավելացվեց՝ երկրորդ սյուն
    day_id INT FOREIGN KEY REFERENCES Days(id),
    week_id INT FOREIGN KEY REFERENCES Weeks(id),
    time_slot_id INT FOREIGN KEY REFERENCES TimeSlots(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
    subject_id INT FOREIGN KEY REFERENCES Subjects(id),
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    type_id INT FOREIGN KEY REFERENCES Types(id),
    details NVARCHAR(MAX)  -- JSON-поле для хранения доп. данных (например, формат, онлайн-ссылка и т.д.)
);




-- 12. Связь Преподаватель - Предмет
CREATE TABLE Subject_Teachers (
    subject_id INT NOT NULL FOREIGN KEY REFERENCES Subjects(id),
    teacher_id INT NOT NULL FOREIGN KEY REFERENCES Teachers(id),
    PRIMARY KEY (subject_id, teacher_id)
);

-- 13. Связь Предмет - Аудитория
CREATE TABLE Subject_Rooms (
    subject_id INT NOT NULL FOREIGN KEY REFERENCES Subjects(id),
    room_id INT NOT NULL FOREIGN KEY REFERENCES Rooms(id),
    PRIMARY KEY (subject_id, room_id)
);
use schedule 

select * from schedule
SELECT COUNT(*) FROM Schedule;
select * from Types
SELECT * FROM Schedule 
INNER JOIN Subjects ON Schedule.subject_id = Subjects.id
INNER JOIN Teachers ON Schedule.teacher_id = Teachers.id
INNER JOIN Rooms ON Schedule.room_id = Rooms.id;

SELECT * FROM Days;
SELECT * FROM Weeks;
SELECT * FROM TimeSlots;
Select * from Courses


USE schedule;
SELECT name FROM sys.tables;
Select * from Courses;
SELECT * FROM Types;

SELECT 
    s.id,
    c.code AS course_code,  -- Ավելացնում ենք կուրսի կոդը
    d.name AS day_name,
    w.type AS week_type,
    ts.slot AS time_slot,
    r.number AS room_number,
    sub.name AS subject_name,
    t.name AS teacher_name,
    ty.name AS type_name,
    s.details
FROM Schedule s
JOIN Days d ON s.day_id = d.id
JOIN Weeks w ON s.week_id = w.id
JOIN TimeSlots ts ON s.time_slot_id = ts.id
JOIN Rooms r ON s.room_id = r.id
JOIN Subjects sub ON s.subject_id = sub.id
JOIN Courses c ON sub.course_id = c.id   -- Հետևենք Courses աղյուսակի միջոցով, քանի որ Subjects–ում course_id-ն պահվում է
JOIN Teachers t ON s.teacher_id = t.id
JOIN Types ty ON s.type_id = ty.id
ORDER BY 
    d.id, ts.id;

SELECT 
    s.id,
    s.course_code,
    d.name AS day_name,
    w.type AS week_type,
    ts.slot AS time_slot,
    STRING_AGG(r.number, ', ') AS room_numbers,
    sub.name AS subject_name,
    STRING_AGG(t.name, ', ') AS teacher_names,
    ty.name AS type_name,
    s.details
FROM Schedule s
JOIN Days d ON s.day_id = d.id
JOIN Weeks w ON s.week_id = w.id
JOIN TimeSlots ts ON s.time_slot_id = ts.id
JOIN Subjects sub ON s.subject_id = sub.id
JOIN Types ty ON s.type_id = ty.id
LEFT JOIN Subject_Rooms sr ON sr.subject_id = sub.id
LEFT JOIN Rooms r ON sr.room_id = r.id
LEFT JOIN Subject_Teachers st ON st.subject_id = sub.id
LEFT JOIN Teachers t ON st.teacher_id = t.id
GROUP BY 
    s.id, s.course_code, d.name, w.type, ts.slot, sub.name, ty.name, s.details;
