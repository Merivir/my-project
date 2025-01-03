CREATE TABLE Teachers (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL
);

-- Пример данных
INSERT INTO Teachers (name) VALUES (N'Ուսեպյան'), (N'Ղուկասյան'), (N'Մարտիրոսյան');
