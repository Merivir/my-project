CREATE TABLE Rooms (
    id INT PRIMARY KEY IDENTITY(1,1),
    room_number NVARCHAR(50) NOT NULL
);

-- Пример данных
INSERT INTO Rooms (room_number) 
VALUES ('5216'), ('5310'), ('5211'), ('5214'), ('5307'), ('5211');
