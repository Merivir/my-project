ALTER TABLE Schedule
DROP COLUMN subject;

ALTER TABLE Schedule
ADD subject_id INT FOREIGN KEY REFERENCES Subjects(id);
