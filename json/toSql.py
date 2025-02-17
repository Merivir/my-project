import json
import pyodbc

# MSSQL կապի տվյալները (հարմարեցնել ըստ ձեր բազայի)
server = "localhost"
database = "schedule"
username = "admin"
password = "mypassword"

conn = pyodbc.connect(
    f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
)
cursor = conn.cursor()

# JSON ֆայլի բացում
json_file = "final_schedule.json"
with open(json_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# Mapping–ներ օրերի, շաբաթների, ժամային սլոտների համար
dayMap = {1: "Երկուշաբթի", 2: "Երեքշաբթի", 3: "Չորեքշաբթի", 4: "Հինգշաբթի", 5: "Ուրբաթ"}
weekMap = {1: "համարիչ", 2: "հայտարար"}
slotMap = {1: "09:30-10:50", 2: "11:00-12:20", 3: "12:50-14:10", 4: "14:20-15:40"}

print("Մուտքագրում ենք դասախոսները...")

# 1. Դասախոսների աղյուսակի լրացում
teachers_set = set()
for entry in data:
    for teacher in entry["teachers"]:
        t = teacher.strip()
        if t:
            teachers_set.add(t)
for teacher in teachers_set:
    cursor.execute(
        "IF NOT EXISTS (SELECT 1 FROM Teachers WHERE name = ?) INSERT INTO Teachers (name) VALUES (?)",
        (teacher, teacher)
    )
conn.commit()
print(f"Ավելացվեց {len(teachers_set)} դասախոսներ։")

print("Մուտքագրում ենք լևելները, կուրսերը և տիպերը...")
# 2. Լևելների, կուրսերի և տիպերի աղյուսակի լրացում
for entry in data:
    level_name = entry["level"].strip()
    course_code = entry["course"].strip()
    subject_type = entry["type"][0].strip() if entry["type"] and entry["type"][0] else None
    if level_name:
        cursor.execute(
            "IF NOT EXISTS (SELECT 1 FROM Levels WHERE name = ?) INSERT INTO Levels (name) VALUES (?)",
            (level_name, level_name)
        )
    if course_code:
        cursor.execute(
            "IF NOT EXISTS (SELECT 1 FROM Courses WHERE code = ?) INSERT INTO Courses (code) VALUES (?)",
            (course_code, course_code)
        )
    if subject_type:
        cursor.execute(
            "IF NOT EXISTS (SELECT 1 FROM Types WHERE name = ?) INSERT INTO Types (name) VALUES (?)",
            (subject_type, subject_type)
        )
conn.commit()
print("Լևելները, կուրսերը և տիպերը թարմացվեցին։")

print("Մուտքագրում ենք առարկաները Subjects աղյուսակում...")
# 3. Subjects աղյուսակի լրացում՝ ճիշտ սյունի անունով (type_id)
for entry in data:
    level_name = entry["level"].strip()
    course_code = entry["course"].strip()
    subject_name = entry["subject"].strip()
    subject_type = entry["type"][0].strip() if entry["type"] and entry["type"][0] else None

    cursor.execute("SELECT id FROM Levels WHERE name = ?", (level_name,))
    level_row = cursor.fetchone()
    if not level_row:
        print(f"Error: Level '{level_name}' not found.")
        continue
    level_id = level_row[0]

    cursor.execute("SELECT id FROM Courses WHERE code = ?", (course_code,))
    course_row = cursor.fetchone()
    if not course_row:
        print(f"Error: Course '{course_code}' not found.")
        continue
    course_id = course_row[0]

    cursor.execute("SELECT id FROM Types WHERE name = ?", (subject_type,))
    type_row = cursor.fetchone()
    if not type_row:
        print(f"Error: Type '{subject_type}' not found.")
        continue
    type_id = type_row[0]

    # MERGE-ի միջոցով թարմացնում ենք/ներկայացնում ենք Subjects աղյուսակը
    merge_sql = """
    MERGE INTO Subjects AS target
    USING (SELECT ? AS name, ? AS course_id) AS source
    ON (target.name = source.name AND target.course_id = source.course_id)
    WHEN MATCHED THEN 
        UPDATE SET type_id = ?, level_id = ?
    WHEN NOT MATCHED THEN
        INSERT (name, type_id, level_id, course_id)
        VALUES (?, ?, ?, ?);
    """
    cursor.execute(merge_sql, (subject_name, course_id, type_id, level_id, subject_name, type_id, level_id, course_id))
    conn.commit()
    cursor.execute("SELECT id FROM Subjects WHERE name = ? AND course_id = ?", (subject_name, course_id))
    subject_row = cursor.fetchone()
    if not subject_row:
        print(f"Error: Subject '{subject_name}' (Course {course_code}) not found.")
        continue
    subject_id = subject_row[0]
    print(f"Subject '{subject_name}' -> id: {subject_id}")

print("Մուտքագրում ենք առարկաների կապերը (Subject_Teachers, Subject_Rooms)...")
# 4. Կապերի աղյուսակները (Subject_Teachers և Subject_Rooms)
for entry in data:
    course_code = entry["course"].strip()
    subject_name = entry["subject"].strip()

    cursor.execute("SELECT id FROM Courses WHERE code = ?", (course_code,))
    course_row = cursor.fetchone()
    if not course_row:
        continue
    course_id = course_row[0]

    cursor.execute("SELECT id FROM Subjects WHERE name = ? AND course_id = ?", (subject_name, course_id))
    subject_row = cursor.fetchone()
    if not subject_row:
        continue
    subject_id = subject_row[0]

    # Դասախոսները
    for teacher in entry["teachers"]:
        teacher = teacher.strip()
        if not teacher:
            continue
        cursor.execute("SELECT id FROM Teachers WHERE name = ?", (teacher,))
        teacher_row = cursor.fetchone()
        if teacher_row:
            teacher_id = teacher_row[0]
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Subject_Teachers WHERE subject_id = ? AND teacher_id = ?)
                INSERT INTO Subject_Teachers (subject_id, teacher_id) VALUES (?, ?)
            """, (subject_id, teacher_id, subject_id, teacher_id))
        else:
            print(f"Error: Teacher '{teacher}' not found.")
    # Լսարանները
    for room in entry["rooms"]:
        room = room.strip()
        if not room:
            continue
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM Rooms WHERE number = ?) INSERT INTO Rooms (number) VALUES (?)", (room, room))
        cursor.execute("SELECT id FROM Rooms WHERE number = ?", (room,))
        room_row = cursor.fetchone()
        if room_row:
            room_id = room_row[0]
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Subject_Rooms WHERE subject_id = ? AND room_id = ?)
                INSERT INTO Subject_Rooms (subject_id, room_id) VALUES (?, ?)
            """, (subject_id, room_id, subject_id, room_id))
        else:
            print(f"Error: Room '{room}' not found.")
conn.commit()
print("Կապերը (Subject_Teachers, Subject_Rooms) մուտքագրված են։")

print("Մուտքագրում ենք գրաֆիկը (Schedule)...")
# 5. Schedule աղյուսակի լրացում
for entry in data:
    try:
        level_name = entry["level"].strip()
        course_code = entry["course"].strip()
        subject_name = entry["subject"].strip()
        subject_type = entry["type"][0].strip() if entry["type"] and entry["type"][0] else None
        teachers = [t.strip() for t in entry["teachers"] if t.strip()]
        rooms = [r.strip() for r in entry["rooms"] if r.strip()]
        week_type_value = entry["week_type"]
        day_of_week_value = entry["day_of_week"]
        time_of_day_value = entry["time_of_day"]

        cursor.execute("SELECT id FROM Courses WHERE code = ?", (course_code,))
        course_row = cursor.fetchone()
        if not course_row:
            print(f"Error: Course '{course_code}' not found.")
            continue
        course_id = course_row[0]

        cursor.execute("SELECT id FROM Subjects WHERE name = ? AND course_id = ?", (subject_name, course_id))
        subject_row = cursor.fetchone()
        if not subject_row:
            print(f"Error: Subject '{subject_name}' for course '{course_code}' not found.")
            continue
        subject_id = subject_row[0]

        day_name = dayMap.get(day_of_week_value)
        if not day_name:
            print(f"Error: Invalid day value '{day_of_week_value}'.")
            continue
        cursor.execute("SELECT id FROM Days WHERE name = ?", (day_name,))
        day_row = cursor.fetchone()
        if not day_row:
            print(f"Error: Day '{day_name}' not found.")
            continue
        day_id = day_row[0]

        week_type_name = weekMap.get(week_type_value)
        if not week_type_name:
            print(f"Error: Invalid week type value '{week_type_value}'.")
            continue
        cursor.execute("SELECT id FROM Weeks WHERE type = ?", (week_type_name,))
        week_row = cursor.fetchone()
        if not week_row:
            print(f"Error: Week type '{week_type_name}' not found.")
            continue
        week_id = week_row[0]

        time_slot = slotMap.get(time_of_day_value)
        if not time_slot:
            print(f"Error: Invalid time slot value '{time_of_day_value}'.")
            continue
        cursor.execute("SELECT id FROM TimeSlots WHERE slot = ?", (time_slot,))
        slot_row = cursor.fetchone()
        if not slot_row:
            print(f"Error: Time slot '{time_slot}' not found.")
            continue
        time_slot_id = slot_row[0]

        cursor.execute("SELECT id FROM Types WHERE name = ?", (subject_type,))
        type_row = cursor.fetchone()
        if not type_row:
            print(f"Error: Type '{subject_type}' not found.")
            continue
        type_id = type_row[0]

        print(f"Day id: {day_id} | Week id: {week_id} | TimeSlot id: {time_slot_id} | Type id: {type_id}")

        # Ստանում ենք առաջին դասախոսի և առաջին լսարանի ID–ները, եթե գոյություն ունեն
        if not teachers:
            print(f"Skipped Schedule insertion for subject '{subject_name}' due to missing teacher.")
            continue
        cursor.execute("SELECT id FROM Teachers WHERE name = ?", (teachers[0],))
        teacher_row = cursor.fetchone()
        if not teacher_row:
            print(f"Skipped Schedule insertion for subject '{subject_name}' due to teacher '{teachers[0]}' not found.")
            continue
        teacher_id = teacher_row[0]

        if not rooms:
            print(f"Skipped Schedule insertion for subject '{subject_name}' due to missing room.")
            continue
        cursor.execute("SELECT id FROM Rooms WHERE number = ?", (rooms[0],))
        room_row = cursor.fetchone()
        if not room_row:
            print(f"Skipped Schedule insertion for subject '{subject_name}' due to room '{rooms[0]}' not found.")
            continue
        room_id = room_row[0]

        cursor.execute("""
            INSERT INTO Schedule 
            (course_id, day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (course_id, day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id, None))
        print(f"Inserted Schedule record for course '{course_code}', subject '{subject_name}'.")
    except Exception as e:
        print("Error processing entry:", entry)
        print("Exception:", e)

conn.commit()
cursor.close()
conn.close()

print("✅ Տվյալները հաջողությամբ ներմուծվեցին MSSQL-ի մեջ!")
