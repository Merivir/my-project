import json
import logging
import random
from collections import defaultdict
from pathlib import Path
import pyodbc

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────
# 1) Global parameters and types
# ─────────────────────────────────────────────────────────────────────────

# Class type categories
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

# Class type conflicts
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

# Language subjects list
LANGUAGE_SUBJECTS = {
    "Խորացված անգլերեն",
    # You can add other language subjects here
}

# Definition of room types
ROOM_TYPES = {}

# Add "Դաս" type rooms
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

# Add "Գործ" type rooms
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

# Add "Լաբ" type rooms
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
# 2) Helper functions
# ─────────────────────────────────────────────────────────────────────────

def get_week_type(slot: int) -> str:
    """
    If slot is even, week_type="հայտարար",
    if odd, week_type="համարիչ".
    """
    return "հայտարար" if slot % 2 == 0 else "համարիչ"

def get_db_connection():
    """Database connection"""
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
        logger.error(f"DB connection error: {e}")
        raise

def load_teacher_availability():
    """
    Loads teacher availability from PrimaryAvailability and 
    BackupAvailability tables
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
    
    # Processing
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
    """Get index from day name"""
    day_map = {
        'Երկուշաբթի': 1,
        'Երեքշաբթի': 2,
        'Չորեքշաբթի': 3,
        'Հինգշաբթի': 4,
        'Ուրբաթ': 5
    }
    return day_map.get(day_name)

def get_hour_index(time_slot):
    """Get index from time slot"""
    hour_map = {
        '09:30-10:50': 1,
        '11:00-12:20': 2,
        '12:50-14:10': 3,
        '14:20-15:40': 4
    }
    return hour_map.get(time_slot)

def get_course_prefix(course_code):
    """
    Returns the course code prefix (e.g. "ՏՏ420" -> "ՏՏ")
    Used to group similar courses together
    """
    for i, char in enumerate(course_code):
        if char.isdigit():
            return course_code[:i]
    return course_code

# ─────────────────────────────────────────────────────────────────────────
# 3) Data loading
# ─────────────────────────────────────────────────────────────────────────

def load_schedule_data():
    """
    Loads class data from the schedule_editable table
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
                WHEN we.type = 'weekly' THEN 1  -- Every week
                ELSE 2                          -- Every two weeks
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
    Splits classes by week type: numerator, denominator, both
    """
    week1 = []  # numerator (համարիչ)
    week2 = []  # denominator (հայտարար)
    both = []   # both weeks
    
    for row in data:
        wtype = row.get("week_type", "համարիչ").strip()
        weekly_freq = row.get("weekly_frequency", 2)
        
        # If class is held every week (weekly_frequency=1)
        if weekly_freq == 1:
            both.append(row)
        else:
            # If class is held every two weeks
            if wtype == "համարիչ":
                week1.append(row)
            elif wtype == "հայտարար":
                week2.append(row)
            elif wtype == "երկուսն էլ":
                both.append(row)
    
    logger.info(f"Numerator week: {len(week1)} classes")
    logger.info(f"Denominator week: {len(week2)} classes")
    logger.info(f"Both weeks: {len(both)} classes")
    
    return week1, week2, both

def group_by_course(classes):
    """
    Groups classes by course
    """
    course_groups = defaultdict(list)
    
    for cls in classes:
        course_code = cls["course"]
        course_groups[course_code].append(cls)
    
    logger.info(f"Classes grouped for {len(course_groups)} courses")
    return course_groups

# ─────────────────────────────────────────────────────────────────────────
# 4) Improved Scheduling Algorithm
# ─────────────────────────────────────────────────────────────────────────

def create_empty_schedule():
    """
    Creates an empty schedule for 5 days with 4 time slots each
    Returns a dictionary with (day, hour) tuples as keys and empty lists as values
    """
    return {(day, hour): [] for day in range(1, 6) for hour in range(1, 5)}

def calculate_class_priority(class_data):
    """
    Calculate priority for a class based on type and course year
    Higher priority classes are scheduled first
    """
    priority = 0
    
    # Priority by class type
    if class_data["type"] == "Դաս":
        priority += 10  # Lectures are more important
    elif class_data["type"].startswith("Գործ"):
        priority += 5   # Then practical classes
    else:
        priority += 2   # Then laboratory classes
    
    # Priority by course year - higher years get higher priority
    course_num = ''.join(filter(str.isdigit, class_data["course"]))
    try:
        year = int(course_num[0])
        priority += year
    except (ValueError, IndexError):
        pass
    
    return priority

def is_teacher_available(teacher, day, hour, teacher_availability):
    """
    Check if teacher is available at the given time
    """
    # If teacher is "Unknown", consider them available
    if teacher in ["Անորոշ", "Հայտնի չէ"]:
        return True
    
    # If we don't have information about this teacher, consider them available
    if not teacher_availability or teacher not in teacher_availability:
        return True
    
    teacher_avail = teacher_availability[teacher]
    
    # First check "primary" availability
    if (day, hour) in teacher_avail.get('primary', []):
        return True
    
    # Then check "backup" availability
    if (day, hour) in teacher_avail.get('backup', []):
        return True
    
    # If teacher has availability data but this time is not in their list
    return False

def check_type_conflict(class1_type, class2_type):
    """
    Check if there is a conflict between two class types
    """
    if class1_type in CONFLICTS and class2_type in CONFLICTS[class1_type]:
        return True
    return False

def find_suitable_slot(class_data, schedule, teacher_availability, occupied_slots_by_teacher, conflict_stats=None):
    """
    Find a suitable time slot for a class using a simplified approach:
    - Try each of the 20 time slots sequentially
    - Check for teacher availability and class type conflicts
    - Ignore room conflicts as requested
    - Tracks occupied slots by teacher to prevent teacher conflicts
    - Optionally tracks conflict statistics for debugging
    """
    # Get all time slots in order but shuffle them to improve distribution
    all_slots = [(day, hour) for day in range(1, 6) for hour in range(1, 5)]
    random.shuffle(all_slots)  # Randomize slot order to better distribute classes
    
    # Initialize conflict counter if stats are requested
    if conflict_stats is not None:
        slot_conflicts = {slot: 0 for slot in all_slots}
    
    # Try all 20 slots
    for slot in all_slots:
        day, hour = slot
        
        # Check if this teacher is already occupied at this time
        teacher = class_data["teacher"]
        if teacher not in ["Անորոշ", "Հայտնի չէ"] and slot in occupied_slots_by_teacher.get(teacher, set()):
            if conflict_stats is not None:
                conflict_stats["teacher_conflict"] += 1
                slot_conflicts[slot] += 1
            continue
        
        # Check teacher availability from preference data
        if not is_teacher_available(teacher, day, hour, teacher_availability):
            if conflict_stats is not None:
                conflict_stats["availability_conflict"] += 1
                slot_conflicts[slot] += 1
            continue
        
        # Check for type conflicts with already scheduled classes
        conflict_found = False
        
        for existing_class in schedule[slot]:
            # Type 1: Check conflicts for the same course
            if existing_class["course"] == class_data["course"]:
                # Special case for language subjects
                is_language_exception = (
                    existing_class["subject"] in LANGUAGE_SUBJECTS and 
                    class_data["subject"] in LANGUAGE_SUBJECTS and
                    existing_class["subject"] == class_data["subject"] and
                    existing_class["type"] == "Գործ" and
                    class_data["type"] == "Գործ" and
                    existing_class["teacher"] != class_data["teacher"]
                )
                
                # If not a language exception, check for type conflict
                if not is_language_exception and check_type_conflict(class_data["type"], existing_class["type"]):
                    conflict_found = True
                    if conflict_stats is not None:
                        conflict_stats["same_course_type_conflict"] += 1
                    break
            
            # Type 2: Special case - all lecture-type classes conflict with each other
            elif class_data["type"] == "Դաս" and existing_class["type"] == "Դաս":
                conflict_found = True
                if conflict_stats is not None:
                    conflict_stats["lecture_conflict"] += 1
                break
                
            # Type 3: Check for same subject and teacher
            elif (class_data["subject"] == existing_class["subject"] and 
                  class_data["teacher"] == existing_class["teacher"] and 
                  class_data["teacher"] not in ["Անորոշ", "Հայտնի չէ"]):
                conflict_found = True
                if conflict_stats is not None:
                    conflict_stats["subject_teacher_conflict"] += 1
                break
        
        if not conflict_found:
            # Slot is suitable, track it and return
            if teacher not in ["Անորոշ", "Հայտնի չէ"]:
                occupied_slots_by_teacher.setdefault(teacher, set()).add(slot)
            
            hour_index = (day - 1) * 4 + (hour - 1)  # Calculate index for determining week type
            return day, hour, get_week_type(hour_index)
        
        if conflict_stats is not None:
            slot_conflicts[slot] += 1
    
    # If we collected statistics, log the most conflicted slots
    if conflict_stats is not None:
        conflict_stats["all_slots_failed"] += 1
        # Log the slots with the most conflicts
        most_conflicted = sorted(slot_conflicts.items(), key=lambda x: x[1], reverse=True)[:5]
        conflict_stats["most_conflicted_slots"].append(most_conflicted)
    
    # If no suitable slot found after trying all 20 possibilities,
    # Find the slot with the least conflicts
    least_conflicted_slot = min(all_slots, key=lambda s: len(schedule[s]))
    day, hour = least_conflicted_slot
    hour_index = (day - 1) * 4 + (hour - 1)
    
    logger.warning(f"No ideal slot found for {class_data['subject']} ({class_data['type']}), using least conflicted slot ({day},{hour})")
    return day, hour, get_week_type(hour_index)
def improved_schedule_algorithm(all_classes, teacher_availability):
    """
    Բարելավված ալգորիթմ հետևյալ մոտեցմամբ:
    1. Դասավորել դասերը ըստ առաջնահերթության
    2. Յուրաքանչյուր դասի համար փորձել գտնել հարմար սլոթ
    3. Եթե հարմար սլոթ չի գտնվում, փորձել վերադասավորել արդեն գոյություն ունեցող դասերը
    4. Ավելացնել դասը ժամանակացույցին
    """
    # Ստեղծել դատարկ ժամանակացույց
    schedule = create_empty_schedule()
    
    # Հետևել դասախոսների զբաղված սլոթներին
    occupied_slots_by_teacher = {}
    
    # Հաշվել բախումները դիագնոստիկայի համար
    conflict_stats = {
        "teacher_conflict": 0,
        "availability_conflict": 0,
        "same_course_type_conflict": 0,
        "lecture_conflict": 0,
        "subject_teacher_conflict": 0,
        "all_slots_failed": 0,
        "most_conflicted_slots": [],
        "backtracking_attempts": 0,
        "successful_backtracking": 0
    }
    
    # Հաշվել առաջնահերթությունը յուրաքանչյուր դասի համար և դասավորել
    classes_with_priority = [(cls, calculate_class_priority(cls)) for cls in all_classes]
    sorted_classes = sorted(classes_with_priority, key=lambda x: x[1], reverse=True)
    
    # Խմբավորել դասերը ըստ առարկայի՝ ավելի լավ բաշխման համար
    courses = {}
    for class_data, priority in sorted_classes:
        course = class_data["course"]
        if course not in courses:
            courses[course] = []
        courses[course].append((class_data, priority))
    
    # Վերջնական արդյունք՝ նշանակված սլոթներով
    result = []
    # Պահել դասերի ինդեքսները ըստ սլոթների՝ վերադասավորման համար
    result_by_slot = {(day, hour): [] for day in range(1, 6) for hour in range(1, 5)}
    
    # Մշակել յուրաքանչյուր դասընթացը առանձին՝ ավելի լավ բաշխում ապահովելու համար
    for course, course_classes in courses.items():
        logger.info(f"Scheduling classes for course: {course}")
        
        # Դասավորել դասերը յուրաքանչյուր դասընթացի մեջ ըստ առաջնահերթության
        course_classes.sort(key=lambda x: x[1], reverse=True)
        
        # Հետևել այս դասընթացի կողմից օգտագործված սլոթներին
        course_slots_used = set()
        
        # Մշակել յուրաքանչյուր դաս այս դասընթացի համար
        for class_data, priority in course_classes:
            # Փորձել տեղավորել դասը առանց վերադասավորման
            slot_found, day, hour, week_type = try_find_slot(
                class_data, 
                schedule, 
                teacher_availability,
                occupied_slots_by_teacher,
                conflict_stats
            )
            
            # Եթե սլոթ չի գտնվել, փորձել վերադասավորել արդեն գոյություն ունեցող դասերը
            if not slot_found:
                logger.info(f"Attempting backtracking for {class_data['subject']} ({class_data['type']})")
                conflict_stats["backtracking_attempts"] += 1
                
                # Փորձել վերադասավորում՝ առաջնահերթությունը հաշվի առնելով
                slot_found, day, hour, week_type = try_backtracking(
                    class_data,
                    schedule,
                    result,
                    result_by_slot,
                    teacher_availability,
                    occupied_slots_by_teacher,
                    conflict_stats
                )
                
                if slot_found:
                    conflict_stats["successful_backtracking"] += 1
                    logger.info(f"Backtracking successful for {class_data['subject']}")
            
            # Պահպանել սկզբնական week_type-ը, եթե այն գոյություն ունի
            if "week_type" in class_data:
                week_type = class_data["week_type"]
            
            # Ավելացնել ժամանակացույցին՝ բախումների ստուգման համար
            schedule[(day, hour)].append(class_data)
            course_slots_used.add((day, hour))
            
            # Դասախոսի սլոթը նշել որպես զբաղված
            teacher = class_data["teacher"]
            if teacher not in ["Անորոշ", "Հայտնի չէ"]:
                occupied_slots_by_teacher.setdefault(teacher, set()).add((day, hour))
            
            # Պատրաստել արդյունքի գրառումը
            result_entry = class_data.copy()
            result_entry.update({
                "assigned_day": day,
                "assigned_hour": hour,
                "week_type": week_type
            })
            
            # Պահպանել արդյունքը և ինդեքսը
            result_index = len(result)
            result.append(result_entry)
            result_by_slot[(day, hour)].append(result_index)
    
    # Գրանցել սլոթերի բաշխման վիճակագրությունը
    slot_counts = {slot: len(classes) for slot, classes in schedule.items()}
    filled_slots = sum(1 for count in slot_counts.values() if count > 0)
    max_classes = max(slot_counts.values()) if slot_counts else 0
    avg_classes = sum(slot_counts.values()) / len(slot_counts) if slot_counts else 0
    
    logger.info(f"Scheduled {len(result)} classes across {filled_slots}/20 time slots")
    logger.info(f"Max classes per slot: {max_classes}, Average: {avg_classes:.2f}")
    logger.info(f"Conflict stats: {conflict_stats}")
    
    return result

def try_find_slot(class_data, schedule, teacher_availability, occupied_slots_by_teacher, conflict_stats=None):
    """
    Փորձում է գտնել հարմար սլոթ դասի համար:
    - Փորձում է 20 սլոթներից յուրաքանչյուրը
    - Ստուգում է դասախոսի հասանելիությունը և դասի տիպի բախումները
    - Վերադարձնում է (գտնվել_է, օր, ժամ, շաբաթի_տիպ) քառյակ
    """
    # Վերցնել բոլոր սլոթները, բայց խառնել բաշխումը բարելավելու համար
    all_slots = [(day, hour) for day in range(1, 6) for hour in range(1, 5)]
    random.shuffle(all_slots)
    
    # Սկզբնավորել բախումների հաշվիչը, եթե վիճակագրություն է հարկավոր
    if conflict_stats is not None:
        slot_conflicts = {slot: 0 for slot in all_slots}
    
    # Փորձել բոլոր 20 սլոթները
    for slot in all_slots:
        day, hour = slot
        
        # Ստուգել, արդյոք այս դասախոսն արդեն զբաղված է այս ժամին
        teacher = class_data["teacher"]
        if teacher not in ["Անորոշ", "Հայտնի չէ"] and slot in occupied_slots_by_teacher.get(teacher, set()):
            if conflict_stats is not None:
                conflict_stats["teacher_conflict"] += 1
                slot_conflicts[slot] += 1
            continue
        
        # Ստուգել դասախոսի հասանելիությունը նախապատվության տվյալներից
        if not is_teacher_available(teacher, day, hour, teacher_availability):
            if conflict_stats is not None:
                conflict_stats["availability_conflict"] += 1
                slot_conflicts[slot] += 1
            continue
        
        # Ստուգել արդեն նշանակված դասերի հետ տիպի բախումները
        conflict_found = False
        
        for existing_class in schedule[slot]:
            # Տիպ 1: Ստուգել նույն առարկայի բախումները
            if existing_class["course"] == class_data["course"]:
                # Հատուկ դեպք լեզվի առարկաների համար
                is_language_exception = (
                    existing_class["subject"] in LANGUAGE_SUBJECTS and 
                    class_data["subject"] in LANGUAGE_SUBJECTS and
                    existing_class["subject"] == class_data["subject"] and
                    existing_class["type"] == "Գործ" and
                    class_data["type"] == "Գործ" and
                    existing_class["teacher"] != class_data["teacher"]
                )
                
                # Եթե չի լեզվի բացառություն, ստուգել տիպի բախում
                if not is_language_exception and check_type_conflict(class_data["type"], existing_class["type"]):
                    conflict_found = True
                    if conflict_stats is not None:
                        conflict_stats["same_course_type_conflict"] += 1
                    break
            
            # Տիպ 2: Հատուկ դեպք - բոլոր "Դաս" տիպի դասերը բախվում են միմյանց հետ
            elif class_data["type"] == "Դաս" and existing_class["type"] == "Դաս":
                conflict_found = True
                if conflict_stats is not None:
                    conflict_stats["lecture_conflict"] += 1
                break
                
            # Տիպ 3: Ստուգել նույն առարկայի և դասախոսի համար
            elif (class_data["subject"] == existing_class["subject"] and 
                  class_data["teacher"] == existing_class["teacher"] and 
                  class_data["teacher"] not in ["Անորոշ", "Հայտնի չէ"]):
                conflict_found = True
                if conflict_stats is not None:
                    conflict_stats["subject_teacher_conflict"] += 1
                break
        
        if not conflict_found:
            # Սլոթը հարմար է, վերադարձնել
            hour_index = (day - 1) * 4 + (hour - 1)  # Հաշվել ինդեքսը շաբաթվա տիպը որոշելու համար
            return True, day, hour, get_week_type(hour_index)
    
    # Եթե բախումների վիճակագրություն է հավաքվել, գրանցել ամենաշատ բախում ունեցող սլոթները
    if conflict_stats is not None:
        conflict_stats["all_slots_failed"] += 1
        most_conflicted = sorted(slot_conflicts.items(), key=lambda x: x[1], reverse=True)[:5]
        conflict_stats["most_conflicted_slots"].append(most_conflicted)
    
    # Եթե հարմար սլոթ չի գտնվել բոլոր 20 հնարավորություններից հետո,
    # Գտնել նվազագույն բախումներ ունեցող սլոթը
    least_conflicted_slot = min(all_slots, key=lambda s: len(schedule[s]))
    day, hour = least_conflicted_slot
    hour_index = (day - 1) * 4 + (hour - 1)
    
    logger.warning(f"No ideal slot found for {class_data['subject']} ({class_data['type']}), using least conflicted slot ({day},{hour})")
    return False, day, hour, get_week_type(hour_index)

def try_backtracking(class_data, schedule, result, result_by_slot, teacher_availability, occupied_slots_by_teacher, conflict_stats):
    """
    Փորձում է վերադասավորել արդեն նշանակված դասերը՝ տեղ ազատելու համար նոր դասի համար
    Վերադարձնում է (հաջողվել_է, օր, ժամ, շաբաթվա_տիպ) քառյակ
    """
    # Գտնել պոտենցիալ սլոթներ հիմնական բախումներով
    potential_slots = []
    
    # Վերցնել բոլոր սլոթները հերթականությամբ, բայց խառնել դրանք
    all_slots = [(day, hour) for day in range(1, 6) for hour in range(1, 5)]
    random.shuffle(all_slots)
    
    for slot in all_slots:
        day, hour = slot
        conflicts = []
        
        # Ստուգել դասախոսի բախումները
        teacher = class_data["teacher"]
        if teacher not in ["Անորոշ", "Հայտնի չէ"] and slot in occupied_slots_by_teacher.get(teacher, set()):
            conflicts.append("teacher")
            
        # Ստուգել դասի տիպի բախումները
        for existing_class in schedule[slot]:
            # Նույն առարկայի դեպքում
            if existing_class["course"] == class_data["course"]:
                is_language_exception = (
                    existing_class["subject"] in LANGUAGE_SUBJECTS and 
                    class_data["subject"] in LANGUAGE_SUBJECTS and
                    existing_class["subject"] == class_data["subject"] and
                    existing_class["type"] == "Գործ" and
                    class_data["type"] == "Գործ" and
                    existing_class["teacher"] != class_data["teacher"]
                )
                
                if not is_language_exception and check_type_conflict(class_data["type"], existing_class["type"]):
                    conflicts.append("course_type")
                    
            # Բոլոր դասախոսությունները բախվում են միմյանց հետ
            elif class_data["type"] == "Դաս" and existing_class["type"] == "Դաս":
                conflicts.append("lecture")
                
            # Նույն առարկա և դասախոս
            elif (class_data["subject"] == existing_class["subject"] and 
                  class_data["teacher"] == existing_class["teacher"] and 
                  class_data["teacher"] not in ["Անորոշ", "Հայտնի չէ"]):
                conflicts.append("subject_teacher")
        
        # Եթե չկան բախումներ
        if not conflicts:
            # Անմիջապես վերադարձնել այս սլոթը
            hour_index = (day - 1) * 4 + (hour - 1)
            return True, day, hour, get_week_type(hour_index)
        else:
            # Պահել սլոթը և բախումները
            potential_slots.append((slot, conflicts, len(schedule[slot])))
    
    # Դասավորել սլոթները՝ ըստ բախումների քանակի (նվազման կարգով)
    # և արդեն նշանակված դասերի քանակի (նվազման կարգով)
    potential_slots.sort(key=lambda x: (len(x[1]), x[2]))
    
    # Առաջնահերթության ցածր արժեք ունեցող դասերը, որոնք կարող են տեղափոխվել
    MAX_CLASSES_TO_MOVE = 2  # Առավելագույնը քանի դաս կփորձենք տեղափոխել
    MAX_BACKTRACKING_DEPTH = 3  # Առավելագույնը որքան խորությամբ կփորձենք վերադասավորել
    
    # Փորձել յուրաքանչյուր պոտենցիալ սլոթ
    for slot, conflicts, slot_class_count in potential_slots[:5]:  # Սահմանափակել փորձարկումները 5-ով
        day, hour = slot
        
        # Գտնել տվյալ սլոթում դասերը, որոնք կարող են տեղափոխվել (ըստ արդյունքի ինդեքսի)
        classes_to_move = []
        for idx in result_by_slot[slot]:
            classes_to_move.append((idx, calculate_class_priority(result[idx])))
        
        # Դասավորել ըստ առաջնահերթության (ցածրից բարձր)
        classes_to_move.sort(key=lambda x: x[1])
        
        # Փորձել տեղափոխել ցածր առաջնահերթություն ունեցող դասերը
        for idx, _ in classes_to_move[:MAX_CLASSES_TO_MOVE]:
            class_to_move = result[idx]
            old_day = class_to_move["assigned_day"]
            old_hour = class_to_move["assigned_hour"]
            
            # Հեռացնել դասը ժամանակավորապես
            temp_class = class_to_move.copy()
            schedule[(old_day, old_hour)].remove(temp_class)
            
            # Հեռացնել ինդեքսը
            result_by_slot[(old_day, old_hour)].remove(idx)
            
            # Ազատել դասախոսի սլոթը
            if temp_class["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                if (old_day, old_hour) in occupied_slots_by_teacher.get(temp_class["teacher"], set()):
                    occupied_slots_by_teacher[temp_class["teacher"]].remove((old_day, old_hour))
            
            # Փորձել գտնել նոր սլոթ հեռացված դասի համար
            success, new_day, new_hour, new_week_type = try_find_slot(
                temp_class,
                schedule,
                teacher_availability,
                occupied_slots_by_teacher,
                conflict_stats
            )
            
            # Փորձել ավելացնել մեր նոր դասը (class_data) այժմ ազատված սլոթում
            class_data_copy = class_data.copy()
            slot_free, _, _, _ = try_find_slot(
                class_data_copy,
                schedule,
                teacher_availability,
                occupied_slots_by_teacher,
                conflict_stats
            )
            
            if slot_free:
                # Եթե հաջողվել է, թարմացնել հեռացված դասը նոր սլոթով
                result[idx]["assigned_day"] = new_day
                result[idx]["assigned_hour"] = new_hour
                result[idx]["week_type"] = new_week_type if "week_type" not in temp_class else temp_class["week_type"]
                
                # Թարմացնել ժամանակացույցը
                schedule[(new_day, new_hour)].append(temp_class)
                result_by_slot[(new_day, new_hour)].append(idx)
                
                # Նշանակել դասախոսի նոր սլոթը
                if temp_class["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                    occupied_slots_by_teacher.setdefault(temp_class["teacher"], set()).add((new_day, new_hour))
                
                logger.info(f"Successfully moved {temp_class['subject']} from ({old_day},{old_hour}) to ({new_day},{new_hour})")
                
                # Վերադարձնել հաջողված բակտրեքինգի արդյունքը
                hour_index = (day - 1) * 4 + (hour - 1)
                return True, day, hour, get_week_type(hour_index)
            else:
                # Վերադարձնել ժամանակացույցը նախկին վիճակին
                schedule[(old_day, old_hour)].append(temp_class)
                result_by_slot[(old_day, old_hour)].append(idx)
                
                # Վերականգնել դասախոսի սլոթը
                if temp_class["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                    occupied_slots_by_teacher.setdefault(temp_class["teacher"], set()).add((old_day, old_hour))
    
    # Եթե բակտրեքինգը չի հաջողվել, վերադարձնել լավագույն սլոթը
    least_conflicted_slot = min(all_slots, key=lambda s: len(schedule[s]))
    day, hour = least_conflicted_slot
    hour_index = (day - 1) * 4 + (hour - 1)
    
    logger.warning(f"Backtracking failed for {class_data['subject']}, using least conflicted slot ({day},{hour})")
    return False, day, hour, get_week_type(hour_index)

def schedule_all_courses(raw_data, teacher_availability):
    """
    Creates schedules for all courses, handling week types correctly
    """
    # Split data by week type
    week1_data, week2_data, both_weeks = split_by_week_type(raw_data)
    
    # Schedule each week separately
    
    # 1. Numerator week (week1_data)
    week1_schedule = improved_schedule_algorithm(week1_data, teacher_availability)
    
    # 2. Denominator week (week2_data)
    week2_schedule = improved_schedule_algorithm(week2_data, teacher_availability)
    
    # 3. Both weeks (both_weeks)
    both_schedule = improved_schedule_algorithm(both_weeks, teacher_availability)
    # Mark these classes as for both weeks
    for cls in both_schedule:
        cls["week_type"] = "երկուսն էլ"
    
    # Combine all schedules
    final_schedule = week1_schedule + week2_schedule + both_schedule
    
    return final_schedule

# ─────────────────────────────────────────────────────────────────────────
# 5) Database operations and conflict detection
# ─────────────────────────────────────────────────────────────────────────

def prepare_schedule_for_db(schedule):
    """
    Prepares the final data for SQL database
    """
    result = []
    
    for entry in schedule:
        # Check if all required fields are present
        if not all(key in entry for key in ["assigned_day", "assigned_hour", "week_type"]):
            logger.warning(f"Missing data for {entry.get('subject')}")
            continue
        
        # Determine mapped_type
        class_type = entry.get("type", "")
        mapped_type = TYPE_CATEGORIES.get(class_type, "")
        
        # If mapped_type is empty, use class_type or default "Դաս"
        if not mapped_type:
            if class_type in ["Դաս", "Գործ", "Լաբ"]:
                mapped_type = class_type
            else:
                # Default to "Դաս" for all other cases
                mapped_type = "Դաս"
            logger.info(f"Default mapped_type={mapped_type} given to {entry.get('subject')}")
        
        # Add class to final list
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
            "preferred_slots": json.dumps([], ensure_ascii=False)  # Empty preferred_slots
        })
    
    logger.info(f"Prepared {len(result)} classes for database")
    return result

def save_schedule_to_db(schedule: list[dict]) -> None:
    if not schedule:
        logger.warning("No records to save")
        return

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Clear old auto-generated schedule
        cur.execute("DELETE FROM created_schedule")
        conn.commit()

        # Check table columns
        cur.execute("SELECT TOP 0 * FROM created_schedule")
        columns = [col[0].lower() for col in cur.description]
        logger.info(f"created_schedule columns: {columns}")

        # Add our rows according to available columns
        for row in schedule:
            # Main required columns
            cur.execute("""
                INSERT INTO created_schedule
                (level, course, subject, type, mapped_type, teachers, rooms, day_of_week, time_of_day, week_type, preferred_slots)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            row["level"],
            row["course"],
            row["subject"],
            row["type"],
            row["mapped_type"],       # added mapped_type column
            row["teachers"],          # JSON string
            row["rooms"],             # JSON string
            row["day_of_week"],
            row["time_of_day"],
            row["week_type"],
            row["preferred_slots"]    # added preferred_slots column
            )

        conn.commit()
        logger.info("✅ created_schedule table updated")
    except Exception as exc:
        conn.rollback()
        logger.error(f"❌ INSERT error: {exc}")
        raise
    finally:
        conn.close()

def find_conflicts(schedule):
    """
    Finds conflicts in the final schedule
    """
    conflicts = []
    
    # Organize classes by slot
    schedule_by_slot = defaultdict(list)
    
    for i, entry in enumerate(schedule):
        # Check if all required fields are present
        if all(key in entry for key in ["assigned_day", "assigned_hour", "week_type"]):
            key = (entry["assigned_day"], entry["assigned_hour"], entry["week_type"])
            schedule_by_slot[key].append((i, entry))
    
    # Check for conflicts
    for slot, entries in schedule_by_slot.items():
        day, hour, week = slot
        
        for i in range(len(entries)):
            for j in range(i+1, len(entries)):
                idx1, entry1 = entries[i]
                idx2, entry2 = entries[j]
                
                # Check possible conflicts
                conflict_reason = None
                
                # 1. Same teacher, same time
                if entry1["teacher"] == entry2["teacher"] and entry1["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                    conflict_reason = "Teacher conflict"
                
                # 2. Same room, same time (now less important as requested)
                # Only log but don't count as critical conflict
                if entry1["room"] == entry2["room"] and entry1["room"] not in ["Անորոշ", "Հայտնի չէ"]:
                    logger.info(f"Room conflict (non-critical): {entry1['room']} for {entry1['subject']} and {entry2['subject']}")
                
                # 3. Same course, same time, but different classes
                if entry1["course"] == entry2["course"]:
                    # Check for language subject exception
                    is_language_exception = (
                        entry1["subject"] in LANGUAGE_SUBJECTS and 
                        entry2["subject"] in LANGUAGE_SUBJECTS and
                        entry1["subject"] == entry2["subject"] and
                        entry1["type"] == "Գործ" and  # Only for "Գործ" type
                        entry2["type"] == "Գործ" and
                        entry1["teacher"] != entry2["teacher"]  # Different teachers
                    )
                    
                    # If not a language group class, check for conflict
                    if not is_language_exception:
                        type1 = entry1["type"]
                        type2 = entry2["type"]
                        if type1 in CONFLICTS and type2 in CONFLICTS[type1]:
                            conflict_reason = f"Group conflict: {type1} cannot be combined with {type2}"
                
                # If there's a conflict, add it
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

def main():
    """
    Main function that sequentially performs schedule creation
    """
    try:
        # 1. Load teacher availability and class data
        logger.info("Loading data...")
        teacher_avail = load_teacher_availability()
        raw_data = load_schedule_data()
        logger.info(f"Loaded {len(raw_data)} classes")
        
        # Count classes by type for better understanding
        types_count = {}
        for cls in raw_data:
            cls_type = cls.get("type", "Unknown")
            types_count[cls_type] = types_count.get(cls_type, 0) + 1
        
        logger.info(f"Class types distribution: {types_count}")
        
        # 2. Create schedule for all courses (new approach)
        logger.info("Creating schedule...")
        final_schedule = schedule_all_courses(raw_data, teacher_avail)
        logger.info(f"Created overall schedule with {len(final_schedule)} classes")
        
        # Analyze schedule distribution
        slots_used = set((cls["assigned_day"], cls["assigned_hour"]) for cls in final_schedule)
        logger.info(f"Schedule uses {len(slots_used)}/20 time slots")
        
        # Count classes per day
        classes_by_day = {}
        for cls in final_schedule:
            day = cls["assigned_day"]
            classes_by_day[day] = classes_by_day.get(day, 0) + 1
        
        for day in range(1, 6):
            logger.info(f"Day {day}: {classes_by_day.get(day, 0)} classes")
        
        # 3. Prepare and save results
        logger.info("Preparing data for database...")
        db_schedule = prepare_schedule_for_db(final_schedule)
        
        # Save raw schedule for debugging if needed
        Path("schedule_output.json").write_text(
            json.dumps(final_schedule, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        logger.info("Raw schedule saved to schedule_output.json")
        
        logger.info("Saving data to database...")
        save_schedule_to_db(db_schedule)
        logger.info(f"Saved {len(db_schedule)} classes to database")
        
        # 4. Check for conflicts
        logger.info("Checking for conflicts...")
        clashes = find_conflicts(final_schedule)
        
        if clashes:
            Path("conflicts.json").write_text(
                json.dumps(clashes, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            
            # Count different types of conflicts
            conflict_types = {}
            for clash in clashes:
                issue = clash.get("issue", "Unknown")
                conflict_types[issue] = conflict_types.get(issue, 0) + 1
            
            logger.warning(f"❗️ Found {len(clashes)} conflicts, see ./conflicts.json")
            logger.warning(f"Conflict types: {conflict_types}")
        else:
            logger.info("✅ No conflicts detected")
        
        logger.info("Schedule successfully created")
        return True
    
    except Exception as e:
        logger.error(f"❌ ERROR: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    main()