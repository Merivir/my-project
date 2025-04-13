import json
import networkx as nx
from collections import defaultdict
import pyodbc
import random

# ─────────────────────────────────────────────────────────────────────────
# 1) Գլոբալ պարամետրեր
# ─────────────────────────────────────────────────────────────────────────

# GLOBAL_CONFLICT_SUBJECTS = {
#     "Խորացված անգլերեն",
#     "Օտար լեզու",
#     "Հայոց պատմություն"
# }

TYPE_CATEGORIES = {
    "Լաբ1": "Լաբ1",
    "Լաբ2": "Լաբ2",
    "Լաբ3": "Լաբ3",
    "Լաբ4": "Լաբ4",
    "Գործ": "Գործ",
    "Գործ1": "Գործ1",
    "Գործ2": "Գործ2",
    "Գործ3": "Գործ3",
    "Դաս": "Դաս"
}

CONFLICTS = {
    "Դաս": {"Դաս", "Գործ", "Գործ1", "Գործ2", "Գործ3", "Լաբ1", "Լաբ2", "Լաբ3", "Լաբ4"},
    "Գործ": {"Դաս", "Գործ", "Գործ1", "Գործ2", "Գործ3", "Լաբ1", "Լաբ2", "Լաբ3", "Լաբ4"},
    "Գործ1": {"Գործ", "Գործ1", "Լաբ1", "Լաբ2", "Դաս"},
    "Գործ2": {"Գործ", "Գործ2", "Լաբ2", "Լաբ3", "Դաս"},
    "Գործ3": {"Գործ", "Գործ3", "Լաբ3", "Լաբ4", "Դաս"},
    "Լաբ1": {"Լաբ1", "Գործ", "Գործ1", "Դաս"},
    "Լաբ2": {"Լաբ2", "Գործ", "Գործ1", "Գործ2", "Դաս"},
    "Լաբ3": {"Լաբ3", "Գործ", "Գործ2", "Գործ3", "Դաս"},
    "Լաբ4": {"Լաբ4", "Գործ", "Գործ3", "Դաս"}
}


def get_week_type(slot: int) -> str:
    """
    Եթե slot-ը զույգ է, week_type=\"հայտարար\",
    եթե կենտ է, week_type=\"համարիչ\".
    """
    return "հայտարար" if slot % 2 == 0 else "համարիչ"


# ─────────────────────────────────────────────────────────────────────────
# 2) Բեռնում ենք դասերի տվյալները MSSQL–ից
# ─────────────────────────────────────────────────────────────────────────
def load_schedule_data():
    """
    Բեռնում է schedule_editable աղյուսակից դասերի տվյալները,
    Levels, Courses, subjects_editable, Types, Teachers, Rooms, Weeks 
    աղյուսակների join-երով։
    """
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;"
        "DATABASE=schedule;"
        "UID=admin;"
        "PWD=mypassword"
    )
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            l.name AS level,
            c.code AS course,
            sub.name AS subject,
            ty.name AS type,
            t.name AS teacher,
            r.number AS room,
            w.type AS week_type,
            s.day_id,
            s.time_slot_id
        FROM schedule_editable s
        JOIN Levels l ON s.level_id = l.id
        JOIN Courses c ON s.course_id = c.id
        JOIN subjects_editable sub ON s.subject_id = sub.id
        JOIN Types ty ON s.type_id = ty.id
        JOIN Teachers t ON s.teacher_id = t.id
        JOIN Rooms r ON s.room_id = r.id
        JOIN Weeks w ON s.week_id = w.id
    """)

    columns = [col[0] for col in cursor.description]
    data = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return data


# ─────────────────────────────────────────────────────────────────────────
# 3) Բաժանում ենք դասերը երկու շաբաթների եւ \"երկուսն էլ\"
# ─────────────────────────────────────────────────────────────────────────
def split_by_week_type(data):
    week1 = []
    week2 = []
    both = []
    for row in data:
        wtype = row.get("week_type", "համարիչ").strip()  # default
        if wtype == "համարիչ":
            week1.append(row)
        elif wtype == "հայտարար":
            week2.append(row)
        elif wtype == "երկուսն էլ":
            both.append(row)
    return week1, week2, both


# ─────────────────────────────────────────────────────────────────────────
# 4) Կառուցում ենք կոնֆլիկտային գրաֆ
# ─────────────────────────────────────────────────────────────────────────
def build_conflict_graph(entries):
    """
    Յուրաքանչյուր դաս լինի node։
    Եթե երկու դասերը չեն կարող լինել միաժամանակ, դնենք edge։
    """
    G = nx.Graph()
    for i, row in enumerate(entries):
        G.add_node(i, **row)

    for i in G.nodes:
        for j in G.nodes:
            if i >= j:
                continue
            a = G.nodes[i]
            b = G.nodes[j]

            conflict = False

            # Նույն ուսուցիչ
            if a["teacher"] == b["teacher"]:
                conflict = True

            # Նույն լսարան
            if a["room"] == b["room"]:
                conflict = True

            # Նույն կուրս (day_id/time_slot_id կարող է լինել schedule_editable-ում), 
            # եթե միաժամանակ day_id, time_slot_id - conflict
            if a["course"] == b["course"] and a["day_id"] == b["day_id"] and a["time_slot_id"] == b["time_slot_id"]:
                conflict = True

            # Գործ տեսակի հանգամանք (դուք ավելացրել եք թույլտվություն)
            if a["type"] == b["type"] == "Գործ" and a["subject"] == b["subject"] and a["teacher"] != b["teacher"]:
                # Միաժամանակ կարելի է
                conflict = False

            # Գլոբալ առարկաներ, նույն ուսուցիչ
            if b["subject"] == a["subject"] and a["teacher"] == b["teacher"]:
                conflict = True

            # Դասի տեսակի կոնֆլիկտ
            if a["type"] in CONFLICTS and b["type"] in CONFLICTS[a["type"]]:
                conflict = True

            if conflict:
                G.add_edge(i, j)

    return G


# ─────────────────────────────────────────────────────────────────────────
# 5) assign_time_slots – վերակառուցված, fallback-ով
# ─────────────────────────────────────────────────────────────────────────
def assign_time_slots(G):
    """
    Փորձում է դասերին (node) նշանակել (day, hour) զույգ։
    Եթե բոլոր slot-երը conflict են, fallback է random day/hour.
    """
    days = [1, 2, 3, 4, 5]
    hours = [1, 2, 3, 4]

    # Տեսակավորենք բարձր degree ունեցող նոդերը առաջինը.
    for node in sorted(G.nodes, key=lambda n: G.degree[n], reverse=True):
        node_data = G.nodes[node]
        assigned = False

        for day in days:
            for hour in hours:
                slot_key = (day, hour)

                # Ստուգենք բոլոր հարևանների հետ conflict
                conflict = False
                for neighbor in G.neighbors(node):
                    nd = G.nodes[neighbor]
                    if nd.get("assigned_day") == day and nd.get("assigned_hour") == hour:
                        # Այս slot-ն արդեն neighbor ունի, conflict
                        conflict = True
                        break

                if not conflict:
                    G.nodes[node]["assigned_day"] = day
                    G.nodes[node]["assigned_hour"] = hour
                    slot_index = (day - 1) * 4 + (hour - 1)
                    # Եթե ունի արդեն week_type, պահում ենք, հակառակ դեպքում get_week_type
                    if "week_type" not in node_data:
                        G.nodes[node]["week_type"] = get_week_type(slot_index)
                    assigned = True
                    break

            if assigned:
                break

        # fallback: եթե ոչ մի slot չգտավ, դնում ենք random
        if "assigned_day" not in G.nodes[node]:
            fallback_day = random.choice(days)
            fallback_hour = random.choice(hours)
            G.nodes[node]["assigned_day"] = fallback_day
            G.nodes[node]["assigned_hour"] = fallback_hour
            slot_index = (fallback_day - 1) * 4 + (fallback_hour - 1)
            if "week_type" not in node_data:
                G.nodes[node]["week_type"] = get_week_type(slot_index)

    return G


# ─────────────────────────────────────────────────────────────────────────
# 6) merge_both_weeks – "երկուսն էլ" դասերը դնենք երկու գրաֆում
# ─────────────────────────────────────────────────────────────────────────
def merge_both_weeks(G1, G2, both):
    index = max(max(G1.nodes, default=-1), max(G2.nodes, default=-1)) + 1
    for row in both:
        row["original_week_type"] = "երկուսն էլ"
        G1.add_node(index, **row)
        G2.add_node(index, **row)
        index += 1
    return G1, G2


# ─────────────────────────────────────────────────────────────────────────
# 7) prepare_schedule_for_db – բազայի համար
# ─────────────────────────────────────────────────────────────────────────
def prepare_schedule_for_db(G):
    """
    Եթե row["original_week_type"] == "երկուսն էլ", պահպանենք միայն մեկ անգամ։
    """
    schedule = []
    added_keys = set()

    for _, data in G.nodes(data=True):
        # նույն օր, ժամ, course + subject + teacher + type + room
        key = (
            data.get("level"),
            data.get("course"),
            data.get("subject"),
            data.get("type"),
            data.get("teacher"),
            data.get("room"),
            data.get("assigned_day"),
            data.get("assigned_hour")
        )

        # Եթե դա 'երկուսն էլ' դաս է, միայն մեկ անգամ ենք ավելացնում
        if data.get("original_week_type") == "երկուսն էլ":
            if key in added_keys:
                continue
            added_keys.add(key)
            data["week_type"] = "երկուսն էլ"

        schedule.append({
            "level": data.get("level"),
            "course": data.get("course"),
            "subject": data.get("subject"),
            "type": data.get("type"),
            "teacher": data.get("teacher"),
            "room": data.get("room"),
            "day_of_week": data.get("assigned_day"),
            "time_of_day": data.get("assigned_hour"),
            "week_type": data.get("week_type")
        })
    return schedule


# ─────────────────────────────────────────────────────────────────────────
# 8) save_to_db – գրանցում ենք created_schedule-ում
# ─────────────────────────────────────────────────────────────────────────
def save_to_db(schedule):
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost;"
        "DATABASE=schedule;"
        "UID=admin;"
        "PWD=mypassword"
    )
    cursor = conn.cursor()

    # Մաքրում ենք նախորդը
    cursor.execute("DELETE FROM created_schedule")

    for row in schedule:
        cursor.execute("""
            INSERT INTO created_schedule (
                level, course, subject, type,
                teachers, rooms,
                day_of_week, time_of_day, week_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["level"],
            row["course"],
            row["subject"],
            row["type"],
            json.dumps([row["teacher"]], ensure_ascii=False),
            json.dumps([row["room"]], ensure_ascii=False),
            row["day_of_week"],
            row["time_of_day"],
            row["week_type"]
        ))


    conn.commit()
    conn.close()


# ─────────────────────────────────────────────────────────────────────────
# 9) Main
# ─────────────────────────────────────────────────────────────────────────
def main():
    # Բեռնում ենք schedule_editable տվյալները
    raw_data = load_schedule_data()

    # Պարզում ենք ինչ դասեր են համարիչ, հայտարար, երկուսն էլ
    week1_data, week2_data, both_data = split_by_week_type(raw_data)

    # Կառուցում ենք գրաֆեր
    G1 = build_conflict_graph(week1_data)
    G2 = build_conflict_graph(week2_data)

    # \"երկուսն էլ\" դասերը դնում ենք G1 և G2-ում
    G1, G2 = merge_both_weeks(G1, G2, both_data)

    # Փորձում ենք նշանակել slot-եր հավասարաչափ և fallback
    G1 = assign_time_slots(G1)
    G2 = assign_time_slots(G2)

    # Պատրաստում ենք բազայի համար
    schedule1 = prepare_schedule_for_db(G1)
    schedule2 = prepare_schedule_for_db(G2)

    # Գրանցում ենք bázáյում
    save_to_db(schedule1 + schedule2)

    print("Schedule")


if __name__ == "__main__":
    main()
