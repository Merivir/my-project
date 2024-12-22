CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(50) NOT NULL
);

CREATE TABLE Rooms (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(50) NOT NULL,
    capacity INT
);

CREATE TABLE Groups (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(50) NOT NULL,
    size INT
);

CREATE TABLE Subjects (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(50) NOT NULL,
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id)
);

CREATE TABLE TimeSlots (
    id INT PRIMARY KEY IDENTITY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE Schedule (
    id INT PRIMARY KEY IDENTITY,
    group_id INT FOREIGN KEY REFERENCES Groups(id),
    subject_id INT FOREIGN KEY REFERENCES Subjects(id),
    teacher_id INT FOREIGN KEY REFERENCES Teachers(id),
    room_id INT FOREIGN KEY REFERENCES Rooms(id),
    time_slot_id INT FOREIGN KEY REFERENCES TimeSlots(id),
    day_of_week TINYINT NOT NULL
);
