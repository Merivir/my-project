-- 🔹 1. Հեռացնում ենք FOREIGN KEY-ները բոլոր աղյուսակներից
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys;

EXEC sp_executesql @sql;
GO

-- 🔹 2. Ջնջում ենք բոլոր աղյուսակները ճիշտ հերթականությամբ
DROP TABLE IF EXISTS Subject_Teachers;
DROP TABLE IF EXISTS Subject_Rooms;
DROP TABLE IF EXISTS Schedule;
DROP TABLE IF EXISTS Subjects;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Teachers;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS Days;
DROP TABLE IF EXISTS TimeSlots;
DROP TABLE IF EXISTS Weeks;
DROP TABLE IF EXISTS Types;
GO

PRINT '✅ Բոլոր աղյուսակները հաջողությամբ ջնջվեցին';
