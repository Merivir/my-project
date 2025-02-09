CREATE TABLE Subjects (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL
);

-- Пример данных
INSERT INTO Subjects (name) VALUES 
(N'Մաթանալիզ'), (N'Ֆիզիկա'), (N'ԱԵ և ԳՀ'), (N'Ինֆորմատիկա');
