USE schedule;

CREATE TABLE admins (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(100) NOT NULL
);

CREATE TABLE schedule (
    id INT IDENTITY(1,1) PRIMARY KEY,
    institute NVARCHAR(100) NOT NULL,
    subject NVARCHAR(100) NOT NULL,
    teacher NVARCHAR(100) NOT NULL,
    time NVARCHAR(50) NOT NULL,
    day NVARCHAR(50) NOT NULL
);

EXEC sp_rename 'Schedule', 'Schedule_Old';
