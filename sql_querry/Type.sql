CREATE TABLE Type (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL -- e.g., "Դասախոսություն", "Պրակտիկա", "Լաբորատորիա"
);

-- Insert example types in Armenian
INSERT INTO Type (name) VALUES 
(N'Դասախոսություն'), -- Lecture
(N'Գործնական'),      -- Practice
(N'Լաբորատոր');    -- Lab
