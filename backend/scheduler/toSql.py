import json
import pyodbc

# ✅ MSSQL կապի տվյալները
server = "localhost"
database = "schedule"
username = "admin"
password = "mypassword"

conn = pyodbc.connect(
    f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
)
cursor = conn.cursor()

# ✅ Օժանդակ ֆունկցիա `get_or_insert()`
def get_or_insert(table, column, value):
    """Եթե տվյալը բազայում չկա, ավելացնում ենք, եթե կա՝ վերադարձնում ենք ID-ն"""
    if not value:
        return None

    cursor.execute(f"SELECT id FROM {table} WHERE {column} = ?", (value,))
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute(f"INSERT INTO {table} ({column}) VALUES (?)", (value,))
    cursor.execute("SELECT SCOPE_IDENTITY();")
    row = cursor.fetchone()
    return row[0] if row else None

# ✅ JSON ֆայլի բացում
json_file = "final_schedule.json"
with open(json_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# ✅ Week ID ստանալու ճիշտ մեթոդ
week_mapping = {1: "համարիչ", 2: "հայտարար"}

# ✅ **1. Նախ բոլոր տվյալները ավելացնում ենք առանձին աղյուսակներում**
for entry in data:
    course_code = entry["course"].strip()
    subject_name = entry["subject"].strip()
    subject_type = entry["type"][0].strip() if entry.get("type") else None
    teachers = entry["teachers"] if entry["teachers"] else ["Անորոշ"]
    rooms = entry["rooms"] if entry["rooms"] else ["Անորոշ"]

    # ✅ Ավելացնում ենք Course, Type, Subjects
    course_id = get_or_insert("Courses", "code", course_code)
    type_id = get_or_insert("Types", "name", subject_type)
    
    # ✅ Ստանում ենք Subject-ի ID, եթե արդեն կա, ապա չենք ավելացնում նորից
    cursor.execute("SELECT id FROM Subjects WHERE name = ? AND course_id = ?", (subject_name, course_id))
    subject_row = cursor.fetchone()
    if subject_row:
        subject_id = subject_row[0]
    else:
        cursor.execute("INSERT INTO Subjects (name, type_id, course_id) VALUES (?, ?, ?)", (subject_name, type_id, course_id))
        cursor.execute("SELECT SCOPE_IDENTITY();")
        subject_id = cursor.fetchone()[0]

    # ✅ Ավելացնում ենք Teachers & Rooms
    for teacher in teachers:
        get_or_insert("Teachers", "name", teacher.strip())
    
    for room in rooms:
        get_or_insert("Rooms", "number", room.strip())

conn.commit()
print("✅ All base tables (Courses, Subjects, Teachers, Rooms, Types) added successfully!")

# ✅ **2. Հիմա բոլոր տվյալները բազայում են, կարող ենք ավելացնել `Schedule`**
for entry in data:
    try:
        course_id = get_or_insert("Courses", "code", entry["course"].strip())
        cursor.execute("SELECT id FROM Subjects WHERE name = ? AND course_id = ?", (entry["subject"].strip(), course_id))
        subject_row = cursor.fetchone()
        subject_id = subject_row[0] if subject_row else None

        type_id = get_or_insert("Types", "name", entry["type"][0].strip() if entry.get("type") else None)

        # ✅ Ստանում ենք Week, Day, Time Slot ID-ները
        week_type_name = week_mapping.get(entry["week_type"])
        cursor.execute("SELECT id FROM Weeks WHERE type = ?", (week_type_name,))
        week_row = cursor.fetchone()
        week_id = week_row[0] if week_row else None

        day_id = entry["day_of_week"]
        time_slot_id = entry["time_of_day"]

        # ✅ Ստանում ենք ուսուցչի և լսարանի ID-ները
        teachers = entry["teachers"] if entry["teachers"] else ["Անորոշ"]
        rooms = entry["rooms"] if entry["rooms"] else ["Անորոշ"]

        teacher_id = get_or_insert("Teachers", "name", teachers[0].strip())
        room_id = get_or_insert("Rooms", "number", rooms[0].strip())

        # ✅ Եթե որևէ բան բացակայում է, ավտոմատ լրացնում ենք
        teacher_id = teacher_id if teacher_id else get_or_insert("Teachers", "name", "Անորոշ")
        room_id = room_id if room_id else get_or_insert("Rooms", "number", "Անորոշ")

        # ✅ Ավելացնում ենք Schedule գրառումը
        cursor.execute("""
            INSERT INTO Schedule 
            (course_id, day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (course_id, day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id, None))

        print(f"✅ Schedule inserted for course '{entry['course']}', subject '{entry['subject']}'.")

    except Exception as e:
        print("❌ Error processing entry:", entry)
        print("❗ Exception:", e)

conn.commit()
cursor.close()
conn.close()

print("🎉 ✅ Բոլոր տվյալները հաջողությամբ ներմուծվեցին MSSQL-ի մեջ!")
