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

# Լեզվական առարկաների ցանկ
LANGUAGE_SUBJECTS = {
    "Խորացված անգլերեն",
    # կարող եք ավելացնել այլ լեզվական առարկաներ
}

# Լսարանների տիպերը ըստ rooms_grouped_unique.json ֆայլի
ROOM_TYPES = {}

# Ավելացնում ենք "Դաս" տիպի լսարանները
for building, rooms in {
    "121": ["12103"],
    "12": ["1212"],
    "122": ["12208"],
    "123": ["12305"],
    "14": ["1401", "1403"],
    "174": ["17413"],
    "22": ["2241"],
    "23": ["2342", "2344", "2359", "2361"],
    "24": ["2431", "2435", "2444"],
    "50": ["5014"],
    "52": ["5202", "5205", "5207"],
    "54": ["5402", "5404"],
    "56": ["5601", "5602", "5604", "5606", "5608", "5609"],
    "58": ["5802"],
    "91": ["9104", "9110"],
    "92": ["9205", "9206", "9208"],
    "94": ["9402", "9410"],
    "96": ["9602", "9607", "9611"],
    "97": ["9712"],
    "special": ["Անորոշ", "ՕԼ"]
}.items():
    for room in rooms:
        ROOM_TYPES[room] = "Դաս"

# Ավելացնում ենք "Գործ" տիպի լսարանները
for building, rooms in {
    "11": ["1104"],
    "12": ["1201"],
    "121": ["12102", "12103", "12105", "12106"],
    "122": ["12201"],
    "123": ["12305"],
    "14": ["1406", "1407"],
    "174": ["17413"],
    "21": ["2127ա", "2127բ", "2141ա"],
    "22": ["2259", "2261", "2261բ"],
    "23": ["2338", "2344", "2346", "2353", "2353ա", "2359", "2361"],
    "24": ["2430", "2434", "2436", "2438", "2440", "2441ա", "2443", "2443ա"],
    "33": ["3305"],
    "510": ["51006", "51009"],
    "51": ["5117", "5118", "5120", "5121", "5122"],
    "52": ["5202", "5212"],
    "54": ["5402", "5404"],
    "56": ["5601", "5602", "5604", "5606", "5608", "5609"],
    "57": ["5706"],
    "59": ["5901", "5902"],
    "91": ["9101", "9104", "9107", "9110", "9112"],
    "92": ["9204", "9205", "9206", "9207", "9210"],
    "93": ["9301", "9302", "9303", "9309", "9310", "9315"],
    "94": ["9402", "9404", "9405", "9406", "9409", "9410", "9411", "9412"],
    "95": ["9502"],
    "96": ["9601", "9602", "9603", "9604", "9607", "9608", "9610", "9611"],
    "97": ["9703", "9705", "9706", "9708", "9711", "9717"],
    "99": ["9903", "9904", "9905ա", "9906", "9907ա", "9907բ", "9908", "9909ա", "9909բ", "9910", "9911", "9913"],
    "special": ["Անորոշ", "Ֆիզկուլտուրա"]
}.items():
    for room in rooms:
        ROOM_TYPES[room] = "Գործ"

# Ավելացնում ենք "Լաբ" տիպի լսարանները
for building, rooms in {
    "103": ["10306"],
    "122": ["12206"],
    "13": ["1313", "1316"],
    "22": ["2235"],
    "510": ["51001", "51002", "51006"],
    "51": ["5103", "5117", "5118", "5119", "5120", "5121", "5122"],
    "52": ["5212", "5218"],
    "57": ["5706", "5710"],
    "59": ["5901", "5902"],
    "71": ["7101", "7102"],
    "92": ["9201", "9204"],
    "94": ["9404"]
}.items():
    for room in rooms:
        ROOM_TYPES[room] = "Լաբ"


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
                
            # 5. ՆՈՐ ԿԱՆՈՆ: Բոլոր Դաս տիպի դասերը բախվում են միմյանց հետ, անկախ կուրսից
            if a["type"] == "Դաս" and b["type"] == "Դաս":
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
    
    # Հիմնական միավոր՝ պատահական տարր ավելացնելու համար
    score += random.randint(1, 3)
    
    # 1. Դասախոսի հասանելիություն
    if teacher_availability and node_data["teacher"] in teacher_availability:
        teacher_avail = teacher_availability[node_data["teacher"]]
        
        # Առաջնային հասանելիության ժամեր
        if (day, hour) in teacher_avail['primary']:
            score += 10
        
        # Պահուստային հասանելիության ժամեր
        if (day, hour) in teacher_avail['backup']:
            score += 5
    
    # 2. Դասի տիպին համապատասխան ժամ
    if node_data["type"] == "Դաս":
        # Դասախոսություններն ավելի լավ է անցկացնել առավոտյան
        if hour == 1 or hour == 2:
            score += 3
    elif node_data["type"].startswith("Լաբ"):
        # Լաբորատորներն ավելի լավ է անցկացնել ուշ ժամերին
        if hour == 3 or hour == 4:
            score += 3
    
    # 3. Լսարանի հատուկ սահմանափակումներ
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

def assign_slots_for_course(course_code, classes, teacher_availability):
    """
    Մեկ կուրսի համար բաշխում է դասերը ժամային սլոթերի մեջ՝ 
    փորձելով ավելի "համառ" լուծումներ գտնել կոնֆլիկտների դեպքում
    """
    logger.info(f"Դասերի բաշխում {course_code} կուրսի համար")
    
    # Ստեղծում ենք դատարկ շաբաթվա դասացուցակը
    course_schedule = create_empty_week_schedule()
    
    # Տեսակավորում ենք դասերը՝ առաջնահերթությամբ
    # 1. Դասախոսություններ
    # 2. Գործնականներ
    # 3. Լաբորատորներ
    
    classes_by_type = {
        "Դաս": [],
        "Գործ": [],
        "Լաբ": []
    }
    
    for cls in classes:
        class_type = cls["type"]
        # Որոշում ենք հիմնական տիպը (Դաս, Գործ, Լաբ)
        main_type = TYPE_CATEGORIES.get(class_type, "Դաս")
        classes_by_type[main_type].append(cls)
    
    # Հետևում ենք զբաղված սլոթերին և լսարաններին
    occupied_slots_by_teachers = defaultdict(set)  # Դասախոսներով զբաղեցված սլոթները
    occupied_slots_by_rooms = defaultdict(set)     # Լսարաններով զբաղեցված սլոթները
    occupied_slots = set()                         # Ընդհանուր զբաղեցված սլոթները այս կուրսի համար
    
    # Լրացուցիչ տեղեկություն ամեն դասի համար
    class_info = {}
    
    # Օժանդակ ֆունկցիա՝ ստուգելու արդյոք սլոթն ազատ է
    def is_slot_available(slot, lecture):
        day, hour = slot
        
        # 1. Ստուգենք արդյոք սլոթն արդեն զբաղված է այս կուրսի համար (տիպերի կոնֆլիկտներ)
        if slot in occupied_slots:
            slot_class = course_schedule[slot]
            if slot_class:
                # Ստուգենք lecture["type"]-ը CONFLICTS-ում
                conflicts_for_type = CONFLICTS.get(lecture["type"], set())
                if slot_class["type"] in conflicts_for_type:
                    return False
                
        # 2. Ստուգենք արդյոք դասախոսը հասանելի է այս ժամին
        teacher = lecture["teacher"]
        if teacher not in ["Անորոշ", "Հայտնի չէ"]:
            if slot in occupied_slots_by_teachers[teacher]:
                return False
                
            # Եթե դասախոսի հասանելիության մասին ունենք տվյալներ, ստուգենք
            if teacher_availability and teacher in teacher_availability:
                teacher_avail = teacher_availability[teacher]
                if not ((day, hour) in teacher_avail.get('primary', []) or 
                        (day, hour) in teacher_avail.get('backup', [])):
                    # Դասախոսն այս ժամին հասանելի չէ
                    return False
        
        # 3. Ստուգենք արդյոք լսարանը հասանելի է այս ժամին
        room = lecture["room"]
        if room not in ["Անորոշ", "Հայտնի չէ"]:
            if slot in occupied_slots_by_rooms[room]:
                return False
        
        # Սլոթը հասանելի է
        return True
    
    # Օժանդակ ֆունկցիա՝ սլոթի նշանակման համար
    def assign_slot(slot, lecture):
        day, hour = slot
        
        # Ամրագրում ենք սլոթը
        course_schedule[slot] = lecture
        occupied_slots.add(slot)
        
        # Ամրագրում ենք դասախոսին
        if lecture["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
            occupied_slots_by_teachers[lecture["teacher"]].add(slot)
        
        # Ամրագրում ենք լսարանը
        if lecture["room"] not in ["Անորոշ", "Հայտնի չէ"]:
            occupied_slots_by_rooms[lecture["room"]].add(slot)
        
        # Պահպանում ենք մանրամասն տեղեկություն
        hour_index = (day - 1) * 4 + (hour - 1)
        class_info[id(lecture)] = {
            "assigned_day": day,
            "assigned_hour": hour,
            "week_type": get_week_type(hour_index)
        }
        
        return True
    
    # Նախ նշանակենք դասախոսությունները՝ նախընտրելով առավոտյան ժամերը
    for lecture in classes_by_type["Դաս"]:
        assigned = False
        
        # 1. Առաջնահերթ փորձում ենք առավոտյան ժամերը (1-2)
        for day in range(1, 6):
            for hour in [1, 2]:
                slot = (day, hour)
                if is_slot_available(slot, lecture):
                    assigned = assign_slot(slot, lecture)
                    break
            if assigned:
                break
                
        # 2. Եթե չհաջողվեց, փորձում ենք բոլոր հնարավոր ժամերը
        if not assigned:
            for day in range(1, 6):
                for hour in range(1, 5):
                    slot = (day, hour)
                    if is_slot_available(slot, lecture):
                        assigned = assign_slot(slot, lecture)
                        break
                if assigned:
                    break
        
        # 3. Եթե դեռ չի հաջողվել, նշանակում ենք որևէ ժամանակ՝ անտեսելով կոնֆլիկտները
        if not assigned:
            logger.warning(f"Դասը {lecture['subject']} ({lecture['type']}) կուրսի {course_code} համար կոնֆլիկտներով է նշանակվել")
            # Ընտրում ենք պատահական ժամ
            random_day = random.choice(range(1, 6))
            random_hour = random.choice(range(1, 5))
            slot = (random_day, random_hour)
            assigned = assign_slot(slot, lecture)
    
    # Այնուհետև գործնականները՝ նախընտրելով միջին ժամերը (2-3)
    for practical in classes_by_type["Գործ"]:
        assigned = False
        
        # 1. Առաջնահերթ փորձում ենք միջին ժամերը (2-3)
        for day in range(1, 6):
            for hour in [2, 3]:
                slot = (day, hour)
                if is_slot_available(slot, practical):
                    assigned = assign_slot(slot, practical)
                    break
            if assigned:
                break
                
        # 2. Եթե չհաջողվեց, փորձում ենք բոլոր հնարավոր ժամերը
        if not assigned:
            for day in range(1, 6):
                for hour in range(1, 5):
                    slot = (day, hour)
                    if is_slot_available(slot, practical):
                        assigned = assign_slot(slot, practical)
                        break
                if assigned:
                    break
        
        # 3. Եթե դեռ չի հաջողվել, նշանակում ենք որևէ ժամանակ՝ անտեսելով կոնֆլիկտները
        if not assigned:
            logger.warning(f"Գործնականը {practical['subject']} ({practical['type']}) կուրսի {course_code} համար կոնֆլիկտներով է նշանակվել")
            # Ընտրում ենք պատահական ժամ
            random_day = random.choice(range(1, 6))
            random_hour = random.choice(range(1, 5))
            slot = (random_day, random_hour)
            assigned = assign_slot(slot, practical)
    
    # Վերջում լաբորատորները՝ նախընտրելով կեսօրից հետո ժամերը (3-4)
    for lab in classes_by_type["Լաբ"]:
        assigned = False
        
        # 1. Առաջնահերթ փորձում ենք ուշ ժամերը (3-4)
        for day in range(1, 6):
            for hour in [3, 4]:
                slot = (day, hour)
                if is_slot_available(slot, lab):
                    assigned = assign_slot(slot, lab)
                    break
            if assigned:
                break
                
        # 2. Եթե չհաջողվեց, փորձում ենք բոլոր հնարավոր ժամերը
        if not assigned:
            for day in range(1, 6):
                for hour in range(1, 5):
                    slot = (day, hour)
                    if is_slot_available(slot, lab):
                        assigned = assign_slot(slot, lab)
                        break
                if assigned:
                    break
        
        # 3. Եթե դեռ չի հաջողվել, նշանակում ենք որևէ ժամանակ՝ անտեսելով կոնֆլիկտները
        if not assigned:
            logger.warning(f"Լաբը {lab['subject']} ({lab['type']}) կուրսի {course_code} համար կոնֆլիկտներով է նշանակվել")
            # Ընտրում ենք պատահական ժամ
            random_day = random.choice(range(1, 6))
            random_hour = random.choice(range(1, 5))
            slot = (random_day, random_hour)
            assigned = assign_slot(slot, lab)
    
    # Վերադարձնենք բոլոր դասերն իրենց նշանակված ժամերով
    result = []
    for cls in classes:
        # Եթե դասին հաջողվել է ժամ տալ
        if id(cls) in class_info:
            cls_info = class_info[id(cls)]
            cls_with_time = cls.copy()
            cls_with_time.update(cls_info)
            result.append(cls_with_time)
        else:
            # Այս դեպքը չպետք է լինի, քանի որ մենք բոլոր դասերին ժամ ենք տալիս
            logger.error(f"ՍԽԱԼ: Չկարողացանք ժամ տալ {cls['subject']} առարկային {course_code} կուրսում")
    
    return result

def create_empty_week_schedule():
    """
    Ստեղծում է դատարկ շաբաթվա դասացուցակ (5 օր, 4 ժամ)
    """
    return {(day, hour): None for day in range(1, 6) for hour in range(1, 5)}


def is_teacher_available(teacher, day, hour, teacher_availability):
    """
    Ստուգում է արդյոք դասախոսը հասանելի է տվյալ ժամին
    """
    # Եթե դասախոսը "Անորոշ" կամ "Հայտնի չէ" է, համարում ենք հասանելի
    if teacher in ["Անորոշ", "Հայտնի չէ"]:
        return True
    
    # Եթե չունենք տեղեկություն այս դասախոսի մասին, համարում ենք հասանելի
    if not teacher_availability or teacher not in teacher_availability:
        return True
    
    teacher_avail = teacher_availability[teacher]
    
    # Առաջնահերթություն ենք տալիս "primary" հասանելիություն ունեցող ժամերին
    if (day, hour) in teacher_avail.get('primary', []):
        return True
    
    # Հետո նայում ենք "backup" ժամերը
    if (day, hour) in teacher_avail.get('backup', []):
        return True
    
    # Եթե դասախոսը ունի հասանելիության տվյալներ, բայց այս ժամը չկա նրա ցուցակում
    return False


def group_by_course(classes):
    """
    Խմբավորում է դասերն ըստ կուրսերի
    """
    course_groups = defaultdict(list)
    
    for cls in classes:
        course_code = cls["course"]
        course_groups[course_code].append(cls)
    
    logger.info(f"Դասերը խմբավորվեցին {len(course_groups)} կուրսերի համար")
    return course_groups


def schedule_all_courses(raw_data, teacher_availability):
    """
    Կազմում է դասացուցակ բոլոր կուրսերի համար
    """
    # Տարանջատում ենք դասերն ըստ շաբաթների
    week1_data, week2_data, both_weeks = split_by_week_type(raw_data)
    
    # Կազմում ենք առանձին-առանձին դասացուցակներ համարիչ, հայտարար և երկուսն էլ շաբաթների համար
    
    # 1. Համարիչ շաբաթ (week1_data)
    week1_by_course = group_by_course(week1_data)
    week1_schedule = []
    
    for course_code, classes in week1_by_course.items():
        course_schedule = assign_slots_for_course(course_code, classes, teacher_availability)
        week1_schedule.extend(course_schedule)
    
    # 2. Հայտարար շաբաթ (week2_data)
    week2_by_course = group_by_course(week2_data)
    week2_schedule = []
    
    for course_code, classes in week2_by_course.items():
        course_schedule = assign_slots_for_course(course_code, classes, teacher_availability)
        week2_schedule.extend(course_schedule)
    
    # 3. Երկուսն էլ շաբաթներում (both_weeks)
    both_by_course = group_by_course(both_weeks)
    both_schedule = []
    
    for course_code, classes in both_by_course.items():
        course_schedule = assign_slots_for_course(course_code, classes, teacher_availability)
        # Նշում ենք որ դասը երկու շաբաթների համար է
        for cls in course_schedule:
            cls["week_type"] = "երկուսն էլ"
        both_schedule.extend(course_schedule)
    
    # Միավորում ենք բոլոր դասացուցակները
    final_schedule = week1_schedule + week2_schedule + both_schedule
    
    # Վերադարձնում ենք վերջնական դասացուցակը
    return final_schedule
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
        # Ստուգենք բոլոր անհրաժեշտ դաշտերը
        if all(key in entry for key in ["assigned_day", "assigned_hour", "week_type"]):
            key = (entry["assigned_day"], entry["assigned_hour"], entry["week_type"])
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
                if entry1["teacher"] == entry2["teacher"] and entry1["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                    conflict_reason = "Դասախոսի բախում"
                
                # 2. Նույն լսարան, նույն ժամ
                if entry1["room"] == entry2["room"] and entry1["room"] not in ["Անորոշ", "Հայտնի չէ"]:
                    conflict_reason = "Լսարանի բախում"
                
                # 3. Նույն կուրս, նույն ժամ, բայց տարբեր դասեր
                if entry1["course"] == entry2["course"]:
                    # Ստուգենք դասի տիպերի բախումները
                    type1 = entry1["type"]
                    type2 = entry2["type"]
                    
                    # Լեզվի առարկաների կարևոր բացառությունը
                    is_language_exception = (
                        entry1["subject"] in LANGUAGE_SUBJECTS and 
                        entry2["subject"] in LANGUAGE_SUBJECTS and
                        entry1["subject"] == entry2["subject"] and
                        entry1["type"] == "Գործ" and  # Միայն "Գործ" տիպի համար
                        entry2["type"] == "Գործ" and
                        entry1["teacher"] != entry2["teacher"]  # Տարբեր դասախոսներ
                    )
                    
                    # Եթե լեզվի խմբային դասեր չեն, ապա կոնֆլիկտ ենք ստուգում
                    if not is_language_exception:
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


def prepare_schedule_for_db(schedule):
    """
    Պատրաստում է վերջնական տվյալներն SQL բազայի համար
    """
    result = []
    
    for entry in schedule:
        # Ստուգենք բոլոր անհրաժեշտ դաշտերը
        if not all(key in entry for key in ["assigned_day", "assigned_hour", "week_type"]):
            logger.warning(f"Բաց թողնված տվյալներ {entry.get('subject')}-ի համար")
            continue
        
        # Որոշելու mapped_type-ը
        class_type = entry.get("type", "")
        mapped_type = TYPE_CATEGORIES.get(class_type, "")
        
        # Եթե mapped_type դատարկ է, օգտագործենք class_type-ը կամ լռելյայն "Դաս" արժեքը
        if not mapped_type:
            if class_type in ["Դաս", "Գործ", "Լաբ"]:
                mapped_type = class_type
            else:
                # Բոլոր այլ դեպքերի համար՝ լռելյայն "Դաս"
                mapped_type = "Դաս"
            logger.info(f"Լռելյայն mapped_type={mapped_type} տրվել է {entry.get('subject')}-ին")
        
        # Ավելացնենք դասը վերջնական ցուցակին
        result.append({
            "level": entry.get("level"),
            "course": entry.get("course"),
            "subject": entry.get("subject"),
            "type": class_type,
            "mapped_type": mapped_type,
            "teachers": json.dumps([entry.get("teacher", "")], ensure_ascii=False),
            "rooms": json.dumps([entry.get("room", "")], ensure_ascii=False),
            "day_of_week": entry.get("assigned_day"),
            "time_of_day": entry.get("assigned_hour"),
            "week_type": entry.get("week_type"),
            "preferred_slots": json.dumps([], ensure_ascii=False)  # Դատարկ preferred_slots
        })
    
    logger.info(f"Պատրաստվել է {len(result)} դաս բազայի համար")
    return result

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
    """
    Գլխավոր ֆունկցիա, որը հաջորդաբար կատարում է դասացուցակի կազմումը
    """
    try:
        # 1. Բեռնում ենք դասախոսների հասանելիությունը և դասերի տվյալները
        logger.info("Բեռնում ենք տվյալները...")
        teacher_avail = load_teacher_availability()
        raw_data = load_schedule_data()
        logger.info(f"Բեռնվել է {len(raw_data)} դաս")
        
        # 2. Կազմում ենք դասացուցակ բոլոր կուրսերի համար (նոր մոտեցում)
        logger.info("Կազմում ենք դասացուցակ...")
        final_schedule = schedule_all_courses(raw_data, teacher_avail)
        logger.info(f"Կազմվել է ընդհանուր դասացուցակ {len(final_schedule)} դասով")
        
        # 3. Պատրաստում և գրանցում ենք արդյունքները
        logger.info("Պատրաստում ենք տվյալները բազայի համար...")
        db_schedule = prepare_schedule_for_db(final_schedule)
        
        logger.info("Գրանցում ենք տվյալները բազայում...")
        save_schedule_to_db(db_schedule)
        logger.info(f"Բազայում գրանցվել է {len(db_schedule)} դաս")
        
        # 4. Ստուգում ենք բախումները
        logger.info("Ստուգում ենք բախումները...")
        clashes = find_conflicts(final_schedule)
        
        if clashes:
            Path("conflicts.json").write_text(
                json.dumps(clashes, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            
            logger.warning(f"❗️ Հայտնաբերվել է {len(clashes)} բախում, տես ./conflicts.json")
        else:
            logger.info("✅ Բախումներ չեն հայտնաբերվել")
        
        logger.info("Դասացուցակը հաջողությամբ կազմվել է")
        return True
    
    except Exception as e:
        logger.error(f"❌ ՍԽԱԼ. {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    main()