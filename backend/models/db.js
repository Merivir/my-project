const sql = require('mssql');

const config = {
    server: 'localhost',       // Имя вашего сервера
    database: 'schedule',      // Имя базы данных
    user: 'admin',             // Имя пользователя
    password: 'mypassword',    // Пароль
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const poolPromise = sql.connect(config)
    .then(pool => {
        console.log('Connected to MSSQL Database');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed:', err.message);
        throw err;
    });

module.exports = { 
    sql, 
    poolPromise,
};
