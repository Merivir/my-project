import json
import pyodbc

# 🔹 MSSQL կապի տվյալները
server = "localhost"
database = "schedule"
username = "admin"
password = "mypassword"

conn = pyodbc.connect(
    f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
)
cursor = conn.cursor()

# 🔹 JSON ֆայլի բացում
json_file = "class_schedule.json"
with open(json_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# 🔹 Mapping–ներ օրերի, շաբաթների, ժամային սլոտների համար
dayMap = {1: "Երկուշաբթի", 2: "Երեքշաբթի", 3: "Չորեքշաբթի", 4: "Հինգշաբթի", 5: "Ուրբաթ"}
weekMap = {1: "համարիչ", 2: "հայտարար"}
slotMap = {1: "09:30-10:50", 2: "11:00-12:20", 3: "12:50-14:10", 4: "14:20-15:40"}

# 🔹 Տվյալների ներմուծում
for entry in data:
    try:
        level_name = entry["level"]
        course_code = entry["course"]
        subject_name = entry["subject"]
        subject_type = entry["type"][0]
        teachers = entry["teachers"]
        rooms = entry["rooms"]
        week_type_value = entry["week_type"]
        day_of_week_value = entry["day_of_week"]
        time_of_day_value = entry["time_of_day"]

        # 🔸 Courses աղյուսակ (Ստուգում + Ավելացում)
        print(f"🔍 Checking course: {course_code}")  
        cursor.execute("SELECT id FROM Courses WHERE code = ?", (course_code,))
        course_row = cursor.fetchone()

        if not course_row:
            print(f"⚠️ Course '{course_code}' not found. Inserting...")
            cursor.execute("INSERT INTO Courses (code) VALUES (?)", (course_code,))
            conn.commit()

            cursor.execute("SELECT id FROM Courses WHERE code = ?", (course_code,))
            course_row = cursor.fetchone()

        if not course_row:
            print(f"❌ ERROR: Course '{course_code}' could not be inserted!")
            continue

        course_id = course_row[0]
        print(f"✅ Found Course ID: {course_id}")

        # 🔸 Schedule-ի տվյալների ավելացում
        cursor.execute("""
            INSERT INTO Schedule 
            (course_id, day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (course_id, day_of_week_value, week_type_value, time_of_day_value, None, None, None, None, None))
        conn.commit()

        print(f"✅ INSERT Schedule for course '{course_code}' with course_id '{course_id}'.\n")

    except Exception as e:
        print(f"❌ Error processing entry: {entry}")
        print(f"❗ Exception: {e}")

cursor.close()
conn.close()

print("🎉 Տվյալները հաջողությամբ ներմուծվեցին MSSQL-ի մեջ!")
