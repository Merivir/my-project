CREATE TABLE Groups (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL
);

-- Пример данных
INSERT INTO Groups (name) VALUES (N'SS119'), (N'SS120'), (N'SS155'), (N'SS161');
