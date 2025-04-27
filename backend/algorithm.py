import json
import networkx as nx
import pyodbc
import random
from collections import defaultdict
import logging
from pathlib import Path

# Կարգավորում ենք logging-ը
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────
# 1) Գլոբալ պարամետրեր և տիպեր
# ─────────────────────────────────────────────────────────────────────────

TYPE_CATEGORIES = {
    "Լաբ1": "Լաբ",
    "Լաբ2": "Լաբ",
    "Լաբ3": "Լաբ",
    "Լաբ4": "Լաբ",
    "Գործ": "Գործ",
    "Գործ1": "Գործ",
    "Գործ2": "Գործ",
    "Գործ3": "Գործ",
    "Դաս": "Դաս"
}

# Դասի տիպերի բախում
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

# Լսարանների տեսակներ
ROOM_TYPES = {
    # 5-րդ մասնաշենք, 3-րդ հարկ
    "5301": "Լաբ",
    "5302": "Լաբ",
    "5306": "Լաբ", 
    "5308": "Լաբ",
    "5307": "Դաս",
    # Այլ լսարաններ
    "9602": "Գործ",
    "9910": "Գործ",
    # Դուք կարող եք ավելացնել մնացած լսարանները
}

# Օրերի և ժամերի առաջնահերթություններ (մեծ թիվը = ավելի լավ)
DAY_PRIORITIES = {
    1: 5,  # Երկուշաբթի
    2: 4,  # Երեքշաբթի
    3: 3,  # Չորեքշաբթի
    4: 2,  # Հինգշաբթի
    5: 1,  # Ուրբաթ
}

HOUR_PRIORITIES = {
    1: 4,  # Առաջին ժամ (09:30-10:50)
    2: 5,  # Երկրորդ ժամ (11:00-12:20)
    3: 3,  # Երրորդ ժամ (12:50-14:10)
    4: 2,  # Չորրորդ ժամ (14:20-15:40)
}

# ─────────────────────────────────────────────────────────────────────────
# 2) Օժանդակ ֆունկցիաներ
# ─────────────────────────────────────────────────────────────────────────

def get_week_type(slot: int) -> str:
    """
    Եթե slot-ը զույգ է, week_type="հայտարար",
    եթե կենտ է, week_type="համարիչ".
    """
    return "հայտարար" if slot % 2 == 0 else "համարիչ"

def get_db_connection():
    """Տվյալների բազայի կապ"""
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=localhost;"
            "DATABASE=schedule;"
            "UID=admin;"
            "PWD=mypassword"
        )
        return conn
    except Exception as e:
        logger.error(f"DB կապի սխալ: {e}")
        raise

def load_teacher_availability():
    """
    Բեռնում է դասախոսների հասանելիությունը PrimaryAvailability և 
    BackupAvailability աղյուսակներից
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # PrimaryAvailability
    cursor.execute("""
        SELECT t.name as teacher, d.name as day, ts.slot as time_slot, 'primary' as priority
        FROM PrimaryAvailability pa
        JOIN Teachers t ON pa.teacher_id = t.id
        JOIN Days d ON pa.day_id = d.id
        JOIN TimeSlots ts ON pa.time_slot_id = ts.id
    """)
    primary = cursor.fetchall()
    
    # BackupAvailability
    cursor.execute("""
        SELECT t.name as teacher, d.name as day, ts.slot as time_slot, 'backup' as priority
        FROM BackupAvailability ba
        JOIN Teachers t ON ba.teacher_id = t.id
        JOIN Days d ON ba.day_id = d.id
        JOIN TimeSlots ts ON ba.time_slot_id = ts.id
    """)
    backup = cursor.fetchall()
    
    # Մշակում
    availability = defaultdict(lambda: {'primary': [], 'backup': []})
    
    for teacher, day, time_slot, priority in primary:
        day_index = get_day_index(day)
        hour_index = get_hour_index(time_slot)
        if day_index and hour_index:
            availability[teacher]['primary'].append((day_index, hour_index))
    
    for teacher, day, time_slot, priority in backup:
        day_index = get_day_index(day)
        hour_index = get_hour_index(time_slot)
        if day_index and hour_index:
            availability[teacher]['backup'].append((day_index, hour_index))
    
    conn.close()
    return availability

def get_day_index(day_name):
    """Օրվա անունից ստանում ենք ինդեքսը"""
    day_map = {
        'Երկուշաբթի': 1,
        'Երեքշաբթի': 2,
        'Չորեքշաբթի': 3,
        'Հինգշաբթի': 4,
        'Ուրբաթ': 5
    }
    return day_map.get(day_name)

def get_hour_index(time_slot):
    """Ժամի տողից ստանում ենք ինդեքսը"""
    hour_map = {
        '09:30-10:50': 1,
        '11:00-12:20': 2,
        '12:50-14:10': 3,
        '14:20-15:40': 4
    }
    return hour_map.get(time_slot)

def get_course_prefix(course_code):
    """
    Վերադարձնում է կուրսի կոդի նախածանցը (օր․ "ՏՏ420" -> "ՏՏ")
    Օգտագործվում է նմանատիպ կուրսերը մեկտեղ խմբավորելու համար
    """
    for i, char in enumerate(course_code):
        if char.isdigit():
            return course_code[:i]
    return course_code

# ─────────────────────────────────────────────────────────────────────────
# 3) Տվյալների բեռնում
# ─────────────────────────────────────────────────────────────────────────

def load_schedule_data():
    """
    Բեռնում է schedule_editable աղյուսակից դասերի տվյալները
    """
    conn = get_db_connection()
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
            s.time_slot_id,
            CASE
                WHEN we.type = 'weekly' THEN 1  -- Ամեն շաբաթ
                ELSE 2                          -- Երկու շաբաթը մեկ
            END AS weekly_frequency
        FROM schedule_editable s
        JOIN Levels l ON s.level_id = l.id
        JOIN Courses c ON s.course_id = c.id
        JOIN Subjects sub ON s.subject_id = sub.id
        JOIN Types ty ON s.type_id = ty.id
        JOIN Teachers t ON s.teacher_id = t.id
        JOIN Rooms r ON s.room_id = r.id
        JOIN Weeks w ON s.week_id = w.id
        LEFT JOIN Weekly we ON s.weekly_id = we.id
    """)
    
    columns = [col[0] for col in cursor.description]
    data = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    conn.close()
    return data

def split_by_week_type(data):
    """
    Բաժանում է դասերն ըստ շաբաթների՝ համարիչ, հայտարար, երկուսն էլ
    """
    week1 = []  # համարիչ
    week2 = []  # հայտարար
    both = []   # երկուսն էլ
    
    for row in data:
        wtype = row.get("week_type", "համարիչ").strip()
        weekly_freq = row.get("weekly_frequency", 2)
        
        # Եթե ամեն շաբաթ է անցկացվում (weekly_frequency=1)
        if weekly_freq == 1:
            both.append(row)
        else:
            # Եթե երկու շաբաթը մեկ
            if wtype == "համարիչ":
                week1.append(row)
            elif wtype == "հայտարար":
                week2.append(row)
            elif wtype == "երկուսն էլ":
                both.append(row)
    
    logger.info(f"Համարիչ շաբաթ: {len(week1)} դաս")
    logger.info(f"Հայտարար շաբաթ: {len(week2)} դաս")
    logger.info(f"Երկու շաբաթներում: {len(both)} դաս")
    
    return week1, week2, both

# ─────────────────────────────────────────────────────────────────────────
# 4) Կոնֆլիկտային գրաֆի կառուցում
# ─────────────────────────────────────────────────────────────────────────
# Գլոբալ պարամետրեր և տիպեր բաժնում ավելացնենք լեզվական առարկաների ցանկ
# Ավելացնենք հետևյալ փոփոխությունները build_conflict_graph ֆունկցիայում

# Գլոբալ պարամետրեր և տիպեր բաժնում ավելացնենք լեզվական առարկաների ցանկ
LANGUAGE_SUBJECTS = {
    "Խորացված անգլերեն",
    # կարող եք ավելացնել այլ լեզվական առարկաներ
}

def build_conflict_graph(entries, teacher_availability=None):
    """
    Կառուցում է կոնֆլիկտային գրաֆ, որտեղ node-երը դասերն են,
    իսկ edge-երը՝ կոնֆլիկտները նրանց միջև
    """
    G = nx.Graph()
    
    # Առաջնահերթություն հատկանիշ
    class_priorities = {}
    
    # Յուրաքանչյուր դասին հաշվարկենք առաջնահերթություն
    for i, row in enumerate(entries):
        priority = 0
        
        # 1. Դասի տիպի առաջնահերթություն
        if row["type"] == "Դաս":
            priority += 10  # Դասախոսություններն ավելի կարևոր են
        elif row["type"].startswith("Գործ"):
            priority += 5   # Հետո գործնականները
        else:
            priority += 2   # Լաբերը
        
        # 2. Կուրսի առաջնահերթություն՝ ավելի բարձր կուրսերը
        course_num = ''.join(filter(str.isdigit, row["course"]))
        try:
            year = int(course_num[0])
            priority += year  # Ավելի բարձր կուրսերն ավելի կարևոր են
        except (ValueError, IndexError):
            pass
        
        # 3. Դասախոսի հասանելիություն
        if teacher_availability and row["teacher"] in teacher_availability:
            # Եթե կա primary հասանելիություն, ավելացնենք առաջնահերթություն
            if teacher_availability[row["teacher"]]['primary']:
                priority += 3
        
        class_priorities[i] = priority
        
        # Ավելացնենք նոդը գրաֆում
        # Ստանում ենք course_prefix հատկությունը
        course_prefix = get_course_prefix(row["course"])
        G.add_node(i, **row, course_prefix=course_prefix, priority=priority)
    
    # Տեսակավորենք դասերն ըստ առաջնահերթության
    sorted_classes = sorted(class_priorities.items(), key=lambda x: x[1], reverse=True)
    
    # Որոշենք կոնֆլիկտները
    for i, _ in sorted_classes:
        for j, _ in sorted_classes:
            if i >= j:
                continue
                
            a = G.nodes[i]
            b = G.nodes[j]
            
            conflict = False
            
            # 1. Նույն դասախոս - ստուգենք, որ "Անորոշ" և "Հայտնի չէ" դասախոսները չդիտարկվեն կոնֆլիկտային
            if a["teacher"] == b["teacher"] and a["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                conflict = True
            
            # 2. Նույն լսարան - ստուգենք, որ "Անորոշ" և "Հայտնի չէ" լսարանները չդիտարկվեն կոնֆլիկտային
            if a["room"] == b["room"] and a["room"] not in ["Անորոշ", "Հայտնի չէ"]:
                conflict = True
            
            # 3. Նույն կուրս և նույն դասի տեսակի կոնֆլիկտ
            if a["course"] == b["course"]:
                # Լեզվի առարկաների կարևոր բացառությունը
                is_language_exception = (
                    a["subject"] in LANGUAGE_SUBJECTS and 
                    b["subject"] in LANGUAGE_SUBJECTS and
                    a["subject"] == b["subject"] and
                    a["type"] == "Գործ" and  # Միայն "Գործ" տիպի համար
                    b["type"] == "Գործ" and
                    a["teacher"] != b["teacher"]  # Տարբեր դասախոսներ
                )
                
                # Եթե լեզվի խմբային դասեր չեն, ապա կոնֆլիկտ ենք ստուգում
                if not is_language_exception:
                    # Ստուգենք տիպերը
                    if a["type"] in CONFLICTS and b["type"] in CONFLICTS[a["type"]]:
                        conflict = True
            
            # 4. Հատուկ դեպք՝ նույն առարկա և նույն դասախոս
            if a["subject"] == b["subject"] and a["teacher"] == b["teacher"] and a["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                conflict = True
            
            # Եթե կա կոնֆլիկտ, ավելացնենք կապ
            if conflict:
                G.add_edge(i, j)
    
    logger.info(f"Կառուցվեց գրաֆ {G.number_of_nodes()} նոդերով և {G.number_of_edges()} կապերով")
    
    return G
# ─────────────────────────────────────────────────────────────────────────
# 5) Ժամանակի սլոթների նշանակում
# ─────────────────────────────────────────────────────────────────────────

def calculate_slot_score(node_data, day, hour, teacher_availability=None):
    """
    Հաշվարկում է տվյալ (օր, ժամ) զույգի համապատասխանության միավորը
    տվյալ դասի համար՝ հաշվի առնելով տարբեր գործոններ
    """
    score = 0
    
    # 1. Օրվա և ժամի ընդհանուր առաջնահերթություններ
    score += DAY_PRIORITIES.get(day, 0)
    score += HOUR_PRIORITIES.get(hour, 0)
    
    # 2. Դասախոսի հասանելիություն
    if teacher_availability and node_data["teacher"] in teacher_availability:
        teacher_avail = teacher_availability[node_data["teacher"]]
        
        # Առաջնային հասանելիության ժամեր
        if (day, hour) in teacher_avail['primary']:
            score += 10
        
        # Պահուստային հասանելիության ժամեր
        if (day, hour) in teacher_avail['backup']:
            score += 5
    
    # 3. Դասի տիպին համապատասխան ժամ
    if node_data["type"] == "Դաս":
        # Դասախոսություններն ավելի լավ է անցկացնել առավոտյան
        if hour == 1 or hour == 2:
            score += 3
    elif node_data["type"].startswith("Լաբ"):
        # Լաբորատորներն ավելի լավ է անցկացնել ուշ ժամերին
        if hour == 3 or hour == 4:
            score += 3
    
    # 4. Լսարանի հատուկ սահմանափակումներ
    room = node_data["room"]
    if room in ROOM_TYPES:
        room_type = ROOM_TYPES[room]
        class_type = TYPE_CATEGORIES.get(node_data["type"], "Unknown")
        
        # Լսարանը համապատասխանում է դասի տիպին
        if room_type == class_type:
            score += 4
    
    return score
def assign_optimized_time_slots(G, teacher_availability=None):
    """
    Յուրաքանչյուր դասի համար գտնում է լավագույն ժամանակային սլոթ
    """
    days = [1, 2, 3, 4, 5]  # Երկուշաբթի - Ուրբաթ
    hours = [1, 2, 3, 4]    # 4 դասաժամ
    
    # Առկա սլոթների ցուցակ
    available_slots = {(d, h): True for d in days for h in hours}
    
    # Ստուգենք և ապահովենք, որ բոլոր նոդերն ունեն priority
    for node in G.nodes:
        if "priority" not in G.nodes[node]:
            # Հաշվարկենք default առաջնահերթություն, եթե չկա
            row = G.nodes[node]
            priority = 0
            
            # Հիմնական առաջնահերթություն ըստ տիպի
            if row.get("type") == "Դաս":
                priority += 10
            elif row.get("type", "").startswith("Գործ"):
                priority += 5
            else:
                priority += 2
                
            G.nodes[node]["priority"] = priority
    
    # Ըստ առաջնահերթության տեսակավորենք նոդերը
    nodes_by_priority = sorted(G.nodes, key=lambda n: G.nodes[n]["priority"], reverse=True)
    
    # Մնացած կոդը անփոփոխ...
    
    for node in nodes_by_priority:
        node_data = G.nodes[node]
        best_slot = None
        best_score = -float('inf')
        
        # Պարզենք արդեն զբաղված սլոթները հարևան նոդերի կողմից
        occupied_slots = set()
        for neighbor in G.neighbors(node):
            if "assigned_day" in G.nodes[neighbor] and "assigned_hour" in G.nodes[neighbor]:
                occupied_slots.add((G.nodes[neighbor]["assigned_day"], G.nodes[neighbor]["assigned_hour"]))
        
        # Փորձենք գտնել լավագույն սլոթը
        for day in days:
            for hour in hours:
                if (day, hour) in occupied_slots:
                    continue
                
                # Հաշվարկենք այս սլոթի միավորը
                score = calculate_slot_score(node_data, day, hour, teacher_availability)
                
                # Եթե միավորն ավելի բարձր է, պահպանենք
                if score > best_score:
                    best_score = score
                    best_slot = (day, hour)
        
        # Եթե գտանք հարմար սլոթ, նշանակենք
        if best_slot:
            G.nodes[node]["assigned_day"] = best_slot[0]
            G.nodes[node]["assigned_hour"] = best_slot[1]
            
            # Հաշվարկենք ինդեքսը week_type որոշելու համար
            slot_index = (best_slot[0] - 1) * 4 + (best_slot[1] - 1)
            
            # Եթե week_type արդեն կար, պահպանենք այն, հակառակ դեպքում՝ որոշենք
            if "week_type" not in node_data:
                G.nodes[node]["week_type"] = get_week_type(slot_index)
            
            # Նշենք որ այս սլոթն այլևս հասանելի չէ
            available_slots[(best_slot[0], best_slot[1])] = False
            
        else:
            # Fallback: Եթե բոլոր սլոթները զբաղված են, գտնենք պատահական ազատ սլոթ
            free_slots = [(d, h) for (d, h), free in available_slots.items() if free]
            if free_slots:
                fallback_slot = random.choice(free_slots)
                G.nodes[node]["assigned_day"] = fallback_slot[0]
                G.nodes[node]["assigned_hour"] = fallback_slot[1]
                
                slot_index = (fallback_slot[0] - 1) * 4 + (fallback_slot[1] - 1)
                if "week_type" not in node_data:
                    G.nodes[node]["week_type"] = get_week_type(slot_index)
                
                available_slots[fallback_slot] = False
            else:
                # Ամենավատ դեպքը: բոլոր սլոթները զբաղված են
                logger.warning(f"Չկարողացանք գտնել սլոթ {node_data['subject']}-ի համար")
                random_day = random.choice(days)
                random_hour = random.choice(hours)
                G.nodes[node]["assigned_day"] = random_day
                G.nodes[node]["assigned_hour"] = random_hour
                
                slot_index = (random_day - 1) * 4 + (random_hour - 1)
                if "week_type" not in node_data:
                    G.nodes[node]["week_type"] = get_week_type(slot_index)
    
    return G

# ─────────────────────────────────────────────────────────────────────────
# 6) Շաբաթների միավորում
# ─────────────────────────────────────────────────────────────────────────
def merge_both_weeks(G1, G2, both_classes):
    """
    "Երկուսն էլ" դասերն ավելացնում ենք երկու գրաֆներում
    """
    # Գտնենք հաջորդ հասանելի node_id-ն
    max_id1 = max(G1.nodes, default=-1) + 1
    max_id2 = max(G2.nodes, default=-1) + 1
    next_id = max(max_id1, max_id2)
    
    # Ավելացնենք "երկուսն էլ" դասերը երկու գրաֆներում
    for row in both_classes:
        # Նշենք որ սա "երկուսն էլ" շաբաթների դաս է
        row["original_week_type"] = "երկուսն էլ"
        
        # Հաշվարկենք առաջնահերթություն
        priority = 0
        if row["type"] == "Դաս":
            priority += 10
        elif row["type"].startswith("Գործ"):
            priority += 5
        else:
            priority += 2
            
        # Կուրսի առաջնահերթություն
        course_num = ''.join(filter(str.isdigit, row["course"]))
        try:
            year = int(course_num[0])
            priority += year
        except (ValueError, IndexError):
            pass
            
        # Ավելացնենք priority հատկությունը
        row["priority"] = priority
        
        # Ավելացնենք առաջին գրաֆում
        G1.add_node(next_id, **row)
        
        # Ավելացնենք երկրորդ գրաֆում
        G2.add_node(next_id, **row)
        
        # Կոնֆլիկտային կապեր
        # ... [նույն կոդը]
        
        # Կոնֆլիկտային կապեր երկու գրաֆներում
        for graph in [G1, G2]:
            for other_node in list(graph.nodes):
                if other_node == next_id:
                    continue
                
                conflict = False
                
                # Ստանդարտ կոնֆլիկտներ
                if row["teacher"] == graph.nodes[other_node]["teacher"]:
                    conflict = True
                if row["room"] == graph.nodes[other_node]["room"]:
                    conflict = True
                    
                # Դասի տիպերի կոնֆլիկտներ
                if row["type"] in CONFLICTS and graph.nodes[other_node]["type"] in CONFLICTS[row["type"]]:
                    conflict = True
                
                if conflict:
                    graph.add_edge(next_id, other_node)
        
        next_id += 1
    
    logger.info(f"Միավորվեց {len(both_classes)} դաս երկու շաբաթների համար")
    
    return G1, G2

# ─────────────────────────────────────────────────────────────────────────
# 7) Վերջնական դասացուցակի պատրաստում
# ─────────────────────────────────────────────────────────────────────────

def find_conflicts(schedule):
    """
    Հայտնաբերում է բախումները վերջնական դասացուցակում
    """
    conflicts = []
    
    # Դասավորենք դասերն ըստ օր/ժամի
    schedule_by_slot = defaultdict(list)
    for i, entry in enumerate(schedule):
        key = (entry["day_of_week"], entry["time_of_day"], entry["week_type"])
        schedule_by_slot[key].append((i, entry))
    
    # Ստուգենք բախումները
    for slot, entries in schedule_by_slot.items():
        day, hour, week = slot
        
        for i in range(len(entries)):
            for j in range(i+1, len(entries)):
                idx1, entry1 = entries[i]
                idx2, entry2 = entries[j]
                
                # Ստուգենք հնարավոր կոնֆլիկտները
                conflict_reason = None
                
                # 1. Նույն դասախոս, նույն ժամ
                if any(teacher in json.loads(entry2["teachers"]) for teacher in json.loads(entry1["teachers"])):
                    conflict_reason = "Դասախոսի բախում"
                
                # 2. Նույն լսարան, նույն ժամ
                if any(room in json.loads(entry2["rooms"]) for room in json.loads(entry1["rooms"])):
                    conflict_reason = "Լսարանի բախում"
                
                # 3. Նույն կուրս, նույն ժամ, բայց տարբեր դասեր
                if entry1["course"] == entry2["course"]:
                    # Ստուգենք դասի տիպերի բախումները
                    type1 = entry1["type"]
                    type2 = entry2["type"]
                    
                    if type1 in CONFLICTS and type2 in CONFLICTS[type1]:
                        conflict_reason = f"Խմբերի բախում: {type1}-ը չի կարող համակցվել {type2}-ի հետ"
                
                # Եթե կա կոնֆլիկտ, ավելացնենք 
                if conflict_reason:
                    conflicts.append({
                        "course1": entry1["course"],
                        "subject1": entry1["subject"],
                        "course2": entry2["course"],
                        "subject2": entry2["subject"],
                        "issue": conflict_reason,
                        "day": day,
                        "hour": hour,
                        "week": week
                    })
    
    return conflicts
def prepare_schedule_for_db(G1, G2):
    """
    Պատրաստում է վերջնական տվյալներն SQL բազայի համար
    """
    schedule = []
    added_keys = set()
    
    # Համարիչ շաբաթվա դասերը
    for node, data in G1.nodes(data=True):
        # "Երկուսն էլ" դասերի համար ստուգենք է արդեն ավելացված
        if data.get("original_week_type") == "երկուսն էլ":
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
            
            if key in added_keys:
                continue
                
            added_keys.add(key)
            data["week_type"] = "երկուսն էլ"
        
        # Ստուգենք, որ բոլոր անհրաժեշտ դաշտերը լրացված են
        if not all(key in data for key in ["assigned_day", "assigned_hour", "week_type"]):
            logger.warning(f"Բաց թողնված տվյալներ {data.get('subject')}-ի համար")
            continue
        
        # Որոշելու mapped_type-ը
        class_type = data.get("type", "")
        mapped_type = TYPE_CATEGORIES.get(class_type, "")
        
        # Եթե mapped_type դատարկ է, օգտագործենք class_type-ը կամ լռելյայն "Դաս" արժեքը
        if not mapped_type:
            if class_type in ["Դաս", "Գործ", "Լաբ"]:
                mapped_type = class_type
            else:
                # Բոլոր այլ դեպքերի համար՝ լռելյայն "Դաս"
                mapped_type = "Դաս"
            logger.info(f"Լռելյայն mapped_type={mapped_type} տրվել է {data.get('subject')}-ին")
        
        # Ավելացնենք դասը վերջնական ցուցակին
        schedule.append({
            "level": data.get("level"),
            "course": data.get("course"),
            "subject": data.get("subject"),
            "type": class_type,
            "mapped_type": mapped_type,  # Երաշխավորում ենք, որ այն լրացված է
            "teachers": json.dumps([data.get("teacher", "")], ensure_ascii=False),
            "rooms": json.dumps([data.get("room", "")], ensure_ascii=False),
            "day_of_week": data.get("assigned_day"),
            "time_of_day": data.get("assigned_hour"),
            "week_type": data.get("week_type"),
            "preferred_slots": json.dumps([], ensure_ascii=False)  # Դատարկ preferred_slots
        })
    
    # Հայտարար շաբաթվա դասերը
    for node, data in G2.nodes(data=True):
        # Ստուգենք արդեն ավելացված "երկուսն էլ" դասերը
        if data.get("original_week_type") == "երկուսն էլ":
            continue  # Արդեն ավելացված են G1-ից
        
        # Ստուգենք անհրաժեշտ դաշտերը
        if not all(key in data for key in ["assigned_day", "assigned_hour", "week_type"]):
            logger.warning(f"Բաց թողնված տվյալներ {data.get('subject')}-ի համար")
            continue
        
        # Որոշելու mapped_type-ը
        class_type = data.get("type", "")
        mapped_type = TYPE_CATEGORIES.get(class_type, "")
        
        # Եթե mapped_type դատարկ է, օգտագործենք class_type-ը կամ լռելյայն "Դաս" արժեքը
        if not mapped_type:
            if class_type in ["Դաս", "Գործ", "Լաբ"]:
                mapped_type = class_type
            else:
                # Բոլոր այլ դեպքերի համար՝ լռելյայն "Դաս"
                mapped_type = "Դաս"
            logger.info(f"Լռելյայն mapped_type={mapped_type} տրվել է {data.get('subject')}-ին")
        
        # Ավելացնենք դասը վերջնական ցուցակին
        schedule.append({
            "level": data.get("level"),
            "course": data.get("course"),
            "subject": data.get("subject"),
            "type": class_type,
            "mapped_type": mapped_type,  # Երաշխավորում ենք, որ այն լրացված է
            "teachers": json.dumps([data.get("teacher", "")], ensure_ascii=False),
            "rooms": json.dumps([data.get("room", "")], ensure_ascii=False),
            "day_of_week": data.get("assigned_day"),
            "time_of_day": data.get("assigned_hour"),
            "week_type": data.get("week_type"),
            "preferred_slots": json.dumps([], ensure_ascii=False)
        })
    
    logger.info(f"Պատրաստվել է {len(schedule)} դաս բազայի համար")
    return schedule
def save_schedule_to_db(schedule: list[dict]) -> None:
    if not schedule:
        logger.warning("Չկա որևէ գրառում պահպանելու համար")
        return

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Մաքրում ենք հին ավտոգեներացվածը
        cur.execute("DELETE FROM created_schedule")
        conn.commit()

        # Ստուգում ենք աղյուսակի սյունակները
        cur.execute("SELECT TOP 0 * FROM created_schedule")
        columns = [col[0].lower() for col in cur.description]
        logger.info(f"created_schedule սյունակները: {columns}")

        # Ավելացնում ենք մեր տողերը՝ ըստ առկա սյունակների
        for row in schedule:
            # Հիմնական պարտադիր սյունակներ
            cur.execute("""
                INSERT INTO created_schedule
                (level, course, subject, type, mapped_type, teachers, rooms, day_of_week, time_of_day, week_type, preferred_slots)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            row["level"],
            row["course"],
            row["subject"],
            row["type"],
            row["mapped_type"],       # ավելացված է mapped_type սյունակը
            row["teachers"],          # JSON string
            row["rooms"],             # JSON string
            row["day_of_week"],
            row["time_of_day"],
            row["week_type"],
            row["preferred_slots"]    # ավելացված է preferred_slots սյունակը
            )

        conn.commit()
        logger.info("✅ created_schedule աղյուսակը թարմացվեց")
    except Exception as exc:
        conn.rollback()
        logger.error(f"❌ INSERT սխալ․ {exc}")
        raise
    finally:
        conn.close()

def main():
    # 1. Բեռնում ենք դասախոսների հասանելիությունը ու schedule_editable-ը
    teacher_avail = load_teacher_availability()
    raw_data      = load_schedule_data()

    # 2. Տարանջատում շաբաթների
    week1_data, week2_data, both_weeks = split_by_week_type(raw_data)

    # 3. Կոնֆլիկտային գրաֆեր
    G1 = build_conflict_graph(week1_data, teacher_avail)   # համարիչ
    G2 = build_conflict_graph(week2_data, teacher_avail)   # հայտարար

    # 4. Ավելացնենք «երկուսն էլ» դասերը երկու գրաֆերում
    G1, G2 = merge_both_weeks(G1, G2, both_weeks)

    # 5. Օպտիմալ ժամանակային սլոթեր
    G1 = assign_optimized_time_slots(G1, teacher_avail)
    G2 = assign_optimized_time_slots(G2, teacher_avail)

    # 6. Վերջնական ցուցակ + գրանցում բազայում
    final_schedule = prepare_schedule_for_db(G1, G2)
    save_schedule_to_db(final_schedule)              # ← այստեղ է իրական INSERT-ը

    # 7. Ընդհանուր բախումներ (լոգ / json ֆայլ)
    clashes = find_conflicts(final_schedule)
    if clashes:
        Path("conflicts.json").write_text(
            json.dumps(clashes, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )

        logger.warning("❗️ Հայտնաբերվել է %d բախում, տես ./conflicts.json", len(clashes))
    else:
        logger.info("✅ Բախումներ չեն հայտնաբերվել")

if __name__ == "__main__":
    main()
