const sql = require('mssql');

const config = {
    server: 'localhost',       // Имя твоего сервера
    database: 'schedule',      // Название базы данных
    user: 'admin',             // Имя пользователя SQL Server
    password: 'mypassword',    // Пароль пользователя
    port: 1433,                // Порт для подключения
    options: {
        encrypt: false,              // Отключить SSL
        trustServerCertificate: true // Доверять сертификату
    }
};

sql.connect(config)
    .then(() => {
        console.log('Connected to MSSQL Database');
    })
    .catch(err => {
        console.error('Database Connection Failed:', err);
    });
