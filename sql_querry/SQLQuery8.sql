ALTER TABLE Schedule
ADD CONSTRAINT UQ_Schedule UNIQUE (group_id, time_slot_id, day_of_week);
