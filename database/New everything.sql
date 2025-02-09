
CREATE TABLE Levels (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Courses (
    id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Subjects (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(50) NOT NULL,  -- Դասի տեսակը
    level_id INT FOREIGN KEY REFERENCES Levels(id),
    course_id INT FOREIGN KEY REFERENCES Courses(id)
);

CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Rooms (
    id INT PRIMARY KEY IDENTITY(1,1),
    number NVARCHAR(50) UNIQUE NOT NULL
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

SELECT * FROM Levels;
SELECT * FROM Courses;
SELECT * FROM Subjects;
SELECT * FROM Teachers;
SELECT * FROM Rooms;
SELECT * FROM Subject_Teachers;
SELECT * FROM Subject_Rooms;
