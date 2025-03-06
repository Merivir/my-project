-- Ստեղծում ենք created_schedule աղյուսակը, նոր CHECK սահմանմամբ
CREATE TABLE created_schedule (
    id INT IDENTITY(1,1) PRIMARY KEY,
    [level] NVARCHAR(255) NOT NULL,
    course NVARCHAR(255) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    type NVARCHAR(255) NOT NULL,
    mapped_type NVARCHAR(255) NOT NULL,
    teachers NVARCHAR(MAX) NOT NULL,  -- JSON string
    rooms NVARCHAR(MAX) NOT NULL,       -- JSON string
    preferred_slots NVARCHAR(MAX) NOT NULL, -- JSON string
    day_of_week INT NOT NULL,  -- 1=Monday, ..., 7=Sunday
    time_of_day INT NOT NULL,  -- Time slot (1-4)
    week_type NVARCHAR(50) NOT NULL
);

-- Ստեղծում ենք conflicts աղյուսակը
CREATE TABLE conflicts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    course1 NVARCHAR(255) NOT NULL,
    subject1 NVARCHAR(255) NOT NULL,
    course2 NVARCHAR(255) NOT NULL,
    subject2 NVARCHAR(255) NOT NULL,
    issue NVARCHAR(255) NOT NULL  -- Description of the conflict
);


-- SELECT հարցեր՝ աղյուսակները ստուգելու համար
SELECT * FROM created_schedule;
SELECT * FROM conflicts;

-- Ջնջում ենք աղյուսակները, եթե անհրաժեշտ է
DROP TABLE IF EXISTS created_schedule;
DROP TABLE IF EXISTS conflicts;
