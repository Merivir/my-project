USE schedule;

-- Удаляем связи между таблицами
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Subject_Teachers')
    ALTER TABLE Subject_Teachers DROP CONSTRAINT IF EXISTS FK_Subject_Teachers_Subjects;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Subject_Rooms')
    ALTER TABLE Subject_Rooms DROP CONSTRAINT IF EXISTS FK_Subject_Rooms_Subjects;

-- Удаляем таблицы, если они существуют
DROP TABLE IF EXISTS Subject_Teachers;
DROP TABLE IF EXISTS Subject_Rooms;
DROP TABLE IF EXISTS Subjects;
DROP TABLE IF EXISTS Teachers;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS TimeSlotsNew;
DROP TABLE IF EXISTS Days;
DROP TABLE IF EXISTS Levels;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Type;

