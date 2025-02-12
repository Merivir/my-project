import json
import pyodbc

# MSSQL-ի համար կապված պարամետրերը
server = "localhost"
database = "schedule"
username = "admin"
password = "mypassword"

# Միանում ենք MSSQL-ի տվյալների բազային
conn = pyodbc.connect(
    f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
)
cursor = conn.cursor()

# Օգնական ֆունկցիա՝ ստանալու կամ ավելացնելու համար
def get_or_insert(table, column, value):
    """
    Փնտրում է, թե արդյոք տրված աղյուսակում կա գրառում, որտեղ column = value:
    Եթե կա, վերադարձնում է id-ն, իսկ եթե չկա, ավելացնում է նոր գրառում եւ վերադարձնում է նոր id-ն:
    """
    select_query = f"SELECT id FROM {table} WHERE {column} = ?"
    cursor.execute(select_query, value)
    row = cursor.fetchone()
    if row:
        return row[0]
    else:
        insert_query = f"INSERT INTO {table} ({column}) VALUES (?)"
        cursor.execute(insert_query, value)
        conn.commit()
        cursor.execute(select_query, value)
        return cursor.fetchone()[0]

# Օգնական ֆունկցիաներ՝ օրերի, ժամային սլոտների և շաբաթների համար
def get_day_name(day_number):
    # Հնարավոր mapping՝ 1՝ Երկուշաբթի, 2՝ Երեքշաբթի, 3՝ Չորեքշաբթի, 4՝ Հինգշաբթի, 5՝ Ուրբաթ
    mapping = {
        1: "Երկուշաբթի",
        2: "Երեքշաբթի",
        3: "Չորեքշաբթի",
        4: "Հինգշաբթի",
        5: "Ուրբաթ"
    }
    return mapping.get(day_number, "Անհայտ")

def get_time_slot(time_number):
    mapping = {
        1: "09:30-10:50",
        2: "11:00-12:20",
        3: "12:50-14:10",
        4: "14:20-15:40"
    }
    return mapping.get(time_number, "Անհայտ")

def get_week_name(week_type):
    # Օրինակ՝ 1 = "համարիչ", 2 = "հայտարար"
    mapping = {
        1: "համարիչ",
        2: "հայտարար"
    }
    return mapping.get(week_type, "Անհայտ")

def get_first_type(type_list):
    # Կարդում ենք առաջին տողի արժեքը, օրինակ՝ ["Գործ"] => "Գործ"
    if type_list and len(type_list) > 0:
        return type_list[0]
    return "Անհայտ"

# Բեռնում ենք JSON ֆայլը, որտեղ պահված են դասերի տվյալները (օրինակ՝ data.json)
with open("final_schedule.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Քանի որ մենք պետք է նորմալիզացնենք տվյալները, նախ անհրաժեշտ է ավելացնել բոլոր բազայի աղյուսակների արժեքները:
for entry in data:
    # JSON-ից վերցնել տվյալները
    level_value    = entry["level"]         # օրինակ՝ "Առաջին"
    course_value   = entry["course"]        # օրինակ՝ "ԷԷ434"
    subject_value  = entry["subject"]       # օրինակ՝ "Ինֆորմատիկա"
    type_value     = get_first_type(entry["type"])   # օրինակ՝ "Գործ"
    teacher_values = entry["teachers"]      # օրինակ՝ ["Մանուկյան Վ."]
    room_values    = entry["rooms"]         # օրինակ՝ ["5118"]
    week_type_val  = entry["week_type"]     # օրինակ՝ 1 (համարիչ) կամ 2 (հայտարար)
    day_number     = entry["day_of_week"]   # օրինակ՝ 4
    time_number    = entry["time_of_day"]   # օրինակ՝ 4

    # Հեռացնելու/ավելացմանն այն աղյուսակներում, որոնք պահում են հիմնական տեղեկությունները:

    # 1. Levels աղյուսակ
    level_id = get_or_insert("Levels", "name", level_value)

    # 2. Courses աղյուսակ
    course_id = get_or_insert("Courses", "code", course_value)

    # 3. Types աղյուսակ (դասի տիպ, որպես օրինակ "Գործ")
    type_id = get_or_insert("Types", "name", type_value)

    # 4. Subjects աղյուսակ: անհրաժեշտ է պահել subject-ի անունը, ինչպես նաև level_id, course_id, type_id
    cursor.execute("""
        SELECT id FROM Subjects 
        WHERE name = ? AND level_id = ? AND course_id = ? AND type_id = ?
    """, subject_value, level_id, course_id, type_id)
    row = cursor.fetchone()
    if row:
        subject_id = row[0]
    else:
        cursor.execute("""
            INSERT INTO Subjects (name, type_id, level_id, course_id)
            VALUES (?, ?, ?, ?)
        """, subject_value, type_id, level_id, course_id)
        conn.commit()
        cursor.execute("""
            SELECT id FROM Subjects 
            WHERE name = ? AND level_id = ? AND course_id = ? AND type_id = ?
        """, subject_value, level_id, course_id, type_id)
        subject_id = cursor.fetchone()[0]

    # 5. Teachers աղյուսակ
    teacher_ids = []
    for teacher in teacher_values:
        tid = get_or_insert("Teachers", "name", teacher)
        teacher_ids.append(tid)

    # 6. Rooms աղյուսակ
    room_ids = []
    for room in room_values:
        rid = get_or_insert("Rooms", "number", room)
        room_ids.append(rid)

    # 7. Days աղյուսակ: օգտագործելով day_number-ը, ստանում ենք օրերի անունը
    day_name = get_day_name(day_number)
    day_id = get_or_insert("Days", "name", day_name)

    # 8. TimeSlots աղյուսակ: օգտագործելով time_number-ը
    time_slot_value = get_time_slot(time_number)
    time_slot_id = get_or_insert("TimeSlots", "slot", time_slot_value)

    # 9. Weeks աղյուսակ: օգտագործելով week_type-ի արժեքը
    week_name = get_week_name(week_type_val)
    week_id = get_or_insert("Weeks", "type", week_name)

    # 10. Վերջում, Insert ենք անում Schedule աղյուսակում:
    # Այս աղյուսակում մենք կպահենք ամեն դասի համար
    for teacher_id in teacher_ids:
        for room_id in room_ids:
            cursor.execute("""
                INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
            """, day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id)
            conn.commit()

cursor.close()
conn.close()

print("✅ Տվյալները հաջողությամբ ներմուծվեցին բազայում!")
