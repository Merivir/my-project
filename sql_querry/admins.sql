CREATE TABLE admins (
    id INT PRIMARY KEY IDENTITY,     -- Auto-incremented ID
    name NVARCHAR(100) NOT NULL,    -- Admin's name
    login NVARCHAR(100) NOT NULL UNIQUE, -- Unique login for identification
    email NVARCHAR(100) NOT NULL UNIQUE, -- Unique email address
    password NVARCHAR(MAX) NOT NULL  -- Encrypted password
);


Select * from admins
