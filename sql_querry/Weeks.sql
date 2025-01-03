CREATE TABLE Weeks (
    id INT PRIMARY KEY IDENTITY(1,1),
    type NVARCHAR(50) NOT NULL, -- Например, "Համարիչ" или "Հայտարար"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- Пример данных
INSERT INTO Weeks (type, start_date, end_date) 
VALUES ('Համարիչ', '2024-01-01', '2024-01-07'), ('Հայտարար', '2024-01-08', '2024-01-14');
