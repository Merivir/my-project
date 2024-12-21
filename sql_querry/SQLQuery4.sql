-- 1. Добавляем столбец login, который допускает NULL
--ALTER TABLE admins ADD login NVARCHAR(255) NULL;

-- 2. Устанавливаем уникальные значения для существующих строк
UPDATE admins SET login = CONCAT('user_', id) WHERE login IS NULL;

-- 3. Добавляем ограничение NOT NULL для столбца login
ALTER TABLE admins ALTER COLUMN login NVARCHAR(255) NOT NULL;

-- 4. Добавляем уникальное ограничение для столбца login
ALTER TABLE admins ADD CONSTRAINT UQ_login UNIQUE (login);

-- 5. (Дополнительно) Добавляем уникальное ограничение для email
ALTER TABLE admins ADD CONSTRAINT UQ_email UNIQUE (email);
