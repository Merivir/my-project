use schedule

CREATE TABLE PrimaryAvailability (
    id INT PRIMARY KEY IDENTITY(1,1),
    teacher_id INT NOT NULL,
    day_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(id),
    FOREIGN KEY (day_id) REFERENCES Days(id),
    FOREIGN KEY (time_slot_id) REFERENCES TimeSlots(id)
);

CREATE TABLE BackupAvailability (
    id INT PRIMARY KEY IDENTITY(1,1),
    teacher_id INT NOT NULL,
    day_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(id),
    FOREIGN KEY (day_id) REFERENCES Days(id),
    FOREIGN KEY (time_slot_id) REFERENCES TimeSlots(id)
);

select * from PrimaryAvailability
SELECT * FROM BackupAvailability

DROP TABLE IF EXISTS PrimaryAvailability;
DROP TABLE IF EXISTS BackupAvailability;