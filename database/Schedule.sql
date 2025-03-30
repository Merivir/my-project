use schedule
-- 🔹 1. Ստեղծում ենք Levels աղյուսակը
CREATE TABLE Levels (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) UNIQUE NOT NULL
);

-- 🔹 2. Ստեղծում ենք Courses (դասընթացները)
CREATE TABLE Courses (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) UNIQUE NOT NULL
);



-- 🔹 4. Ստեղծում ենք Types (Դաս, Լաբ, Գործ)
CREATE TABLE Types (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) UNIQUE NOT NULL
);

-- 🔹 5. Ստեղծում ենք Teachers (դասախոսները)
CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) UNIQUE NOT NULL
);
-- Ավելացնում ենք սյունակները առանց կոնստրեյնթից
ALTER TABLE Teachers
ADD 
  login NVARCHAR(100),
  password NVARCHAR(255),
  email NVARCHAR(255),
  verification_code NVARCHAR(6);

-- Թարմացնում ենք բոլոր ուսուցիչների համար հատուկ login արժեքներ,
-- օրինակ՝ polytech_teacher_001, polytech_teacher_002, ...
UPDATE Teachers
SET login = CONCAT('polytech_teacher_', RIGHT('000' + CAST(id AS VARCHAR(3)), 3))
WHERE login IS NULL;

-- Թարմացնում ենք email-ը բոլոր ուսուցիչների համար, եթե չի իսկապես մուտքագրվել:
UPDATE Teachers
SET email = 'meri.virabyan121@gmail.com'
WHERE email IS NULL;

-- Հավելում ենք UNIQUE ինդեքսը login-ի համար միայն այն գրառումների վրա, որտեղ login-ը !== NULL
CREATE UNIQUE INDEX IX_Teachers_login ON Teachers(login) WHERE login IS NOT NULL;



-- 🔹 6. Ստեղծում ենք Rooms (սենյակները)
CREATE TABLE Rooms (
    id INT PRIMARY KEY IDENTITY(1,1),
    number NVARCHAR(50) UNIQUE NOT NULL
);

-- 🔹 3. Ստեղծում ենք Subjects (առարկաները)
CREATE TABLE Subjects (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id) ON DELETE SET NULL,
    room_id INT FOREIGN KEY REFERENCES Rooms(id) ON DELETE SET NULL
);

-- 🔹 7. Ստեղծում ենք Weekly (weekly, biweekly)
CREATE TABLE Weekly (
    id INT PRIMARY KEY IDENTITY(1,1),
    type NVARCHAR(20) UNIQUE NOT NULL  -- 'weekly' կամ 'biweekly'
);

-- 🔹 8. Ստեղծում ենք Weeks (համարիչ / հայտարար)
CREATE TABLE Weeks (
    id INT PRIMARY KEY IDENTITY(1,1),
    type NVARCHAR(20) UNIQUE NOT NULL
);

-- 🔹 9. Ստեղծում ենք Days (օրերը)
CREATE TABLE Days (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(20) UNIQUE NOT NULL
);

-- 🔹 10. Ստեղծում ենք TimeSlots (ժամանակացույց)
CREATE TABLE TimeSlots (
    id INT PRIMARY KEY IDENTITY(1,1),
    slot NVARCHAR(20) UNIQUE NOT NULL
);

-- 🔹 11. Ստեղծում ենք Schedule (Հիմնական դասացուցակ)
CREATE TABLE Schedule (
    id INT PRIMARY KEY IDENTITY(1,1),
    level_id INT FOREIGN KEY REFERENCES Levels(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id),
    subject_id INT FOREIGN KEY REFERENCES Subjects(id),
    type_id INT FOREIGN KEY REFERENCES Types(id),
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
    week_id INT FOREIGN KEY REFERENCES Weeks(id),
    day_id INT FOREIGN KEY REFERENCES Days(id),
    time_slot_id INT FOREIGN KEY REFERENCES TimeSlots(id),
    weekly_id INT FOREIGN KEY REFERENCES Weekly(id),
    details NVARCHAR(MAX)
);

CREATE TABLE schedule_editable (
    id INT PRIMARY KEY IDENTITY(1,1),
    level_id INT FOREIGN KEY REFERENCES Levels(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id),
    subject_id INT FOREIGN KEY REFERENCES Subjects(id),
    type_id INT FOREIGN KEY REFERENCES Types(id),
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
    week_id INT FOREIGN KEY REFERENCES Weeks(id),
    day_id INT FOREIGN KEY REFERENCES Days(id),
    time_slot_id INT FOREIGN KEY REFERENCES TimeSlots(id),
    weekly_id INT FOREIGN KEY REFERENCES Weekly(id),
    details NVARCHAR(MAX)
);


GO

PRINT '✅ Բոլոր աղյուսակները հաջողությամբ ստեղծվեցին';

-- 🔹 2. Լրացնում ենք հիմնական տվյալները
INSERT INTO Days (name) VALUES (N'Երկուշաբթի'), (N'Երեքշաբթի'), (N'Չորեքշաբթի'), (N'Հինգշաբթի'), (N'Ուրբաթ');
INSERT INTO TimeSlots (slot) VALUES ('09:30-10:50'), ('11:00-12:20'), ('12:50-14:10'), ('14:20-15:40');
INSERT INTO Types (name) VALUES (N'Գործ'), (N'Գործ1'), (N'Գործ2'), (N'Գործ3'), (N'Գործ4'), (N'Գործ5'), (N'Դաս'), (N'Լաբ1'), (N'Լաբ2'), (N'Լաբ3'), (N'Լաբ4'), (N'Լաբ5');
INSERT INTO Levels (name) VALUES (N'Առաջին'), (N'Երկրորդ'), (N'Երրորդ'), (N'Չորրորդ'); 
-- 🔹 Weeks աղյուսակի համար
INSERT INTO Weeks (type) VALUES (N'համարիչ'), (N'հայտարար'), (N'երկուսն էլ');
INSERT INTO Weekly (type) VALUES (N'weekly'), (N'biweekly');


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

SELECT name FROM sys.tables;


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
WHERE s.id = 1096;
--ORDER BY d.id, ts.id;


USE schedule;
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Subjects';

