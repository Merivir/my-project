CREATE TABLE Schedule (
    id INT PRIMARY KEY IDENTITY(1,1),
    day_id INT NOT NULL FOREIGN KEY REFERENCES Days(id),
    week_id INT NOT NULL FOREIGN KEY REFERENCES Weeks(id),
    time_slot_id INT NOT NULL FOREIGN KEY REFERENCES TimeSlots(id),
    room_id INT NOT NULL FOREIGN KEY REFERENCES Rooms(id),
    subject_id INT NOT NULL FOREIGN KEY REFERENCES Subjects(id),
    teacher_id INT NOT NULL FOREIGN KEY REFERENCES Teachers(id),
    group_id INT NOT NULL FOREIGN KEY REFERENCES Groups(id),
    type_id INT NOT NULL FOREIGN KEY REFERENCES Type(id), -- Correctly reference the Type table
    details NVARCHAR(MAX) -- JSON-данные
);
