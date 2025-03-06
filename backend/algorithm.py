import sys
sys.stdout.reconfigure(encoding='utf-8')

import pyodbc
import json
import networkx as nx

# ---------------------------
# 1. MSSQL Server–ի կապի մանրամասները
# ---------------------------
server = "localhost"
database = "schedule"
username = "admin"
password = "mypassword"

# ---------------------------
# 2. Դասի տեսակների համաչափությունը (հայերենով) և կոնֆլիկտները
# ---------------------------
TYPE_MAP = {
    "Դաս": "Դաս",
    "Գործ": "Գործ",
    "Գործ1": "Գործ1",
    "Գործ2": "Գործ2",
    "Գործ3": "Գործ3",
    "Լաբ1": "Լաբ1",
    "Լաբ2": "Լաբ2",
    "Լաբ3": "Լաբ3",
    "Լաբ4": "Լաբ4"
}

CONFLICTS = {
    "Դաս": {"Դաս", "Գործ1", "Գործ2", "Գործ3", "Լաբ1", "Լաբ2", "Լաբ3", "Լաբ4"},
    "Գործ": {"Լաբ1", "Լաբ2", "Գործ", "Դաս"},
    "Գործ1": {"Լաբ1", "Լաբ2", "Գործ1", "Դաս"},
    "Գործ2": {"Լաբ2", "Լաբ3", "Գործ2", "Դաս"},
    "Գործ3": {"Լաբ3", "Լաբ4", "Գործ3", "Դաս"},
    "Լաբ1": {"Գործ", "Դաս"},
    "Լաբ2": {"Գործ", "Գործ1", "Դաս"},
    "Լաբ3": {"Գործ2", "Գործ3", "Դաս"},
    "Լաբ4": {"Գործ3", "Դաս"}
}

# ---------------------------
# 3. week_type-ի սահմանումը
# ---------------------------
def get_week_type(data):
    week_id = str(data.get("week_id", "")).strip()
    if week_id == "1":
        return "երկուսն էլ"
    else:
        time_slot = int(data.get("time_slot", 0))
        return "հայտարար" if time_slot % 2 == 0 else "համարիչ"

# ---------------------------
# 4. Ուսուցիչների հասանելիության տվյալների բեռնում
# ---------------------------
def load_availability_from_db(cursor, table_name):
    query = f"SELECT teacher_id, day_id, time_slot_id FROM {table_name}"
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        avail = {}
        for teacher_id, day_id, time_slot_id in rows:
            key = str(teacher_id)
            slot = (day_id, time_slot_id)
            avail.setdefault(key, []).append(slot)
        return avail
    except Exception as e:
        print(f"Error loading availability from {table_name}: {e}")
        return {}

# ---------------------------
# 5. Դասերի տվյալների բեռնում schedule_editable/subjects_editable-ից
# ---------------------------
def load_schedule_data(cursor):
    query = """
    SELECT
        s.id,
        l.name AS level,
        c.code AS course,
        sub.name AS subject,
        ty.name AS type,
        t.name AS teacher,   -- այստեղ օգտագործում ենք դասախոսի անունը
        r.name AS room,      -- այստեղ կարող եք փոխարինել r.number-ի փոխարեն, եթե որն էլ գրված է որպես տեքստ
        s.week_id, s.day_id, s.time_slot_id
    FROM schedule_editable s
    JOIN Levels l ON s.level_id = l.id
    JOIN Courses c ON s.course_id = c.id
    JOIN subjects_editable sub ON s.subject_id = sub.id
    JOIN Types ty ON s.type_id = ty.id
    JOIN Teachers t ON s.teacher_id = t.id
    JOIN Rooms r ON s.room_id = r.id
    """
    try:
        cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return data
    except Exception as e:
        print("Error loading schedule data:", e)
        return []

# ---------------------------
# 6. Կոնֆլիկտային գրաֆի կառուցում
# ---------------------------
def build_conflict_graph(schedule_data, primary_avail, backup_avail):
    G = nx.Graph()
    for i, entry in enumerate(schedule_data):
        teacher_id = entry["teacher"]
        preferred_slots = set(primary_avail.get(teacher_id, []) + backup_avail.get(teacher_id, []))
        G.add_node(i, **entry, preferred_slots=list(preferred_slots))
        print(f"[DEBUG build_conflict_graph] Node {i}: level={entry['level']}, course={entry['course']}, subject={entry['subject']}, type={entry['type']}, teacher={entry['teacher']}, room={entry['room']}")
    n = len(schedule_data)
    for i in range(n):
        for j in range(i + 1, n):
            node1 = G.nodes[i]
            node2 = G.nodes[j]
            conflict = False
            if node1["teacher"] == node2["teacher"]:
                conflict = True
            if node1["room"] == node2["room"]:
                conflict = True
            type1 = node1.get("type", "N/A")
            type2 = node2.get("type", "N/A")
            if type1 in CONFLICTS and type2 in CONFLICTS[type1]:
                conflict = True
            if type2 in CONFLICTS and type1 in CONFLICTS[type2]:
                conflict = True
            preferred1 = set(node1.get("preferred_slots", []))
            preferred2 = set(node2.get("preferred_slots", []))
            if preferred1 and preferred2 and not (preferred1 & preferred2):
                conflict = True
            if conflict:
                G.add_edge(i, j)
    print(f"[DEBUG build_conflict_graph] Total edges in graph: {G.number_of_edges()}")
    return G

# ---------------------------
# 7. Գունավորում՝ ժամային սլոտների նշանակմամբ
# ---------------------------
def assign_time_slots(G):
    coloring = nx.coloring.greedy_color(G, strategy="largest_first")
    for node, time_slot in coloring.items():
        G.nodes[node]["time_slot"] = time_slot
        if "week_type" in G.nodes[node] and G.nodes[node]["week_type"] == "երկուսն էլ":
            week_type = "երկուսն էլ"
        else:
            week_type = "հայտարար" if time_slot % 2 == 0 else "համարիչ"
        G.nodes[node]["week_type"] = week_type
    print(f"[DEBUG assign_time_slots] Used time_slots: {set(coloring.values())}")
    return G

# ---------------------------
# 8. Վերագործարկում ենք վերջնական դասացուցակի օբյեկտը՝ տվյալների բազայի համար
# ---------------------------
def prepare_schedule_for_db(G):
    schedule = []
    allowed_week_types = {"հայտարար", "համարիչ", "երկուսն էլ"}
    for node, data in G.nodes(data=True):
        week_type = get_week_type(data).strip()
        if week_type not in allowed_week_types:
            week_type = "համարիչ"
        day_of_week = (int(data.get("day_id", 1)) % 5) + 1
        time_of_day = (int(data.get("time_slot", 0)) % 4) + 1
        print(f"[DEBUG prepare_schedule_for_db] Node {node}: day_of_week={day_of_week}, time_of_day={time_of_day}, week_type={repr(week_type)}")
        schedule.append({
            "level": data["level"],
            "course": data["course"],
            "subject": data["subject"],
            "type": data["type"],
            "teacher": data["teacher"],   # նոր դաշտ՝ դասախոս
            "room": data["room"],         # նոր դաշտ՝ լսարան
            "day_of_week": day_of_week,
            "time_of_day": time_of_day,
            "week_type": week_type
        })
    return schedule

# ---------------------------
# 9. Հիմնական main() ֆունկցիա
# ---------------------------
def main():
    try:
        conn = pyodbc.connect(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password};"
        )
        cursor = conn.cursor()
    except Exception as e:
        print("Error connecting to database:", e)
        return

    print("[DEBUG main] Loading schedule data from schedule_editable...")
    schedule_data = load_schedule_data(cursor)
    print(f"[DEBUG main] Loaded {len(schedule_data)} rows from schedule_editable")
    if not schedule_data:
        print("No schedule data found. Exiting.")
        cursor.close()
        conn.close()
        return

    print("[DEBUG main] Loading availability from PrimaryAvailability...")
    primary_avail = load_availability_from_db(cursor, "PrimaryAvailability")
    print("[DEBUG main] Loading availability from BackupAvailability...")
    backup_avail = load_availability_from_db(cursor, "BackupAvailability")
    print(f"[DEBUG main] Primary availability: {primary_avail}")
    print(f"[DEBUG main] Backup availability: {backup_avail}")

    print("[DEBUG main] Building conflict graph...")
    G = build_conflict_graph(schedule_data, primary_avail, backup_avail)
    print(f"[DEBUG main] Graph nodes count: {G.number_of_nodes()}")

    print("[DEBUG main] Assigning time slots...")
    G = assign_time_slots(G)

    final_schedule = prepare_schedule_for_db(G)
    print(f"[DEBUG main] Computed schedule entries: {len(final_schedule)}")

    allowed_week_types = {"հայտարար", "համարիչ", "երկուսն էլ"}
    print("[DEBUG main] Inserting final schedule into created_schedule...")
    for row in final_schedule:
        week_type = row["week_type"].strip() if row["week_type"] else ""
        if week_type not in allowed_week_types:
            print(f"[DEBUG main] Invalid week_type '{week_type}' found. Overriding to 'համարիչ'")
            week_type = "համարիչ"
        try:
            cursor.execute("""
                INSERT INTO created_schedule
                (level, course, subject, type, mapped_type, teachers, rooms, preferred_slots, day_of_week, time_of_day, week_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                row["level"],
                row["course"],
                row["subject"],
                row["type"],
                "",  # mapped_type – կարող եք փոխարկել ըստ պահանջի
                json.dumps([row["teacher"]], ensure_ascii=False),  # օգտագործում ենք դասախոսի անունը
                json.dumps([row["room"]], ensure_ascii=False),     # օգտագործում ենք լսարանի անունը
                "[]",  # preferred_slots, եթե չկան տվյալներ
                row["day_of_week"],
                row["time_of_day"],
                week_type
            )
        except Exception as e:
            print("Error inserting schedule row:", e)

    print("[DEBUG main] Inserting conflict rows into conflicts...")
    conflicts_data = []
    for i, j in G.edges():
        if G.nodes[i]["time_slot"] == G.nodes[j]["time_slot"]:
            conflicts_data.append({
                "course1": G.nodes[i]["course"],
                "subject1": G.nodes[i]["subject"],
                "course2": G.nodes[j]["course"],
                "subject2": G.nodes[j]["subject"],
                "issue": "Ժամային սլոտի կոնֆլիկտ"
            })
    for conf in conflicts_data:
        try:
            cursor.execute("""
                INSERT INTO conflicts
                (course1, subject1, course2, subject2, issue)
                VALUES (?, ?, ?, ?, ?)
            """,
                conf["course1"],
                conf["subject1"],
                conf["course2"],
                conf["subject2"],
                conf["issue"]
            )
        except Exception as e:
            print("Error inserting conflict row:", e)

    conn.commit()
    try:
        cursor.execute("SELECT COUNT(*) FROM created_schedule")
        count = cursor.fetchone()[0]
        print(f"[DEBUG main] created_schedule record count: {count}")
    except Exception as e:
        print("Error fetching created_schedule count:", e)

    cursor.close()
    conn.close()
    print("✅ Դասացուցակը և կոնֆլիկտները հաջողությամբ պահպանված են տվյալների բազայում։")

if __name__ == "__main__":
    main()
