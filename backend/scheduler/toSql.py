import json
import pyodbc

# Կապ հաստատում MSSQL բազայի հետ
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=schedule;"
    "UID=admin;"
    "PWD=mypassword;"
)
cursor = conn.cursor()

# Բեռնում ենք JSON ֆայլը
with open("final_schedule.json", "r", encoding="utf-8") as f:
    schedule_data = json.load(f)

# Ֆունկցիա, որը ստուգում է գոյություն ունեցող արժեքները և ավելացնում նորերը
def get_or_insert(table, column, value):
    if not value:
        return None  # Եթե արժեքը դատարկ է, վերադարձնել None
    
    cursor.execute(f"SELECT id FROM {table} WHERE {column} = ?", value)
    row = cursor.fetchone()
    if row:
        return row[0]
    
    cursor.execute(f"INSERT INTO {table} ({column}) OUTPUT INSERTED.id VALUES (?)", value)
    return cursor.fetchone()[0]

# Աշխատում ենք տվյալների հետ
for entry in schedule_data:
    level_id = get_or_insert("Levels", "name", entry["level"])
    course_id = get_or_insert("Courses", "code", entry["course"])
    
    # Տեսակի (Type) ստուգում և ավելացում
    type_ids = []
    for t in entry["type"]:
        type_ids.append(get_or_insert("Types", "name", t))
    
    # Առարկայի (Subject) ստուգում և ավելացում
    subject_id = get_or_insert("Subjects", "name", entry["subject"])

    # Դասախոսի (Teacher) ստուգում և ավելացում
    teacher_ids = []
    for teacher in entry["teachers"]:
        teacher_ids.append(get_or_insert("Teachers", "name", teacher))
    
    # Լսարանի (Room) ստուգում և ավելացում
    room_ids = []
    for room in entry["rooms"]:
        room_ids.append(get_or_insert("Rooms", "number", room))

    week_id = get_or_insert("Weeks", "type", f"Week {entry['week_type']}")
    day_id = get_or_insert("Days", "name", f"Day {entry['day_of_week']}")
    time_slot_id = get_or_insert("TimeSlots", "slot", f"Slot {entry['time_of_day']}")

    # Տվյալների ներմուծում `Schedule` աղյուսակ (առանց `group_id`)
    for teacher_id in teacher_ids:
        for room_id in room_ids:
            for type_id in type_ids:
                cursor.execute(
                    """
                    INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id
                )

# Պահպանում ենք փոփոխությունները և փակում կապը
conn.commit()
cursor.close()
conn.close()

print("✅ Տվյալները հաջողությամբ ներմուծվեցին բազա առանց group_id-ի!")
