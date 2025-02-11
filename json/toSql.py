import json
import pyodbc

# MSSQL կապի տվյալները (փոխիր ըստ քո բազայի)
server = "localhost"
database = "schedule"
username = "admin"
password = "mypassword"

conn = pyodbc.connect(f"DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}")
cursor = conn.cursor()

# JSON ֆայլի բացում
json_file = "class_schedule.json"

with open(json_file, "r", encoding="utf-8") as file:
    data = json.load(file)

for entry in data:
    level_name = entry["level"]
    course_code = entry["course"]
    subject_name = entry["subject"]
    subject_type = entry["type"]
    teachers = entry["teachers"]
    rooms = entry["rooms"]

    # Levels աղյուսակ
    cursor.execute("IF NOT EXISTS (SELECT 1 FROM Levels WHERE name = ?) INSERT INTO Levels (name) VALUES (?)", (level_name, level_name))

    # Courses աղյուսակ
    cursor.execute("IF NOT EXISTS (SELECT 1 FROM Courses WHERE code = ?) INSERT INTO Courses (code) VALUES (?)", (course_code, course_code))

    # Levels և Courses ID-ների ստացում
    cursor.execute("SELECT id FROM Levels WHERE name = ?", level_name)
    level_id = cursor.fetchone()[0]

    cursor.execute("SELECT id FROM Courses WHERE code = ?", course_code)
    course_id = cursor.fetchone()[0]

    # Subjects աղյուսակ
    cursor.execute("""
        IF NOT EXISTS (SELECT 1 FROM Subjects WHERE name = ? AND course_id = ?)
        INSERT INTO Subjects (name, type, level_id, course_id) VALUES (?, ?, ?, ?)
    """, (subject_name, course_id, subject_name, subject_type, level_id, course_id))

    # Subject ID-ի ստացում
    cursor.execute("SELECT id FROM Subjects WHERE name = ? AND course_id = ?", subject_name, course_id)
    subject_id = cursor.fetchone()[0]

    # Teachers աղյուսակ
    for teacher in teachers:
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM Teachers WHERE name = ?) INSERT INTO Teachers (name) VALUES (?)", (teacher, teacher))
        cursor.execute("SELECT id FROM Teachers WHERE name = ?", teacher)
        teacher_id = cursor.fetchone()[0]

        # Subject_Teachers աղյուսակ
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM Subject_Teachers WHERE subject_id = ? AND teacher_id = ?) INSERT INTO Subject_Teachers (subject_id, teacher_id) VALUES (?, ?)", 
                       (subject_id, teacher_id, subject_id, teacher_id))

    # Rooms աղյուսակ
    for room in rooms:
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM Rooms WHERE number = ?) INSERT INTO Rooms (number) VALUES (?)", (room, room))
        cursor.execute("SELECT id FROM Rooms WHERE number = ?", room)
        room_id = cursor.fetchone()[0]

        # Subject_Rooms աղյուսակ
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM Subject_Rooms WHERE subject_id = ? AND room_id = ?) INSERT INTO Subject_Rooms (subject_id, room_id) VALUES (?, ?)", 
                       (subject_id, room_id, subject_id, room_id))

# Փոփոխությունները պահպանում ենք
conn.commit()
cursor.close()
conn.close()

print("✅ Տվյալները հաջողությամբ ներմուծվեցին MSSQL-ի մեջ!")
