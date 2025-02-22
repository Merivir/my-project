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
json_file = "updated_everything_withdates.json"
with open(json_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# ✅ Weekly և Week ID mapping
weekly_mapping = {1: "biweekly", 2: "weekly"}
week_mapping = {1: "համարիչ", 2: "հայտարար", 0: "երկուսն էլ"}

# ✅ **1. Ավելացնում ենք առանձին աղյուսակներում տվյալները**
for entry in data:
    level_name = entry.get("level", "Անհայտ մակարդակ").strip()
    course_code = entry.get("course", "Անհայտ կուրս").strip()
    subject_name = entry.get("subject", "Անհայտ առարկա").strip()
    subject_type = entry["type"][0].strip() if entry.get("type") else None
    teachers = entry["teachers"] if entry.get("teachers") else ["Անորոշ"]
    rooms = entry["rooms"] if entry.get("rooms") else ["Անորոշ"]

    # ✅ Ավելացնում ենք Level, Course, Type
    level_id = get_or_insert("Levels", "name", level_name)
    course_id = get_or_insert("Courses", "code", course_code)
    type_id = get_or_insert("Types", "name", subject_type)

    # ✅ Ստանում ենք ուսուցչի և լսարանի ID-ները
    teacher_id = get_or_insert("Teachers", "name", teachers[0].strip())
    room_id = get_or_insert("Rooms", "number", rooms[0].strip())

    # ✅ Ստուգում ենք՝ արդյոք Subject-ը կա
    cursor.execute("SELECT id, teacher_id, room_id FROM Subjects WHERE name = ?", (subject_name,))
    subject_row = cursor.fetchone()

    if subject_row:
        subject_id, existing_teacher_id, existing_room_id = subject_row

        # ✅ Եթե `teacher_id` կամ `room_id` `NULL` է, թարմացնում ենք
        if existing_teacher_id is None or existing_room_id is None:
            cursor.execute("""
                UPDATE Subjects 
                SET teacher_id = ?, room_id = ? 
                WHERE id = ?
            """, (teacher_id, room_id, subject_id))
    else:
        # ✅ Եթե չկա, ավելացնում ենք
        cursor.execute("""
            INSERT INTO Subjects (name, teacher_id, room_id) 
            VALUES (?, ?, ?)
        """, (subject_name, teacher_id, room_id))
        cursor.execute("SELECT SCOPE_IDENTITY();")
        subject_id = cursor.fetchone()[0]

conn.commit()
print("✅ Subjects աղյուսակը հաջողությամբ լրացվեց և թարմացվեց")

# ✅ **2. Ավելացնում ենք Schedule գրառումները**
for entry in data:
    try:
        level_id = get_or_insert("Levels", "name", entry["level"].strip())
        course_id = get_or_insert("Courses", "code", entry["course"].strip())

        cursor.execute("SELECT id FROM Subjects WHERE name = ?", (entry["subject"].strip(),))
        subject_row = cursor.fetchone()
        subject_id = subject_row[0] if subject_row else None

        type_id = get_or_insert("Types", "name", entry["type"][0].strip() if entry.get("type") else None)

        # ✅ Ստանում ենք Weekly ID ըստ `biweekly_frequency`
        weekly_type_name = weekly_mapping.get(entry["biweekly_frequency"])
        cursor.execute("SELECT id FROM Weekly WHERE type = ?", (weekly_type_name,))
        weekly_row = cursor.fetchone()
        weekly_id = weekly_row[0] if weekly_row else None

        # ✅ Ստանում ենք Week ID ըստ `type_of_week`
        week_type_name = week_mapping.get(entry["type_of_week"])
        cursor.execute("SELECT id FROM Weeks WHERE type = ?", (week_type_name,))
        week_row = cursor.fetchone()
        week_id = week_row[0] if week_row else None

        # ✅ Ստանում ենք Day & Time Slot ID-ները
        for schedule_time in entry["schedule_times"]:
            day_id = schedule_time["day_of_week"]
            time_slot_id = schedule_time["time_of_day"]

            # ✅ Ստանում ենք ուսուցչի և լսարանի ID-ները
            teachers = entry["teachers"] if entry.get("teachers") else ["Անորոշ"]
            rooms = entry["rooms"] if entry.get("rooms") else ["Անորոշ"]

            teacher_id = get_or_insert("Teachers", "name", teachers[0].strip())
            room_id = get_or_insert("Rooms", "number", rooms[0].strip())

            # ✅ Եթե որևէ բան բացակայում է, ավտոմատ լրացնում ենք
            teacher_id = teacher_id if teacher_id else get_or_insert("Teachers", "name", "Անորոշ")
            room_id = room_id if room_id else get_or_insert("Rooms", "number", "Անորոշ")

            # ✅ Ավելացնում ենք Schedule գրառումը (level_id & weekly_id-ով)
            cursor.execute("""
                INSERT INTO Schedule 
                (level_id, course_id, subject_id, type_id, teacher_id, room_id, day_id, time_slot_id, weekly_id, week_id, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (level_id, course_id, subject_id, type_id, teacher_id, room_id, day_id, time_slot_id, weekly_id, week_id, None))

            print(f"✅ Schedule inserted for course '{entry['course']}', subject '{entry['subject']}' with level '{entry['level']}' and weekly '{weekly_type_name}'.")

    except Exception as e:
        print("❌ Error processing entry:", entry)
        print("❗ Exception:", e)

conn.commit()
cursor.close()
conn.close()

print("🎉 ✅ Բոլոր տվյալները հաջողությամբ ներմուծվեցին MSSQL-ի մեջ!")
