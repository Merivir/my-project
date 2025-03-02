const express = require("express");
const { sql, poolPromise } = require("../models/db");
const router = express.Router();

// ✅ Բերում ենք առարկաները
router.get("/subjects", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM subjects_editable");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching subjects" });
    }
});

// ✅ Բերում ենք լսարանները
router.get("/rooms", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, number FROM Rooms");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching rooms" });
    }
});

// ✅ Բերում ենք դասի տեսակները
router.get("/types", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Types");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching types" });
    }
});

router.put('/edit/:id', async (req, res) => {
    const { id } = req.params;
    let { teacher_id, room_id, type_id, frequency } = req.body;

    console.log("📡 Received update request:", { id, teacher_id, room_id, type_id, frequency });

    try {
        const pool = await poolPromise;

        // Ստուգում ենք՝ արդյոք տվյալը կա `schedule_editable`-ում
        const existing = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM schedule_editable WHERE id = @id');

        if (!existing.recordset.length) {
            console.log("❌ Գրառումը չի գտնվել schedule_editable-ում");
            return res.status(404).json({ error: "❌ Գրառումը չի գտնվել schedule_editable-ում" });
        }

        console.log("🔍 Existing record in schedule_editable:", existing.recordset[0]);

        // ✅ Թարմացնում ենք միայն schedule_editable աղյուսակը
        const updateResult = await pool.request()
            .input('id', sql.Int, id)
            .input('teacher_id', sql.Int, teacher_id || null)
            .input('room_id', sql.Int, room_id || null)
            .input('type_id', sql.Int, type_id || null)
            .input('frequency', sql.NVarChar, frequency || "weekly")
            .query(`
                UPDATE schedule_editable
                SET 
                    teacher_id = @teacher_id, 
                    room_id = @room_id, 
                    type_id = @type_id, 
                    details = @frequency
                WHERE id = @id;
            `);

        console.log("✅ Update success in schedule_editable, rows affected:", updateResult.rowsAffected);

        // Ստուգում ենք փոփոխությունը
        const checkUpdated = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM schedule_editable WHERE id = @id');

        console.log("🔎 Updated record in schedule_editable:", checkUpdated.recordset[0]);

        res.json({ message: "✅ Փոփոխությունը հաջողությամբ կատարվեց", updatedData: checkUpdated.recordset[0] });
    } catch (error) {
        console.error("⛔ Error updating schedule_editable record:", error);
        res.status(500).json({ error: "Database update error", details: error.message });
    }
});


router.delete("/schedule/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Ստուգում ենք՝ արդյոք տվյալը գոյություն ունի `schedule_editable`-ում
        const existing = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT id FROM schedule_editable WHERE id = @id");

        if (!existing.recordset.length) {
            return res.status(404).json({ error: "❌ Գրառումը չի գտնվել schedule_editable-ում" });
        }

        // ✅ Ջնջում ենք տվյալը `schedule_editable`-ից
        await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM schedule_editable WHERE id = @id");

        res.json({ message: "✅ Դասացուցակից տվյալը հաջողությամբ ջնջվեց" });
    } catch (error) {
        console.error("⛔ Error deleting schedule record:", error);
        res.status(500).json({ error: "Server error while deleting from schedule_editable" });
    }
});

module.exports = router;
