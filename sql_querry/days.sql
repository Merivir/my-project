CREATE TABLE Days (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL
);

-- Пример данных
INSERT INTO Days (name) VALUES (N'Երկուշաբթի'), (N'Երեքշաբթի'), (N'Չորեքշաբթի'), (N'Հինգշաբթի'), (N'Ուրբաթ');

