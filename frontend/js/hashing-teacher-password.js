const sql = require('mssql');
const bcrypt = require('bcrypt');

// MSSQL կոնֆիգուրացիան (հավաստացրու, որ տվյալները ճիշտ են)
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

async function updateTeacherPasswords() {
  try {
    // Ստեղծում ենք կապը
    let pool = await sql.connect(config);

    // Հեռանում ենք բոլոր ուսուցիչների ID-ները ըստ հերթականության
    const result = await pool.request().query(`SELECT id FROM Teachers ORDER BY id`);
    const teachers = result.recordset;

    // Յուրաքանչյուր ուսուցիչի համար ստեղծում ենք plaintext արժեքը և այն hash-ավորում ենք
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      // Ստեղծում ենք plaintext արժեքը՝ օրինակ "teacher001", "teacher002", ...
      const plainPassword = `teacher${String(i + 1).padStart(3, '0')}`;
      // Hash-ավորում ենք արժեքը bcrypt-ի միջոցով
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Թարմացնում ենք password դաշտը
      await pool.request()
        .input('id', sql.Int, teacher.id)
        .input('password', sql.NVarChar, hashedPassword)
        .query("UPDATE Teachers SET password = @password WHERE id = @id");

      console.log(`Updated teacher id ${teacher.id}: plain: ${plainPassword}`);
    }

    console.log("Բոլոր ուսուցիչների գաղտնաբառերը hash-ավորվեցին:");
  } catch (err) {
    console.error("Error updating teacher passwords:", err);
  } finally {
    sql.close();
  }
}

updateTeacherPasswords();
