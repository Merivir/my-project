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

# ✅ JSON ֆայլի բացում
json_file = "final_schedule.json"
with open(json_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# ✅ Mapping օրերի, շաբաթների, ժամային սլոտների համար
dayMap = {1: "Երկուշաբթի", 2: "Երեքշաբթի", 3: "Չորեքշաբթի", 4: "Հինգշաբթի", 5: "Ուրբաթ"}
weekMap = {1: "համարիչ", 2: "հայտարար"}
slotMap = {1: "09:30-10:50", 2: "11:00-12:20", 3: "12:50-14:10", 4: "14:20-15:40"}

# ✅ Օժանդակ ֆունկցիա `get_or_insert`
def get_or_insert(table, column, value):
    """Վերադարձնում է արժեքի ID-ն, եթե գոյություն ունի, հակառակ դեպքում ավելացնում է ու վերադարձնում ID-ն"""
    cursor.execute(f"SELECT id FROM {table} WHERE {column} = ?", (value,))
    row = cursor.fetchone()
    if row:
        return row[0]
    
    cursor.execute(f"INSERT INTO {table} ({column}) VALUES (?)", (value,))
    cursor.execute("SELECT SCOPE_IDENTITY();")
    return cursor.fetchone()[0]

# ✅ Տվյալների ներմուծման հիմնական ցիկլ
for entry in data:
    try:
        # 🔹 Ստանում ենք JSON-ից արժեքները
        level_id = get_or_insert("Levels", "name", entry["level"])
        course_id = get_or_insert("Courses", "code", entry["course"])
        type_id = get_or_insert("Types", "name", entry["type"][0])
        subject_id = get_or_insert("Subjects", "name", entry["subject"])

        # 🔹 Ստանում ենք շաբաթ, օր, ժամ ID-ները
        week_id = get_or_insert("Weeks", "type", weekMap.get(entry["week_type"], "հայտարար"))
        day_id = get_or_insert("Days", "name", dayMap.get(entry["day_of_week"], "Չի գտնվել"))
        time_slot_id = get_or_insert("TimeSlots", "slot", slotMap.get(entry["time_of_day"], "Չի գտնվել"))

        # 🔹 Ստուգում ենք ուսուցիչներին
        teacher_ids = []
        for teacher in entry["teachers"]:
            teacher_id = get_or_insert("Teachers", "name", teacher)
            teacher_ids.append(teacher_id)
            cursor.execute("IF NOT EXISTS (SELECT 1 FROM Subject_Teachers WHERE subject_id = ? AND teacher_id = ?) "
                           "INSERT INTO Subject_Teachers (subject_id, teacher_id) VALUES (?, ?)", 
                           (subject_id, teacher_id, subject_id, teacher_id))

        # 🔹 Ստուգում ենք լսարանները
        room_ids = []
        for room in entry["rooms"]:
            room_id = get_or_insert("Rooms", "number", room)
            room_ids.append(room_id)
            cursor.execute("IF NOT EXISTS (SELECT 1 FROM Subject_Rooms WHERE subject_id = ? AND room_id = ?) "
                           "INSERT INTO Subject_Rooms (subject_id, room_id) VALUES (?, ?)", 
                           (subject_id, room_id, subject_id, room_id))

        # 🔹 Ընտրում ենք առաջին ուսուցչի և լսարանի ID-ները
        first_teacher_id = teacher_ids[0] if teacher_ids else None
        first_room_id = room_ids[0] if room_ids else None

        # 🔹 Ստուգում ենք None արժեքները՝ սխալներից խուսափելու համար
        if not all([course_id, day_id, week_id, time_slot_id, first_room_id, subject_id, first_teacher_id, type_id]):
            print(f"⚠️ Բաց թողնված գրառում՝ բացակայող տվյալների պատճառով: {entry}")
            continue

        # ✅ Ավելացնում ենք տվյալները Schedule աղյուսակում
        cursor.execute("""
            INSERT INTO Schedule 
            (course_id, day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (course_id, day_id, week_id, time_slot_id, first_room_id, subject_id, first_teacher_id, type_id, None))

        print(f"✅ Գրված է '{entry['subject']}' առարկան '{entry['course']}' կուրսի համար։")

    except Exception as e:
        print(f"❌ Սխալ գրառման ժամանակ: {entry}")
        print(f"❗ Սխալ: {e}")

# ✅ Փոփոխությունները պահպանում ենք
conn.commit()
cursor.close()
conn.close()

print("🎉 ✅ Տվյալները հաջողությամբ ներմուծվեցին MSSQL-ի մեջ!")
