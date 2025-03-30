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

app.get('/teacher-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/teacher-login.html'));
});

app.get('/teacher-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/teacher-dashboard.html'));
  });
  
  const verifyTeacherToken = require('./middleware/verifyTeacherToken');

  
  app.get('/api/teacher/schedule', verifyTeacherToken, async (req, res) => {
    try {
        const teacherId = req.user.id;
        console.log("➡️ Բերում ենք դասացուցակ teacherId-ով:", teacherId);

        const pool = await req.dbPool;
        const result = await pool.request()
            .input('teacher_id', sql.Int, teacherId)
            .query(`
                SELECT 
                d.name AS day_name,
                ts.slot AS time_slot,
                sub.name AS subject_name,
                t.name AS teacher_name,
                w.type AS week_type,
                c.code AS course_code,     
                r.number AS room_number,   
                ty.name AS type_name       
            FROM Schedule s
            JOIN Days d ON s.day_id = d.id
            JOIN TimeSlots ts ON s.time_slot_id = ts.id
            JOIN Subjects sub ON s.subject_id = sub.id
            JOIN Teachers t ON s.teacher_id = t.id
            JOIN Weeks w ON s.week_id = w.id
            JOIN Courses c ON s.course_id = c.id
            JOIN Rooms r ON s.room_id = r.id
            JOIN Types ty ON s.type_id = ty.id

            WHERE t.id = @teacher_id;

            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching teacher schedule:", error);
        res.status(500).json({ error: "Server error" });
    }
});

  

app.use("/api", require("./routes/editRoutes"));
app.use('/guest', require('./routes/guestRoutes'));
app.use('/schedule', require('./routes/scheduleRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/teacher-dashboard', require('./routes/teacherRoutes'));

const subjectsRoutes = require('./routes/subjectsRoutes');
app.use('/api', subjectsRoutes);

app.get('/edit-subjects', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/edit-subjects.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

app.get('/teacher-availability', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/teacher-availability.html'));
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

