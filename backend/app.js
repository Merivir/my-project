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

    const scriptPath = path.join(__dirname, "algorithm_backup.py");
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
  
app.get('/teacher-dashboard/settingsMenu', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/settingsMenu.html'));
});

app.get('/teacher-change-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/teacher-change-password.html'));
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

// In app.js or server.js
app.post("/admin/finalize-schedule", async (req, res) => {
    try {
      const pool = await sql.connect(config);
      
      // Նախ մաքրում ենք Schedule աղյուսակը
      await pool.request().query(`DELETE FROM Schedule`);
      
      // Տեղափոխում ենք created_schedule-ից Schedule
      await pool.request().query(`
        INSERT INTO Schedule (level_id, course_id, subject_id, type_id, teacher_id, room_id, week_id, day_id, time_slot_id, weekly_id, details)
        SELECT 
            l.id AS level_id,
            c.id AS course_id,
            s_sub.id AS subject_id,
            ty.id AS type_id,
            t.id AS teacher_id,
            r.id AS room_id,
            w.id AS week_id,
            cs.day_of_week AS day_id,
            cs.time_of_day AS time_slot_id,
            CASE 
                WHEN cs.week_type = N'երկուսն էլ' THEN (SELECT id FROM Weekly WHERE type = 'weekly')
                ELSE (SELECT id FROM Weekly WHERE type = 'biweekly')
            END AS weekly_id,
            N'Հաստատված դասացուցակ' AS details
        FROM created_schedule cs
        JOIN Levels l ON l.name = cs.level
        JOIN Courses c ON c.code = cs.course
        JOIN Subjects s_sub ON s_sub.name = cs.subject
        JOIN Types ty ON ty.name = cs.type
        JOIN Teachers t ON t.name = JSON_VALUE(cs.teachers, '$[0]')
        JOIN Rooms r ON r.number = JSON_VALUE(cs.rooms, '$[0]')
        JOIN Weeks w ON w.type = cs.week_type;
      `);
      
      res.status(200).json({ message: "✅ Դասացուցակը հաջողությամբ հաստատվել է և տեղափոխվել է Schedule աղյուսակ" });
    } catch (error) {
      console.error("Finalize schedule error:", error);
      res.status(500).json({ error: "❌ Չհաջողվեց ավարտել դասացուցակի տեղափոխումը" });
    }
  });

app.use('/api/reset', require('./routes/resetPasswordRoutes'));
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

app.get("/teacher-message", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/teacher-message.html"));
});
app.get('/admin/change-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-change-password.html'));
  });
  
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

