const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sql = require('mssql');

// MSSQL Configuration
const config = {
    server: 'localhost',
    database: 'schedule',
    user: 'admin',
    password: 'mypassword',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const app = express();



// Middleware
app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../frontend/html')));
// 🔹 Թույլ ենք տալիս static ֆայլերի մատուցում
app.use("/css", express.static(path.join(__dirname, "../frontend/css")));
app.use("/js", express.static(path.join(__dirname, "../frontend/js")));
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")));

const { exec } = require("child_process");

app.post("/api/generate-schedule", (req, res) => {
    console.log("📌 Կանչվեց դասացուցակի ալգորիթմը...");

    const scriptPath = path.join(__dirname, "algorithm.py");
    console.log(`📌 Պատրաստվում ենք գործարկել՝ ${scriptPath}`);

    exec(`python3 "${scriptPath}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`⛔ Exec error: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) {
            console.error(`⚠️ Վերադարձված սխալ՝ ${stderr}`);
        }
        console.log(`✅ Դասացուցակը կազմված է:\n${stdout}`);
        res.json({ message: "Դասացուցակը հաջողությամբ կազմվեց", output: stdout });
    });
});



app.use(async (req, res, next) => {
    try {
        req.dbPool = await sql.connect(config);
        next();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        res.status(500).send('Failed to connect to the database');
    }
});

app.get('/guest', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/guest.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-login.html'));
});

app.get('/admin-register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-register.html'));
});

app.get('/schedule-approval', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/schedule-approval.html'));
});

app.use('/schedule_approval', require('./routes/scheduleApprovalRoutes'));


app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-dashboard.html'));
});

app.use("/api", require("./routes/editRoutes"));
app.use('/guest', require('./routes/guestRoutes'));
app.use('/schedule', require('./routes/scheduleRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api', require('./routes/adminRoutes'));

const subjectsRoutes = require('./routes/subjectsRoutes');
app.use('/api', subjectsRoutes);

app.get('/edit-subjects', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/edit-subjects.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

