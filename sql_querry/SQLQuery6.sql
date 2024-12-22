ALTER TABLE TimeSlots
ADD CONSTRAINT CK_TimeSlots CHECK (start_time < end_time);
