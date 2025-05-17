import json
import logging
import random
from collections import defaultdict
from pathlib import Path
import pyodbc
import time

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
    "ArchiCAD",
    # You can add other language subjects here
}

# Definition of room types
ROOM_TYPES = {}

# # Add "Դաս" type rooms
# for building, rooms in {
#     "121": ["12103"],
#     "12": ["1212"],
#     "122": ["12208"],
#     "123": ["12305"],
#     "14": ["1401", "1403"],
#     "174": ["17413"],
#     "22": ["2241"],
#     "23": ["2342", "2344", "2359", "2361"],
#     "24": ["2431", "2435", "2444"],
#     "50": ["5014"],
#     "52": ["5202", "5205", "5207"],
#     "54": ["5402", "5404"],
#     "56": ["5601", "5602", "5604", "5606", "5608", "5609"],
#     "58": ["5802"],
#     "91": ["9104", "9110"],
#     "92": ["9205", "9206", "9208"],
#     "94": ["9402", "9410"],
#     "96": ["9602", "9607", "9611"],
#     "97": ["9712"],
#     "special": ["Անորոշ", "ՕԼ"]
# }.items():
#     for room in rooms:
#         ROOM_TYPES[room] = "Դաս"

# # Add "Գործ" type rooms
# for building, rooms in {
#     "11": ["1104"],
#     "12": ["1201"],
#     "121": ["12102", "12103", "12105", "12106"],
#     "122": ["12201"],
#     "123": ["12305"],
#     "14": ["1406", "1407"],
#     "174": ["17413"],
#     "21": ["2127ա", "2127բ", "2141ա"],
#     "22": ["2259", "2261", "2261բ"],
#     "23": ["2338", "2344", "2346", "2353", "2353ա", "2359", "2361"],
#     "24": ["2430", "2434", "2436", "2438", "2440", "2441ա", "2443", "2443ա"],
#     "33": ["3305"],
#     "510": ["51006", "51009"],
#     "51": ["5117", "5118", "5120", "5121", "5122"],
#     "52": ["5202", "5212"],
#     "54": ["5402", "5404"],
#     "56": ["5601", "5602", "5604", "5606", "5608", "5609"],
#     "57": ["5706"],
#     "59": ["5901", "5902"],
#     "91": ["9101", "9104", "9107", "9110", "9112"],
#     "92": ["9204", "9205", "9206", "9207", "9210"],
#     "93": ["9301", "9302", "9303", "9309", "9310", "9315"],
#     "94": ["9402", "9404", "9405", "9406", "9409", "9410", "9411", "9412"],
#     "95": ["9502"],
#     "96": ["9601", "9602", "9603", "9604", "9607", "9608", "9610", "9611"],
#     "97": ["9703", "9705", "9706", "9708", "9711", "9717"],
#     "99": ["9903", "9904", "9905ա", "9906", "9907ա", "9907բ", "9908", "9909ա", "9909բ", "9910", "9911", "9913"],
#     "special": ["Անորոշ", "Ֆիզկուլտուրա"]
# }.items():
#     for room in rooms:
#         ROOM_TYPES[room] = "Գործ"

# # Add "Լաբ" type rooms
# for building, rooms in {
#     "103": ["10306"],
#     "122": ["12206"],
#     "13": ["1313", "1316"],
#     "22": ["2235"],
#     "510": ["51001", "51002", "51006"],
#     "51": ["5103", "5117", "5118", "5119", "5120", "5121", "5122"],
#     "52": ["5212", "5218"],
#     "57": ["5706", "5710"],
#     "59": ["5901", "5902"],
#     "71": ["7101", "7102"],
#     "92": ["9201", "9204"],
#     "94": ["9404"]
# }.items():
#     for room in rooms:
#         ROOM_TYPES[room] = "Լաբ"

# ─────────────────────────────────────────────────────────────────────────
# 2) Helper functions
# ─────────────────────────────────────────────────────────────────────────

import concurrent.futures
import threading
from copy import deepcopy

# Ընդհանուր սինխրոնիզացիայի համար
schedule_lock = threading.Lock()
course_loads_lock = threading.Lock()

def schedule_single_course(course, course_classes, teacher_availability, shared_schedule):
    """Մշակում է մեկ կուրսի դասերը առանձին թրեդում"""
    
    # Ստեղծում ենք տեղական պատճեններ
    local_schedule = deepcopy(shared_schedule)
    local_occupied_slots_by_teacher = {}
    local_course_loads = initialize_course_load_balancer()
    
    local_result = []
    local_result_by_slot = {(day, hour): [] for day in range(1, 6) for hour in range(1, 5)}
    
    # Հաշվարկել վիճակագրության ժամանակավոր օբյեկտ
    local_conflict_stats = {
        "teacher_conflict": 0,
        "availability_conflict": 0,
        "same_course_type_conflict": 0,
        "lecture_conflict": 0,
        "subject_teacher_conflict": 0,
        "all_slots_failed": 0,
        "most_conflicted_slots": [],
        "backtracking_attempts": 0,
        "successful_backtracking": 0,
        "week_switches": initialize_week_switch_stats()
    }
    
    # Դասավորել դասերը ըստ առաջնահերթության
    sorted_classes = sorted(course_classes, key=lambda x: x[1], reverse=True)
    
    for class_data, priority in sorted_classes:
        # Փորձել տեղավորել դասը
        slot_found, day, hour, assigned_week_type = try_find_slot_enhanced(
            class_data, 
            local_schedule, 
            teacher_availability,
            local_occupied_slots_by_teacher,
            local_course_loads,
            local_conflict_stats
        )
        
        # Եթե սլոթ չի գտնվել, փորձել backtracking
        if not slot_found:
            local_conflict_stats["backtracking_attempts"] += 1
            
            slot_found, day, hour, assigned_week_type = try_backtracking_enhanced(
                class_data,
                local_schedule,
                local_result,
                local_result_by_slot,
                teacher_availability,
                local_occupied_slots_by_teacher,
                local_course_loads,
                local_conflict_stats
            )
        
        # Թարմացնել լոկալ ժամանակացույցը
        local_schedule[(day, hour)].append(class_data)
        
        # Դասախոսի սլոթը նշել որպես զբաղված
        teacher = class_data["teacher"]
        if teacher not in ["Անորոշ", "Հայտնի չէ"]:
            local_occupied_slots_by_teacher.setdefault(teacher, set()).add((day, hour))
        
        # Պատրաստել արդյունքի գրառումը
        result_entry = class_data.copy()
        result_entry.update({
            "assigned_day": day,
            "assigned_hour": hour,
            "week_type": assigned_week_type
        })
        
        # Թարմացնել կուրսի ծանրաբեռնվածությունը
        if assigned_week_type in ["համարիչ", "հայտարար", "երկուսն էլ"]:
            local_course_loads[course][assigned_week_type] += 1
            
            # Եթե "երկուսն էլ" տիպի դաս է, հաշվել երկու շաբաթների համար
            if assigned_week_type == "երկուսն էլ":
                local_course_loads[course]["համարիչ"] += 1
                local_course_loads[course]["հայտարար"] += 1
        
        # Պահպանել արդյունքը և ինդեքսը
        result_index = len(local_result)
        local_result.append(result_entry)
        local_result_by_slot[(day, hour)].append(result_index)
    
    # Վերադարձնել արդյունքը որպես թրեդ-անվտանգ պատասխան
    return {
        "course": course,
        "result": local_result,
        "course_loads": local_course_loads[course],
        "conflict_stats": local_conflict_stats
    }

def improved_schedule_algorithm_parallel(all_classes, teacher_availability, max_workers=None):
    """
    Բարելավված զուգահեռ ալգորիթմ, որը մշակում է յուրաքանչյուր կուրսը առանձին թրեդում
    """
    # Ստեղծում ենք դատարկ ժամանակացույց
    schedule = create_empty_schedule()
    
    # Խմբավորել դասերը ըստ կուրսի
    classes_with_priority = [(cls, calculate_class_priority(cls)) for cls in all_classes]
    
    # Մշակել պատահականությունը նման առաջնահերթությամբ դասերի միջև
    for i in range(len(classes_with_priority) - 1):
        if i < len(classes_with_priority) - 1:
            if abs(classes_with_priority[i][1] - classes_with_priority[i+1][1]) <= 1 and random.random() < 0.4:
                classes_with_priority[i], classes_with_priority[i+1] = classes_with_priority[i+1], classes_with_priority[i]
    
    courses = {}
    for class_data, priority in classes_with_priority:
        course = class_data["course"]
        if course not in courses:
            courses[course] = []
        courses[course].append((class_data, priority))
    
    # Պատահականացնել կուրսերի հերթականությունը
    course_keys = list(courses.keys())
    random.shuffle(course_keys)
    
    # Որոշել աշխատողների առավելագույն քանակը
    import os
    if max_workers is None:
        max_workers = min(os.cpu_count() or 4, len(course_keys), 8)  # Սահմանափակում 8-ով
    
    # Ընդհանուր արդյունքներ
    result = []
    course_loads = initialize_course_load_balancer()
    conflict_stats = {
        "teacher_conflict": 0,
        "availability_conflict": 0,
        "same_course_type_conflict": 0,
        "lecture_conflict": 0,
        "subject_teacher_conflict": 0,
        "all_slots_failed": 0,
        "most_conflicted_slots": [],
        "backtracking_attempts": 0,
        "successful_backtracking": 0,
        "week_switches": initialize_week_switch_stats()
    }
    
    # Զուգահեռ մշակել կուրսերը
    logger.info(f"Processing {len(course_keys)} courses using {max_workers} parallel workers")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Մշակել յուրաքանչյուր կուրսը առանձին թրեդում
        future_to_course = {}
        for course in course_keys:
            future = executor.submit(
                schedule_single_course,
                course,
                courses[course],
                teacher_availability,
                schedule  # Փոխանցում ենք դատարկ schedule, քանի որ յուրաքանչյուր թրեդ կստեղծի իր պատճենը
            )
            future_to_course[future] = course
        
        # Հավաքել բոլոր թրեդերի արդյունքները
        for future in concurrent.futures.as_completed(future_to_course):
            course = future_to_course[future]
            try:
                course_result = future.result()
                
                # Ավելացնել կուրսի արդյունքը ընդհանուր արդյունքին
                with schedule_lock:
                    result.extend(course_result["result"])
                
                # Թարմացնել կուրսի ծանրաբեռնվածությունը
                with course_loads_lock:
                    course_loads[course] = course_result["course_loads"]
                
                # Գումարել կոնֆլիկտների վիճակագրությունը
                for key in conflict_stats:
                    if key == "week_switches":
                        for switch_key in conflict_stats["week_switches"]:
                            conflict_stats["week_switches"][switch_key] += course_result["conflict_stats"]["week_switches"][switch_key]
                    elif key == "most_conflicted_slots":
                        conflict_stats[key].extend(course_result["conflict_stats"][key])
                    else:
                        conflict_stats[key] += course_result["conflict_stats"][key]
                
                logger.info(f"Finished scheduling course {course} with {len(course_result['result'])} classes")
            
            except Exception as e:
                logger.error(f"Error scheduling course {course}: {e}")
    
    # Ստուգել և լուծել հնարավոր լսարանների կոնֆլիկտները
    room_conflicts = find_room_conflicts(result)
    if room_conflicts:
        logger.info(f"Found {len(room_conflicts)} room conflicts, attempting to resolve...")
        resolve_room_conflicts(room_conflicts, result, schedule)
    
    return result, course_loads

def try_backtracking_enhanced_parallel(class_data, schedule, result, result_by_slot, 
                                      teacher_availability, occupied_slots_by_teacher, 
                                      course_loads, conflict_stats):
    """
    Փորձում է վերադասավորել դասերը և/կամ տեղափոխել մեկ շաբաթից մյուսը զուգահեռ,
    հաշվի առնելով նաև կուրսի ծանրաբեռնվածությունը
    """
    # Ստուգում ենք, թե որքան հաճախ է դասը
    weekly_frequency = class_data.get("weekly_frequency", 2)
    course = class_data["course"]
    original_week_type = class_data.get("week_type", "համարիչ")
    
    # Սահմանում ենք արդյունք հաշվիչ
    result_found = threading.Event()
    best_result = [None]  # Թրեդերի միջև արդյունքներ փոխանցելու համար
    
    def process_variant(variant_data, variant_week_type):
        """Փորձում է մեկ տարբերակ և սահմանում արդյունքը եթե հաջողվել է"""
        slot_found, day, hour, _ = try_backtracking(
            variant_data, schedule, result, result_by_slot,
            teacher_availability, occupied_slots_by_teacher, conflict_stats
        )
        
        if slot_found and not result_found.is_set():
            # Գրանցում ենք հաջողված արդյունքը և սահմանում դրոշակը
            best_result[0] = (slot_found, day, hour, variant_week_type)
            result_found.set()  # Սա ազդարարում է մյուս թրեդերին ավարտել
    
    # Ստեղծում ենք շաբաթների տարբերակների թրեդեր
    threads = []
    
    # Օրիգինալ տարբերակի համար
    original_thread = threading.Thread(
        target=process_variant,
        args=(class_data.copy(), original_week_type)
    )
    threads.append(original_thread)
    
    # Հակառակ շաբաթի տարբերակի համար
    if weekly_frequency == 2 and original_week_type != "երկուսն էլ":
        opposite_week_type = get_opposite_week_type(original_week_type)
        if will_balance_be_maintained(course, course_loads, original_week_type, opposite_week_type):
            temp_class_data = class_data.copy()
            temp_class_data["week_type"] = opposite_week_type
            
            opposite_thread = threading.Thread(
                target=process_variant,
                args=(temp_class_data, opposite_week_type)
            )
            threads.append(opposite_thread)
    
    # Գործարկում ենք թրեդերը
    for thread in threads:
        thread.start()
    
    # Սահմանում ենք timeout բոլոր թրեդերի համար
    timeout = 2.0  # 2 վայրկյան
    
    # Սպասում ենք մինչև որևէ թրեդ գտնի արդյունք կամ timeout լինի
    result_found.wait(timeout)
    
    # Սպասում ենք թրեդերի ավարտին
    for thread in threads:
        thread.join(0.5)  # Տալիս ենք 0.5 վայրկյան ավարտի համար
    
    # Ստուգում ենք արդյունքը
    if best_result[0]:
        slot_found, day, hour, week_type = best_result[0]
        
        # Թարմացնում ենք վիճակագրությունը
        if week_type != original_week_type:
            # Նշանակում է, որ հակառակ շաբաթի տարբերակն է հաջողվել
            if original_week_type == "համարիչ":
                conflict_stats["week_switches"]["համարիչ_to_հայտարար"] += 1
            else:
                conflict_stats["week_switches"]["հայտարար_to_համարիչ"] += 1
            conflict_stats["week_switches"]["successful_switches"] += 1
        
        return slot_found, day, hour, week_type
    
    # Եթե ոչ մի թրեդ չի գտել հարմար տարբերակ
    return False, None, None, original_week_type

def generate_multiple_schedules(raw_data, teacher_availability, attempts=4):
    """
    Զուգահեռ գեներացնում է մի քանի տարբերակ և ընտրում լավագույնը
    
    Args:
        raw_data: Դասերի տվյալները
        teacher_availability: Դասախոսների հասանելիության տվյալները
        attempts: Քանի տարբեր ժամանակացույցներ փորձել
        
    Returns:
        Լավագույն ժամանակացույցը և դրա ծանրաբեռնվածությունը
    """
    logger.info(f"Generating {attempts} parallel schedule variants")
    
    with concurrent.futures.ProcessPoolExecutor(max_workers=attempts) as executor:
        # Ուղարկում է մի քանի փորձ զուգահեռ
        futures = []
        for i in range(attempts):
            seed = int(time.time()) + i  # Տարբեր սերմեր
            futures.append(executor.submit(
                generate_single_schedule, 
                raw_data.copy(), 
                teacher_availability,
                seed
            ))
        
        # Հավաքել արդյունքները
        all_results = []
        for future in concurrent.futures.as_completed(futures):
            try:
                schedule, course_loads, quality_score = future.result()
                all_results.append((schedule, course_loads, quality_score))
                logger.info(f"Completed schedule variant with quality score: {quality_score:.2f}")
            except Exception as e:
                logger.error(f"Error generating schedule variant: {e}")
    
    # Ընտրել լավագույն տարբերակը
    if all_results:
        best_schedule, best_course_loads, best_score = max(all_results, key=lambda x: x[2])
        logger.info(f"Selected best schedule with quality score: {best_score:.2f}")
        return best_schedule, best_course_loads
    else:
        logger.error("Failed to generate any valid schedules")
        return None, None

def generate_single_schedule(data, teacher_avail, seed):
    """
    Գեներացնում է մեկ ժամանակացույց և հաշվարկում որակի միավորը
    
    Args:
        data: Դասերի տվյալները
        teacher_avail: Դասախոսների հասանելիության տվյալները
        seed: Պատահականության սերմը
        
    Returns:
        Եռյակ (ժամանակացույց, ծանրաբեռնվածություն, որակի միավոր)
    """
    random.seed(seed)
    schedule, course_loads = improved_schedule_algorithm(data, teacher_avail)
    
    # Հաշվարկում է որակի միավորը
    quality_score = calculate_schedule_quality(schedule, course_loads)
    return schedule, course_loads, quality_score

def calculate_schedule_quality(schedule, course_loads):
    """
    Հաշվարկում է ժամանակացույցի որակը ըստ տարբեր չափանիշների
    """
    quality_score = 100  # Սկսում ենք հարյուրից և պակասեցնում
    
    # 1. Ստուգում ենք կուրսերի դասաժամերի հավասարաշռությունը
    imbalance_penalty = 0
    for course, loads in course_loads.items():
        num_week1 = loads["համարիչ"]
        num_week2 = loads["հայտարար"]
        diff = abs(num_week1 - num_week2)
        
        # Պակասեցնում ենք 5 միավոր յուրաքանչյուր 3-ից ավել տարբերության համար
        if diff > 3:
            imbalance_penalty += min(20, (diff - 3) * 5)  # Առավելագույնը 20 միավոր
    
    quality_score -= imbalance_penalty / len(course_loads) if course_loads else 0
    
    # 2. Հաշվում ենք օրերի և ժամերի բաշխումը
    slot_usage = {}
    for entry in schedule:
        day = entry.get("assigned_day")
        hour = entry.get("assigned_hour")
        
        if day and hour:
            slot = (day, hour)
            slot_usage[slot] = slot_usage.get(slot, 0) + 1
    
    # Ստուգում ենք ժամերի տարածումը
    distribution_penalty = 0
    if slot_usage:
        max_classes = max(slot_usage.values())
        
        # Պակասեցնում ենք 2 միավոր յուրաքանչյուր 5-ից ավել դասի համար մեկ սլոթում
        if max_classes > 5:
            distribution_penalty = min(30, (max_classes - 5) * 2)
    
    quality_score -= distribution_penalty
    
    # 3. Ստուգում ենք դասախոսների նախապատվությունները
    teacher_preference_bonus = 0
    teacher_assignments = {}
    
    for entry in schedule:
        teacher = entry.get("teacher")
        day = entry.get("assigned_day")
        hour = entry.get("assigned_hour")
        
        if teacher and teacher not in ["Անորոշ", "Հայտնի չէ"] and day and hour:
            teacher_assignments.setdefault(teacher, []).append((day, hour))
    
    # Հաշվում ենք, թե ընդհանուր քանի տոկոսն է նախընտրելի սլոթներում
    # TODO: Այս մասը պետք է հարմարեցնել ձեր teacher_availability-ի կառուցվածքին
    
    quality_score += teacher_preference_bonus
    
    return max(0, quality_score)  # Բացասական միավորներից խուսափելու համար

def find_conflicts_parallel(schedule):
    """
    Զուգահեռ գտնում է բախումները ժամանակացույցում
    """
    if not schedule:
        return []
    
    # Բաժանում է ժամանակացույցը խմբերի՝ ըստ օրերի
    schedule_by_day = {}
    for i in range(1, 6):  # 5 օր
        schedule_by_day[i] = [entry for entry in schedule if entry.get("assigned_day") == i]
    
    all_conflicts = []
    
    def find_day_conflicts(day_schedule, day):
        """Գտնում է բախումները մեկ օրվա ժամանակացույցում"""
        day_conflicts = []
        
        # Կազմակերպել դասերը ըստ սլոթի
        schedule_by_slot = defaultdict(list)
        
        for i, entry in enumerate(day_schedule):
            if "assigned_hour" in entry and "week_type" in entry:
                key = (entry["assigned_hour"], entry["week_type"])
                schedule_by_slot[key].append((i, entry))
        
        # Ստուգել բախումները
        for slot, entries in schedule_by_slot.items():
            hour, week = slot
            
            for i in range(len(entries)):
                for j in range(i+1, len(entries)):
                    idx1, entry1 = entries[i]
                    idx2, entry2 = entries[j]
                    
                    # Ստուգել հնարավոր բախումները
                    conflict_reason = None
                    
                    # 1. Նույն դասախոս, նույն ժամ
                    if entry1["teacher"] == entry2["teacher"] and entry1["teacher"] not in ["Անորոշ", "Հայտնի չէ"]:
                        conflict_reason = "Teacher conflict"
                    
                    # 2. Նույն կուրս, նույն ժամ, բայց տարբեր դասեր
                    if entry1["course"] == entry2["course"]:
                        # Ստուգել լեզվի առարկայի բացառությունը
                        is_language_exception = (
                            entry1["subject"] in LANGUAGE_SUBJECTS and 
                            entry2["subject"] in LANGUAGE_SUBJECTS and
                            entry1["subject"] == entry2["subject"] and
                            entry1["type"] == "Գործ" and  
                            entry2["type"] == "Գործ" and
                            entry1["teacher"] != entry2["teacher"]
                        )
                        
                        # Եթե չի լեզվի խմբի դաս, ստուգել բախումը
                        if not is_language_exception:
                            type1 = entry1["type"]
                            type2 = entry2["type"]
                            if type1 in CONFLICTS and type2 in CONFLICTS[type1]:
                                conflict_reason = f"Group conflict: {type1} cannot be combined with {type2}"
                    
                    # Եթե կա բախում, ավելացնել այն
                    if conflict_reason:
                        day_conflicts.append({
                            "course1": entry1["course"],
                            "subject1": entry1["subject"],
                            "course2": entry2["course"],
                            "subject2": entry2["subject"],
                            "issue": conflict_reason,
                            "day": day,
                            "hour": hour,
                            "week": week
                        })
        
        return day_conflicts
    
    # Զուգահեռ մշակում է ամեն օրվա բախումները
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_day = {executor.submit(find_day_conflicts, day_schedule, day): day 
                        for day, day_schedule in schedule_by_day.items()}
        
        for future in concurrent.futures.as_completed(future_to_day):
            day = future_to_day[future]
            try:
                day_conflicts = future.result()
                all_conflicts.extend(day_conflicts)
            except Exception as e:
                logger.error(f"Սխալ {day} օրվա բախումների ստուգման ժամանակ: {e}")
    
    return all_conflicts

def load_data_parallel():
    """
    Զուգահեռ բեռնում է տվյալները տարբեր աղբյուրներից
    
    Returns:
        Եռյակ (դասախոսների հասանելիություն, դասերի տվյալներ, լսարանների տիպեր)
    """
    logger.info("Բեռնում է տվյալները զուգահեռաբար...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        # Ուղարկում է տարբեր բեռնման հարցումները զուգահեռ
        future_teacher_avail = executor.submit(load_teacher_availability)
        future_raw_data = executor.submit(load_schedule_data)
        future_room_types = executor.submit(load_room_types)
        
        # Սպասում և ստանում է արդյունքները
        try:
            teacher_avail = future_teacher_avail.result(timeout=10)
            logger.info("Դասախոսների հասանելիությունը բեռնված է")
        except concurrent.futures.TimeoutError:
            logger.error("Ժամանակի սպառում դասախոսների հասանելիության բեռնման ժամանակ")
            teacher_avail = {}
        except Exception as e:
            logger.error(f"Սխալ դասախոսների հասանելիության բեռնման ժամանակ: {e}")
            teacher_avail = {}
        
        try:
            raw_data = future_raw_data.result(timeout=10)
            logger.info(f"Բեռնված է {len(raw_data)} դասերի տվյալները")
        except concurrent.futures.TimeoutError:
            logger.error("Ժամանակի սպառում դասերի տվյալների բեռնման ժամանակ")
            raw_data = []
        except Exception as e:
            logger.error(f"Սխալ դասերի տվյալների բեռնման ժամանակ: {e}")
            raw_data = []
        
        try:
            room_types = future_room_types.result(timeout=10)
            logger.info(f"Բեռնված է {len(room_types)} լսարանների տիպեր")
        except concurrent.futures.TimeoutError:
            logger.error("Ժամանակի սպառում լսարանների տիպերի բեռնման ժամանակ")
            room_types = {}
        except Exception as e:
            logger.error(f"Սխալ լսարանների տիպերի բեռնման ժամանակ: {e}")
            room_types = {}
    
    return teacher_avail, raw_data, room_types





def get_opposite_week_type(week_type):
    """
    Վերադարձնում է հակառակ շաբաթի տիպը։
    "համարիչ" -> "հայտարար"
    "հայտարար" -> "համարիչ"
    "երկուսն էլ" մնում է "երկուսն էլ"
    """
    if week_type == "համարիչ":
        return "հայտարար"
    elif week_type == "հայտարար":
        return "համարիչ"
    else:
        return "երկուսն էլ"  # "երկուսն էլ" չի փոխվում

def initialize_course_load_balancer():
    """
    Ինիցիալիզացնում է կուրսերի ծանրաբեռնվածության հաշվիչը
    Վերադարձնում է բառարան, որտեղ բանալիները կուրսերն են, իսկ արժեքները՝
    համարիչ և հայտարար շաբաթների դասաժամերի քանակը
    """
    return defaultdict(lambda: {"համարիչ": 0, "հայտարար": 0, "երկուսն էլ": 0})

def will_balance_be_maintained(course, current_course_loads, from_week, to_week, max_diff=3):
    """
    Ստուգում է, թե արդյոք շաբաթի տիպի փոփոխությունը կպահպանի հավասարակշռությունը
    
    Args:
        course: Կուրսի կոդը
        current_course_loads: Ընթացիկ ծանրաբեռնվածության բառարան
        from_week: Սկզբնական շաբաթի տիպը ("համարիչ" կամ "հայտարար")
        to_week: Նոր շաբաթի տիպը ("համարիչ" կամ "հայտարար")
        max_diff: Առավելագույն թույլատրելի տարբերությունը դասաժամերի քանակի միջև
        
    Returns:
        Boolean: True, եթե հավասարակշռությունը կպահպանվի, False՝ հակառակ դեպքում
    """
    # Եթե կուրսը դեռ չունի գրանցված դասեր
    if course not in current_course_loads:
        return True
    
    # Ստանում ենք ընթացիկ հաշվիչները
    loads = current_course_loads[course]
    num_week1 = loads["համարիչ"]
    num_week2 = loads["հայտարար"]
    
    # Հաշվում ենք, թե ինչպես կփոխվեն արժեքները
    new_week1 = num_week1
    new_week2 = num_week2
    
    if from_week == "համարիչ" and to_week == "հայտարար":
        new_week1 -= 1
        new_week2 += 1
    elif from_week == "հայտարար" and to_week == "համարիչ":
        new_week1 += 1
        new_week2 -= 1
    
    # Ստուգում ենք, թե արդյոք նոր տարբերությունը ընդունելի է
    return abs(new_week1 - new_week2) <= max_diff

def initialize_week_switch_stats():
    """Ինիցիալիզացնում է շաբաթի փոփոխման վիճակագրությունը"""
    return {
        "համարիչ_to_հայտարար": 0,
        "հայտարար_to_համարիչ": 0,
        "total_attempts": 0,
        "successful_switches": 0
    }

def export_course_load_balance(course_loads, filename="course_load_balance.json"):
    """
    Արտահանում է կուրսերի ծանրաբեռնվածության տվյալները JSON ֆորմատով
    """
    balance_data = {}
    
    for course, loads in course_loads.items():
        num_week1 = loads["համարիչ"]
        num_week2 = loads["հայտարար"]
        diff = abs(num_week1 - num_week2)
        
        # Պահպանում ենք հիմնական տվյալները
        balance_data[course] = {
            "համարիչ": num_week1,
            "հայտարար": num_week2,
            "տարբերություն": diff,
            "հավասարակշռված": diff <= 3
        }
    
    # Ընդհանուր վիճակագրություն
    total_imbalanced = sum(1 for data in balance_data.values() if not data["հավասարակշռված"])
    balance_data["_summary"] = {
        "total_courses": len(balance_data),
        "balanced_courses": len(balance_data) - total_imbalanced,
        "imbalanced_courses": total_imbalanced
    }
    
    # Արտահանում որպես JSON
    Path(filename).write_text(
        json.dumps(balance_data, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    logger.info(f"Course load balance exported to {filename}")







# Randomize the day order for more variety in schedules
def get_randomized_days():
    """
    Returns a randomized list of day indices (1-5)
    """
    days = list(range(1, 6))
    random.shuffle(days)
    logger.info(f"Randomized day order: {days}")
    return days

# Randomize hour order for even more variety in schedules
def get_randomized_hours():
    """
    Returns a randomized list of hour indices (1-4)
    """
    hours = list(range(1, 5))
    random.shuffle(hours)
    logger.info(f"Randomized hour order: {hours}")
    return hours

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

def load_room_types():
    """
    Բեռնում է լսարանների տիպերը տվյալների բազայից
    Վերադարձնում է բառարան, որտեղ բանալիները լսարանների համարներն են, 
    իսկ արժեքները՝ տիպերը
    """
    logger.info("Բեռնում է լսարանների տիպերը բազայից...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Հարցում է կատարում բազայի մեջ լսարանների մասին
        cursor.execute("""
            SELECT number, type_room
            FROM Rooms
            WHERE type_room IS NOT NULL
        """)
        
        # Ստեղծում է բառարան լսարանների տիպերի համար
        room_types = {}
        for room_number, room_type in cursor.fetchall():
            # Ստանդարտացնում է լսարանների տիպերը
            if room_type in ["Դաս", "Գործ", "Լաբ"]:
                room_types[room_number] = room_type
            else:
                # Լռելյան արժեք, եթե տիպը ստանդարտ չէ
                logger.warning(f"Լսարան {room_number}-ը ունի ոչ ստանդարտ տիպ: {room_type}, սահմանվում է որպես 'Դաս'")
                room_types[room_number] = "Դաս"
        
        logger.info(f"Բեռնված է {len(room_types)} լսարանների տիպեր բազայից")
        return room_types
    
    except Exception as e:
        logger.error(f"Սխալ լսարանների տիպերը բեռնելիս: {e}")
        # Ձախողման դեպքում վերադարձնում է դատարկ բառարան
        return {}
    
    finally:
        conn.close()

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
    
    # Randomly shuffle data before splitting to increase variability
    shuffled_data = data.copy()
    random.shuffle(shuffled_data)
    
    for row in shuffled_data:
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

def find_alternative_room(current_room, day, hour, week_type, schedule):
    """
    Գտնում է այլընտրանքային լսարան նույն մասնաշենքում նույն տիպի
    
    Args:
        current_room: Ընթացիկ լսարանի համարը (օր.՝ "9104")
        day: Շաբաթվա օրը (1-5)
        hour: Օրվա ժամը (1-4)
        week_type: Շաբաթվա տիպը ("համարիչ", "հայտարար", "երկուսն էլ")
        schedule: Ընթացիկ ժամանակացույցի վիճակը
        
    Returns:
        Այլընտրանքային լսարանի համարը կամ None, եթե այլընտրանք չի գտնվել
    """
    if current_room in ["Անորոշ", "Հայտնի չէ", "ՕԼ", "Ֆիզկուլտուրա"]:
        return current_room  # Հատուկ լսարանների համար փոփոխության կարիք չկա
    
    # Ստանում է շենքի նախածանցը (առաջին 2 թվերը)
    building_prefix = ""
    for i in range(min(2, len(current_room))):
        if current_room[i].isdigit():
            building_prefix += current_room[i]
        else:
            break
    
    if not building_prefix:
        logger.warning(f"Չի կարող որոշել շենքի նախածանցը {current_room} լսարանի համար")
        return None
    
    # Ստանում է պահանջվող լսարանի տիպը
    required_type = ROOM_TYPES.get(current_room)
    if not required_type:
        logger.warning(f"Լսարան {current_room}-ը չունի սահմանված տիպ")
        return None
    
    logger.info(f"Փնտրում է լսարան {building_prefix} շենքում {required_type} տիպի")
    
    # Գտնում է բոլոր լսարանները նույն շենքում նույն տիպի
    candidate_rooms = []
    for room, room_type in ROOM_TYPES.items():
        # Ստուգում է, արդյոք լսարանը նույն շենքում է
        room_prefix = ""
        for i in range(min(2, len(room))):
            if room[i].isdigit():
                room_prefix += room[i]
            else:
                break
        
        if room_prefix == building_prefix and room_type == required_type:
            candidate_rooms.append(room)
    
    logger.info(f"Գտնվել է {len(candidate_rooms)} թեկնածու լսարաններ նույն շենքում նույն տիպի")
    
    # Ստուգում է, որ լսարանները հասանելի են նշված ժամանակում
    available_rooms = []
    for room in candidate_rooms:
        is_available = True
        
        # Ստուգում է, արդյոք լսարանն արդեն օգտագործված է այս ժամանակահատվածում
        for entry in schedule.get((day, hour), []):
            entry_room = entry.get("room", "")
            entry_week = entry.get("week_type", "համարիչ")
            
            # Ստուգում է, արդյոք շաբաթները համընկնում են
            weeks_overlap = (
                entry_week == week_type or 
                entry_week == "երկուսն էլ" or 
                week_type == "երկուսն էլ"
            )
            
            if entry_room == room and weeks_overlap:
                is_available = False
                break
        
        if is_available:
            available_rooms.append(room)
    
    logger.info(f"Գտնվել է {len(available_rooms)} հասանելի լսարաններ: {available_rooms}")
    
    # Ընտրում է լավագույն հասանելի լսարանը
    if available_rooms:
        # Խառնում է տարբերակների հավանականությունը
        random.shuffle(available_rooms)
        return available_rooms[0]
    
    # Եթե նույն շենքում ոչ մի լսարան հասանելի չէ, վերադարձնում է None
    return None
def find_room_conflicts(schedule_result):
    """
    Գտնում է այն իրավիճակները, երբ նույն լսարանը նշանակված է մի քանի դասերի
    նույն ժամանակում
    
    Args:
        schedule_result: Նշանակված սլոթներով դասերի ցուցակ
        
    Returns:
        Կոնֆլիկտների ցուցակ մանրամասներով
    """
    conflicts = []
    
    # Խմբավորում է դասերը ըստ ժամանակի սլոթի և լսարանի
    classes_by_slot_room = defaultdict(list)
    
    for idx, entry in enumerate(schedule_result):
        day = entry.get("assigned_day")
        hour = entry.get("assigned_hour")
        room = entry.get("room", "")
        week_type = entry.get("week_type", "համարիչ")
        
        if room not in ["Անորոշ", "Հայտնի չէ", "ՕԼ", "Ֆիզկուլտուրա"]:
            slot_key = (day, hour, room)
            classes_by_slot_room[slot_key].append((idx, entry, week_type))
    
    # Ստուգում է կոնֆլիկտները
    for slot_key, entries in classes_by_slot_room.items():
        day, hour, room = slot_key
        
        # Ստուգում է յուրաքանչյուր դասերի զույգը
        for i in range(len(entries)):
            for j in range(i+1, len(entries)):
                idx1, entry1, week1 = entries[i]
                idx2, entry2, week2 = entries[j]
                
                # Ստուգում է, արդյոք շաբաթները համընկնում են
                weeks_overlap = (
                    week1 == week2 or 
                    week1 == "երկուսն էլ" or 
                    week2 == "երկուսն էլ"
                )
                
                if weeks_overlap:
                    conflicts.append({
                        "slot": (day, hour),
                        "room": room,
                        "entries": [(idx1, entry1), (idx2, entry2)],
                        "week_types": [week1, week2]
                    })
    
    logger.info(f"Գտնվել է {len(conflicts)} լսարանների կոնֆլիկտներ")
    return conflicts

def resolve_room_conflicts(conflicts, result, schedule):
    """
    Լուծում է լսարանների կոնֆլիկտները՝ գտնելով այլընտրանքային լսարաններ
    
    Args:
        conflicts: Լուծելու ենթակա կոնֆլիկտների ցուցակ
        result: Թարմացվելիք նշանակված դասերի ցուցակ
        schedule: Ընթացիկ ժամանակացույցի վիճակը (հասանելիության ստուգման համար)
    """
    resolved_count = 0
    
    for conflict in conflicts:
        day, hour = conflict["slot"]
        room = conflict["room"]
        entries = conflict["entries"]
        week_types = conflict["week_types"]
        
        logger.info(f"Լուծում է {room} լսարանի կոնֆլիկտը օր {day}, ժամ {hour}")
        
        # Փորձում է լուծել յուրաքանչյուր գրառումը
        for i, (idx, entry) in enumerate(entries):
            # Բաց է թողնում առաջին գրառումը (պահում է այն սկզբնական լսարանում)
            if i == 0:
                continue
            
            week_type = week_types[i]
            alternative_room = find_alternative_room(
                room, 
                day, 
                hour, 
                week_type, 
                schedule
            )
            
            if alternative_room:
                logger.info(f"Գտնվել է այլընտրանքային {alternative_room} լսարան {entry['subject']} ({entry['type']})-ի համար")
                
                # Թարմացնում է լսարանը արդյունքների ցուցակում
                result[idx]["room"] = alternative_room
                
                # Թարմացնում է նաև ժամանակացույցում հետագա կոնֆլիկտների ստուգման համար
                for slot_entry in schedule[(day, hour)]:
                    if (slot_entry.get("subject") == entry["subject"] and
                        slot_entry.get("type") == entry["type"] and
                        slot_entry.get("teacher") == entry["teacher"]):
                        slot_entry["room"] = alternative_room
                
                resolved_count += 1
            else:
                logger.warning(f"Չհաջողվեց գտնել այլընտրանքային լսարան {entry['subject']} ({entry['type']})-ի համար")
    
    logger.info(f"Լուծվեց {resolved_count}/{len(conflicts)} լսարանների կոնֆլիկտներ")

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
    Find a suitable time slot for a class using a simplified approach with randomized days and hours
    """
    # Get randomized day and hour orders
    random_days = get_randomized_days()
    random_hours = get_randomized_hours()
    
    # Generate all slots in randomized order
    all_slots = [(day, hour) for day in random_days for hour in random_hours]
    
    # Further randomize the order of slots
    random.shuffle(all_slots)
    
    # Add random preference to some slots (varies with each run)
    preferred_slots = []
    for _ in range(3):  # Choose 3 random preferred slots
        if all_slots:
            slot = random.choice(all_slots)
            preferred_slots.append(slot)
    
    # Sort slots to try preferred ones first, but keep overall randomness
    def slot_priority(slot):
        return -10 if slot in preferred_slots else random.randint(-5, 5)
    
    all_slots.sort(key=slot_priority)
    
    # Initialize conflict counter if stats are requested
    if conflict_stats is not None:
        slot_conflicts = {slot: 0 for slot in all_slots}
    
    # Try all 20 slots in the randomized order
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
    # Use randomized order to vary even the fallback option
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
    
    # Ստեղծում ենք ծանրաբեռնվածության հաշվիչը
    course_loads = initialize_course_load_balancer()
    
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
        "successful_backtracking": 0,
        "week_switches": initialize_week_switch_stats()  # Ավելացնել շաբաթի փոփոխման վիճակագրությունը
    }
    
    # Հաշվել առաջնահերթությունը յուրաքանչյուր դասի համար և դասավորել
    classes_with_priority = [(cls, calculate_class_priority(cls)) for cls in all_classes]
    
    # Add some randomness to similar-priority classes
    for i in range(len(classes_with_priority) - 1):
        if i < len(classes_with_priority) - 1:
            # If two consecutive classes have similar priority (difference <= 1),
            # randomly decide whether to swap them
            if abs(classes_with_priority[i][1] - classes_with_priority[i+1][1]) <= 1 and random.random() < 0.4:
                classes_with_priority[i], classes_with_priority[i+1] = classes_with_priority[i+1], classes_with_priority[i]
    
    sorted_classes = sorted(classes_with_priority, key=lambda x: x[1], reverse=True)
    
    # Խմբավորել դասերը ըստ առարկայի՝ ավելի լավ բաշխման համար
    courses = {}
    for class_data, priority in sorted_classes:
        course = class_data["course"]
        if course not in courses:
            courses[course] = []
        courses[course].append((class_data, priority))
    
    # Randomize the order of courses to further increase variability
    course_keys = list(courses.keys())
    random.shuffle(course_keys)
    
    # Վերջնական արդյունք՝ նշանակված սլոթներով
    result = []
    # Պահել դասերի ինդեքսները ըստ սլոթների՝ վերադասավորման համար
    result_by_slot = {(day, hour): [] for day in range(1, 6) for hour in range(1, 5)}
    
    # Մշակել յուրաքանչյուր դասընթացը առանձին՝ ավելի լավ բաշխում ապահովելու համար
    # Use randomized course order
    for course in course_keys:
        course_classes = courses[course]
        logger.info(f"Scheduling classes for course: {course}")
        
        # Դասավորել դասերը յուրաքանչյուր դասընթացի մեջ ըստ առաջնահերթության
        course_classes.sort(key=lambda x: x[1], reverse=True)
        
        # Հետևել այս դասընթացի կողմից օգտագործված սլոթներին
        course_slots_used = set()
        
        # Մշակել յուրաքանչյուր դաս այս դասընթացի համար
        for class_data, priority in course_classes:
            # Փորձել տեղավորել դասը առանց վերադասավորման
            slot_found, day, hour, assigned_week_type = try_find_slot_enhanced(
                class_data, 
                schedule, 
                teacher_availability,
                occupied_slots_by_teacher,
                course_loads,  # Փոխանցել ծանրաբեռնվածության տվյալները
                conflict_stats
            )
            
            # Եթե սլոթ չի գտնվել, փորձել վերադասավորել արդեն գոյություն ունեցող դասերը
            if not slot_found:
                logger.info(f"Attempting backtracking for {class_data['subject']} ({class_data['type']})")
                conflict_stats["backtracking_attempts"] += 1
                
                # Փորձել վերադասավորում՝ առաջնահերթությունը հաշվի առնելով
                slot_found, day, hour, assigned_week_type = try_backtracking_enhanced(
                    class_data,
                    schedule,
                    result,
                    result_by_slot,
                    teacher_availability,
                    occupied_slots_by_teacher,
                    course_loads,  # Փոխանցել ծանրաբեռնվածության տվյալները
                    conflict_stats
                )
                
                if slot_found:
                    conflict_stats["successful_backtracking"] += 1
                    logger.info(f"Backtracking successful for {class_data['subject']}")
            
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
                "week_type": assigned_week_type  # Օգտագործել փոփոխված week_type
            })
            
            # Թարմացնել կուրսի ծանրաբեռնվածությունը
            if assigned_week_type in ["համարիչ", "հայտարար", "երկուսն էլ"]:
                course_loads[course][assigned_week_type] += 1
                
                # Եթե "երկուսն էլ" տիպի դաս է, հաշվել երկու շաբաթների համար
                if assigned_week_type == "երկուսն էլ":
                    course_loads[course]["համարիչ"] += 1
                    course_loads[course]["հայտարար"] += 1
            
            # Պահպանել արդյունքը և ինդեքսը
            result_index = len(result)
            result.append(result_entry)
            result_by_slot[(day, hour)].append(result_index)
    
    # Վերջում արտածել կուրսի ծանրաբեռնվածության վիճակագրությունը
    logger.info("Course load balance:")
    for course, loads in course_loads.items():
        num_week1 = loads["համարիչ"]
        num_week2 = loads["հայտարար"]
        diff = abs(num_week1 - num_week2)
        logger.info(f"  Course {course}: համարիչ: {num_week1}, հայտարար: {num_week2}, Difference: {diff}")
        
        # Եթե տարբերությունը մեծ է, արտածել զգուշացում
        if diff > 3:
            logger.warning(f"  ⚠️ Course {course} has imbalanced loads (diff={diff})")
    
    # Գրանցել սլոթերի բաշխման վիճակագրությունը
    slot_counts = {slot: len(classes) for slot, classes in schedule.items()}
    filled_slots = sum(1 for count in slot_counts.values() if count > 0)
    max_classes = max(slot_counts.values()) if slot_counts else 0
    avg_classes = sum(slot_counts.values()) / len(slot_counts) if slot_counts else 0
    
    logger.info(f"Scheduled {len(result)} classes across {filled_slots}/20 time slots")
    logger.info(f"Max classes per slot: {max_classes}, Average: {avg_classes:.2f}")
    logger.info(f"Conflict stats: {conflict_stats}")
    
    return result, course_loads  # Վերադարձնում ենք նաև կուրսերի ծանրաբեռնվածությունը

def try_find_slot_enhanced(class_data, schedule, teacher_availability, occupied_slots_by_teacher, course_loads, conflict_stats=None):
    """
    Փորձում է գտնել հարմար սլոթ դասի համար, հաշվի առնելով նաև կուրսի ծանրաբեռնվածությունը
    """
    # Ստուգում ենք, թե որքան հաճախ է դասը
    weekly_frequency = class_data.get("weekly_frequency", 2)
    course = class_data["course"]
    original_week_type = class_data.get("week_type", "համարիչ")
    
    # Օգտագործում ենք սկզբնական try_find_slot ֆունկցիան առաջին հերթին
    slot_found, day, hour, assigned_week_type = try_find_slot(
        class_data, 
        schedule, 
        teacher_availability,
        occupied_slots_by_teacher,
        conflict_stats
    )
    
    # Եթե հաջողվեց, վերադարձնում ենք արդյունքը
    if slot_found:
        return slot_found, day, hour, assigned_week_type
    
    # Եթե չի հաջողվել և դասը երկու շաբաթը մեկ է
    if weekly_frequency == 2 and original_week_type != "երկուսն էլ":
        # Փորձում ենք հակառակ շաբաթում
        opposite_week_type = get_opposite_week_type(original_week_type)
        
        # Թարմացնում ենք վիճակագրությունը
        if conflict_stats is not None:
            conflict_stats["week_switches"]["total_attempts"] += 1
        
        # Ստուգում ենք, թե արդյոք փոփոխությունը կպահպանի հավասարակշռությունը
        if will_balance_be_maintained(course, course_loads, original_week_type, opposite_week_type):
            logger.info(f"Trying to switch week type from {original_week_type} to {opposite_week_type} for {class_data['subject']} ({class_data['type']})")
            
            # Ժամանակավորապես փոխում ենք week_type-ը
            temp_class_data = class_data.copy()
            temp_class_data["week_type"] = opposite_week_type
            
            # Փորձել սկզբնական try_find_slot ֆունկցիան հակառակ շաբաթով
            switched_slot_found, switched_day, switched_hour, _ = try_find_slot(
                temp_class_data, 
                schedule, 
                teacher_availability,
                occupied_slots_by_teacher,
                conflict_stats
            )
            
            # Եթե հաջողվեց հակառակ շաբաթում
            if switched_slot_found:
                if conflict_stats is not None:
                    if original_week_type == "համարիչ":
                        conflict_stats["week_switches"]["համարիչ_to_հայտարար"] += 1
                    else:
                        conflict_stats["week_switches"]["հայտարար_to_համարիչ"] += 1
                    conflict_stats["week_switches"]["successful_switches"] += 1
                
                logger.info(f"Successfully switched week type to {opposite_week_type} for {class_data['subject']} ({class_data['type']})")
                return True, switched_day, switched_hour, opposite_week_type
        else:
            logger.info(f"Week type switch would cause imbalance for course {course}, not switching")
    
    # Եթե չի հաջողվել նոր մեթոդով, վերադարձնել սկզբնական արդյունքը
    return slot_found, day, hour, assigned_week_type

def try_backtracking_enhanced(class_data, schedule, result, result_by_slot, teacher_availability, occupied_slots_by_teacher, course_loads, conflict_stats):
    """
    Փորձում է վերադասավորել դասերը և/կամ տեղափոխել մեկ շաբաթից մյուսը,
    հաշվի առնելով նաև կուրսի ծանրաբեռնվածությունը
    """
    # Ստուգում ենք, թե որքան հաճախ է դասը
    weekly_frequency = class_data.get("weekly_frequency", 2)
    course = class_data["course"]
    original_week_type = class_data.get("week_type", "համարիչ")
    
    # Օգտագործել սկզբնական try_backtracking ֆունկցիան
    slot_found, day, hour, assigned_week_type = try_backtracking(
        class_data,
        schedule,
        result,
        result_by_slot,
        teacher_availability,
        occupied_slots_by_teacher,
        conflict_stats
    )
    
    # Եթե հաջողվեց, վերադարձնել արդյունքը
    if slot_found:
        return slot_found, day, hour, assigned_week_type
    
    # Եթե չի հաջողվել և դասը երկու շաբաթը մեկ է
    if weekly_frequency == 2 and original_week_type != "երկուսն էլ":
        # Փորձում ենք հակառակ շաբաթում
        opposite_week_type = get_opposite_week_type(original_week_type)
        
        # Թարմացնում ենք վիճակագրությունը
        if conflict_stats is not None:
            conflict_stats["week_switches"]["total_attempts"] += 1
        
        # Ստուգում ենք, թե արդյոք փոփոխությունը կպահպանի հավասարակշռությունը
        if will_balance_be_maintained(course, course_loads, original_week_type, opposite_week_type):
            logger.info(f"Backtracking: Trying to switch week type from {original_week_type} to {opposite_week_type} for {class_data['subject']} ({class_data['type']})")
            
            # Ժամանակավորապես փոխում ենք week_type-ը
            temp_class_data = class_data.copy()
            temp_class_data["week_type"] = opposite_week_type
            
            # Օգտագործել սկզբնական try_backtracking ֆունկցիան հակառակ շաբաթով
            switched_slot_found, switched_day, switched_hour, _ = try_backtracking(
                temp_class_data,
                schedule,
                result,
                result_by_slot,
                teacher_availability,
                occupied_slots_by_teacher,
                conflict_stats
            )
            
            # Եթե հաջողվեց հակառակ շաբաթում
            if switched_slot_found:
                if conflict_stats is not None:
                    if original_week_type == "համարիչ":
                        conflict_stats["week_switches"]["համարիչ_to_հայտարար"] += 1
                    else:
                        conflict_stats["week_switches"]["հայտարար_to_համարիչ"] += 1
                    conflict_stats["week_switches"]["successful_switches"] += 1
                
                logger.info(f"Backtracking: Successfully switched week type to {opposite_week_type} for {class_data['subject']} ({class_data['type']})")
                return True, switched_day, switched_hour, opposite_week_type
        else:
            logger.info(f"Backtracking: Week type switch would cause imbalance for course {course}, not switching")
    
    # Եթե չի հաջողվել նոր մեթոդով, վերադարձնել սկզբնական արդյունքը
    return slot_found, day, hour, assigned_week_type

def try_find_slot(class_data, schedule, teacher_availability, occupied_slots_by_teacher, conflict_stats=None):
    """
    Փորձում է գտնել հարմար սլոթ դասի համար:
    - Փորձում է 20 սլոթներից յուրաքանչյուրը
    - Ստուգում է դասախոսի հասանելիությունը և դասի տիպի բախումները
    - Վերադարձնում է (գտնվել_է, օր, ժամ, շաբաթի_տիպ) քառյակ
    """
    # Վերցնել օրերն ու ժամերը պատահական հերթականությամբ
    random_days = get_randomized_days()
    random_hours = get_randomized_hours()
    
    # Ստեղծել բոլոր սլոթների ցուցակ պատահական հերթականությամբ
    all_slots = [(day, hour) for day in random_days for hour in random_hours]
    
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
    and correctly applying the CONFLICTS dictionary to check for type conflicts
    """
    # Split data by week type
    week1_data, week2_data, both_weeks = split_by_week_type(raw_data)
    
    # Group all data by course for better organization
    courses_week1 = group_by_course(week1_data)
    courses_week2 = group_by_course(week2_data)
    courses_both = group_by_course(both_weeks)
    
    # Create empty schedule for all slots
    schedule = create_empty_schedule()
    
    # Track occupied slots by teacher to prevent double-booking
    occupied_slots_by_teacher = {}
    
    # Final result with assigned slots
    result = []
    
    # Process all courses sequentially, starting with "both weeks" classes
    # since they have the most constraints
    logger.info("Scheduling 'both weeks' classes first...")
    for course, classes in courses_both.items():
        process_course_classes(
            course, 
            classes, 
            "երկուսն էլ", 
            schedule, 
            result, 
            teacher_availability, 
            occupied_slots_by_teacher
        )
    
    # Then process "համարիչ" week classes
    logger.info("Scheduling 'համարիչ' week classes...")
    for course, classes in courses_week1.items():
        process_course_classes(
            course, 
            classes, 
            "համարիչ", 
            schedule, 
            result, 
            teacher_availability, 
            occupied_slots_by_teacher
        )
    
    # Finally process "հայտարար" week classes
    logger.info("Scheduling 'հայտարար' week classes...")
    for course, classes in courses_week2.items():
        process_course_classes(
            course, 
            classes, 
            "հայտարար", 
            schedule, 
            result, 
            teacher_availability, 
            occupied_slots_by_teacher
        )
    logger.info("Checking for room conflicts...")
    room_conflicts = find_room_conflicts(result)
    
    if room_conflicts:
        logger.info(f"Found {len(room_conflicts)} room conflicts, attempting to resolve...")
        resolve_room_conflicts(room_conflicts, result, schedule)

    # Log summary statistics
    slot_counts = {}
    for class_data in result:
        slot_key = (class_data["assigned_day"], class_data["assigned_hour"], class_data["week_type"])
        slot_counts[slot_key] = slot_counts.get(slot_key, 0) + 1
    
    filled_slots = len(slot_counts)
    max_classes = max(slot_counts.values()) if slot_counts else 0
    avg_classes = sum(slot_counts.values()) / len(slot_counts) if slot_counts else 0
    
    logger.info(f"Scheduled {len(result)} classes across {filled_slots} time slots")
    logger.info(f"Max classes per slot: {max_classes}, Average: {avg_classes:.2f}")
    
    # Mark "երկուսն էլ" week classes explicitly
    for cls in result:
        if cls["week_type"] == "երկուսն էլ":
            logger.info(f"Class {cls['subject']} ({cls['type']}) scheduled for both weeks")
    
    return result

def process_course_classes(course, classes, week_type, schedule, result, teacher_availability, occupied_slots_by_teacher):
    """
    Process all classes for a specific course and week type
    """
    logger.info(f"Processing course {course} for {week_type} week")
    
    # Sort classes by priority (lectures first, then practicals, then labs)
    sorted_classes = sorted(classes, key=calculate_class_priority, reverse=True)
    
    # Process each class for this course
    for class_data in sorted_classes:
        # Get class type for easier reference
        class_type = class_data["type"]
        subject = class_data["subject"]
        
        logger.info(f"  Scheduling {subject} ({class_type}) for {course}")
        
        # First try to find a slot with no conflicts
        day, hour, success = find_slot_without_type_conflicts(
            class_data, 
            schedule, 
            week_type, 
            teacher_availability, 
            occupied_slots_by_teacher
        )
        
        # If no conflict-free slot was found, try resolving conflicts
        # by trying to move existing classes
        if not success:
            logger.info(f"  Could not find conflict-free slot for {subject} ({class_type}), attempting resolution...")
            day, hour, success = resolve_type_conflicts(
                class_data, 
                schedule, 
                week_type, 
                result, 
                teacher_availability, 
                occupied_slots_by_teacher
            )
        
        # If we still couldn't find a suitable slot, use the least conflicted one
        if not success:
            logger.info(f"  Conflict resolution failed for {subject} ({class_type}), using least conflicted slot")
            day, hour = find_least_conflicted_slot(class_data, schedule, week_type)
        
        # Add class to schedule and result
        add_class_to_schedule(
            class_data, 
            day, 
            hour, 
            week_type, 
            schedule, 
            result, 
            occupied_slots_by_teacher
        )
        
        logger.info(f"  Scheduled {subject} ({class_type}) at day {day}, hour {hour}")

def check_type_conflict(class1_type, class2_type):
    """
    Check if there is a conflict between two class types 
    using the CONFLICTS dictionary
    """
    if class1_type in CONFLICTS and class2_type in CONFLICTS[class1_type]:
        return True
    return False

def find_slot_without_type_conflicts(class_data, schedule, week_type, teacher_availability, occupied_slots_by_teacher):
    """
    Try to find a slot without any conflicts, prioritizing teacher availability
    
    Returns a tuple (day, hour, success) where success is a boolean indicating
    whether a conflict-free slot was found
    """
    # Get teacher info
    teacher = class_data["teacher"]
    class_type = class_data["type"]
    course = class_data["course"]
    
    # Get randomized day and hour orders
    random_days = get_randomized_days()
    random_hours = get_randomized_hours()
    
    # Generate all slots in randomized order
    all_slots = [(day, hour) for day in random_days for hour in random_hours]
    
    # Further randomize the slots
    random.shuffle(all_slots)
    
    # Try all slots
    for day, hour in all_slots:
        # Skip if teacher is already occupied
        if teacher not in ["Անորոշ", "Հայտնի չէ"] and (day, hour) in occupied_slots_by_teacher.get(teacher, set()):
            continue
        
        # Skip if teacher is not available at this time
        if not is_teacher_available(teacher, day, hour, teacher_availability):
            continue
        
        # Check for type conflicts with already scheduled classes for this course
        conflict_found = False
        slot_key = (day, hour)
        
        for existing_class in schedule[slot_key]:
            existing_week_type = existing_class.get("week_type", "համարիչ")
            existing_type = existing_class["type"]
            
            # Skip if weeks don't overlap
            if existing_week_type != week_type and existing_week_type != "երկուսն էլ" and week_type != "երկուսն էլ":
                continue
                
            # If same course, check type conflicts from CONFLICTS dictionary
            if existing_class["course"] == course:
                # Special case for language subjects (Խորացված անգլերեն)
                is_language_exception = (
                    existing_class["subject"] in LANGUAGE_SUBJECTS and 
                    class_data["subject"] in LANGUAGE_SUBJECTS and
                    existing_class["subject"] == class_data["subject"] and
                    existing_type == "Գործ" and
                    class_type == "Գործ" and
                    existing_class["teacher"] != teacher
                )
                
                # Check if types conflict unless it's a language exception
                if not is_language_exception and check_type_conflict(class_type, existing_type):
                    logger.info(f"  Type conflict: {class_type} conflicts with {existing_type}")
                    conflict_found = True
                    break
            
            # Special case - all lecture-type classes conflict with each other regardless of course
            elif class_type == "Դաս" and existing_type == "Դաս":
                logger.info(f"  Lecture conflict: {class_data['subject']} with {existing_class['subject']}")
                conflict_found = True
                break
        
        if not conflict_found:
            return day, hour, True
    
    # If no suitable slot found
    return None, None, False

def find_alternative_slot(class_data, current_day, current_hour, schedule, week_type, teacher_availability, occupied_slots_by_teacher):
    """
    Find an alternative slot for a class that needs to be moved
    """
    teacher = class_data["teacher"]
    class_type = class_data["type"]
    course = class_data["course"]
    
    # Get all possible slots
    all_slots = [(day, hour) for day in range(1, 6) for hour in range(1, 5)]
    
    # Remove current slot
    if (current_day, current_hour) in all_slots:
        all_slots.remove((current_day, current_hour))
    
    # Shuffle slots to improve distribution
    random.shuffle(all_slots)
    
    # Try all slots
    for day, hour in all_slots:
        # Skip if teacher is already occupied
        if teacher not in ["Անորոշ", "Հայտնի չէ"] and (day, hour) in occupied_slots_by_teacher.get(teacher, set()):
            continue
        
        # Skip if teacher is not available at this time
        if not is_teacher_available(teacher, day, hour, teacher_availability):
            continue
        
        # Check for conflicts
        conflict_found = False
        
        for existing_class in schedule[(day, hour)]:
            existing_week_type = existing_class.get("week_type", "համարիչ")
            existing_type = existing_class["type"]
            
            # Skip if weeks don't overlap
            if existing_week_type != week_type and existing_week_type != "երկուսն էլ" and week_type != "երկուսն էլ":
                continue
            
            # If same course, check type conflicts
            if existing_class["course"] == course:
                # Special case for language subjects
                is_language_exception = (
                    existing_class["subject"] in LANGUAGE_SUBJECTS and 
                    class_data["subject"] in LANGUAGE_SUBJECTS and
                    existing_class["subject"] == class_data["subject"] and
                    existing_type == "Գործ" and
                    class_type == "Գործ" and
                    existing_class["teacher"] != teacher
                )
                
                if not is_language_exception and check_type_conflict(class_type, existing_type):
                    conflict_found = True
                    break
            
            # Special case - all lecture-type classes conflict with each other
            elif class_type == "Դաս" and existing_type == "Դաս":
                conflict_found = True
                break
        
        if not conflict_found:
            return day, hour, True
    
    # No alternative slot found
    return None, None, False

def find_least_conflicted_slot(class_data, schedule, week_type):
    """
    Find the slot with the least conflicts for a class
    """
    class_type = class_data["type"]
    course = class_data["course"]
    
    # Track conflicts for each slot
    slot_conflicts = {}
    
    for day in range(1, 6):
        for hour in range(1, 5):
            slot_key = (day, hour)
            conflicts = 0
            
            for existing_class in schedule[slot_key]:
                existing_week_type = existing_class.get("week_type", "համարիչ")
                
                # Skip if weeks don't overlap
                if existing_week_type != week_type and existing_week_type != "երկուսն էլ" and week_type != "երկուսն էլ":
                    continue
                
                # Count type conflicts for the same course
                if existing_class["course"] == course:
                    # Special case for language subjects
                    is_language_exception = (
                        existing_class["subject"] in LANGUAGE_SUBJECTS and 
                        class_data["subject"] in LANGUAGE_SUBJECTS and
                        existing_class["subject"] == class_data["subject"] and
                        existing_class["type"] == "Գործ" and
                        class_type == "Գործ" and
                        existing_class["teacher"] != class_data["teacher"]
                    )
                    
                    if not is_language_exception and check_type_conflict(class_type, existing_class["type"]):
                        conflicts += 1
                
                # Count lecture conflicts
                elif class_type == "Դաս" and existing_class["type"] == "Դաս":
                    conflicts += 1
            
            slot_conflicts[slot_key] = conflicts
    
    # Find the slot with the least conflicts
    least_conflicted = min(slot_conflicts.items(), key=lambda x: x[1])
    return least_conflicted[0]

# Helper functions for schedule manipulation

def remove_from_schedule(class_data, day, hour, schedule, occupied_slots_by_teacher):
    """Remove a class from a schedule slot"""
    slot_key = (day, hour)
    if class_data in schedule[slot_key]:
        schedule[slot_key].remove(class_data)
    
    # Update teacher occupied slots
    teacher = class_data["teacher"]
    if teacher not in ["Անորոշ", "Հայտնի չէ"]:
        if slot_key in occupied_slots_by_teacher.get(teacher, set()):
            occupied_slots_by_teacher[teacher].remove(slot_key)

def add_to_schedule(class_data, day, hour, schedule, occupied_slots_by_teacher):
    """Add a class to a schedule slot"""
    slot_key = (day, hour)
    schedule[slot_key].append(class_data)
    
    # Update teacher occupied slots
    teacher = class_data["teacher"]
    if teacher not in ["Անորոշ", "Հայտնի չէ"]:
        occupied_slots_by_teacher.setdefault(teacher, set()).add(slot_key)

def update_result(class_data, old_day, old_hour, new_day, new_hour, result):
    """Update a class in the result list"""
    for i, entry in enumerate(result):
        if (entry.get("id", None) == class_data.get("id", None) or
            (entry.get("subject") == class_data.get("subject") and
             entry.get("teacher") == class_data.get("teacher") and
             entry.get("type") == class_data.get("type") and
             entry.get("assigned_day") == old_day and
             entry.get("assigned_hour") == old_hour)):
            result[i]["assigned_day"] = new_day
            result[i]["assigned_hour"] = new_hour
            return True
    return False

def add_class_to_schedule(class_data, day, hour, week_type, schedule, result, occupied_slots_by_teacher):
    """
    Add a class to both schedule and result lists
    """
    # Add to schedule
    slot_key = (day, hour)
    schedule[slot_key].append(class_data)
    
    # Mark teacher's slot as occupied
    teacher = class_data["teacher"]
    if teacher not in ["Անորոշ", "Հայտնի չէ"]:
        occupied_slots_by_teacher.setdefault(teacher, set()).add(slot_key)
    
    # Create result entry
    result_entry = class_data.copy()
    result_entry.update({
        "assigned_day": day,
        "assigned_hour": hour,
        "week_type": week_type if "week_type" not in class_data else class_data["week_type"]
    })
    
    result.append(result_entry) 
    
    # If no suitable slot found
    return None, None, False
def resolve_type_conflicts(class_data, schedule, week_type, result, teacher_availability, occupied_slots_by_teacher):
    """
    Try to resolve conflicts by moving existing classes to make room for the new one
    Uses a randomized approach for more variety in solutions
    
    Returns a tuple (day, hour, success) where success is a boolean indicating
    whether the conflicts were resolved successfully
    """
    class_type = class_data["type"]
    course = class_data["course"]
    logger.info(f"Attempting to resolve conflicts for {class_data['subject']} ({class_type})")
    
    # Get randomized day and hour orders
    random_days = get_randomized_days()
    random_hours = get_randomized_hours()
    
    # Generate all slots in randomized order
    all_slots = [(day, hour) for day in random_days for hour in random_hours]
    random.shuffle(all_slots)
    
    # Find potential slots with minimal conflicts
    conflict_slots = []
    
    for day, hour in all_slots:
        slot_key = (day, hour)
        
        # Check teacher availability
        teacher = class_data["teacher"]
        if teacher not in ["Անորոշ", "Հայտնի չէ"] and slot_key in occupied_slots_by_teacher.get(teacher, set()):
            continue
        
        if not is_teacher_available(teacher, day, hour, teacher_availability):
            continue
        
        # Find type conflicts in this slot
        conflicts = []
        
        for existing_class in schedule[slot_key]:
            existing_week_type = existing_class.get("week_type", "համարիչ")
            existing_type = existing_class["type"]
            
            # Skip if weeks don't overlap
            if existing_week_type != week_type and existing_week_type != "երկուսն էլ" and week_type != "երկուսն էլ":
                continue
            
            # Check conflicts only for same course
            if existing_class["course"] == course:
                # Special case for language subjects
                is_language_exception = (
                    existing_class["subject"] in LANGUAGE_SUBJECTS and 
                    class_data["subject"] in LANGUAGE_SUBJECTS and
                    existing_class["subject"] == class_data["subject"] and
                    existing_type == "Գործ" and
                    class_type == "Գործ" and
                    existing_class["teacher"] != teacher
                )
                
                # If not a language exception and there's a conflict, add to conflicts list
                if not is_language_exception and check_type_conflict(class_type, existing_type):
                    conflicts.append(existing_class)
            
            # Special case - all lecture-type classes conflict with each other
            elif class_type == "Դաս" and existing_type == "Դաս":
                conflicts.append(existing_class)
        
        # If we found conflicts that might be resolvable
        if conflicts:
            # Calculate mobility score for this slot with some randomness
            mobility_score = sum([
                # Prefer moving lower priority classes
                10 - calculate_class_priority(c) + 
                # Prefer moving non-lectures if our class is a lecture
                (5 if class_type == "Դաս" and c["type"] != "Դաս" else 0) +
                # Prefer moving practicals and labs over lectures
                (3 if c["type"].startswith("Գործ") or c["type"].startswith("Լաբ") else 0) +
                # Add some randomness (0-3 points)
                random.randint(0, 3)
                for c in conflicts
            ])
            
            conflict_slots.append((day, hour, conflicts, mobility_score))
    
    # Sort slots by mobility score (highest first - easiest to resolve)
    conflict_slots.sort(key=lambda x: x[3], reverse=True)
    
    # Try to resolve each slot by moving conflicting classes
    for day, hour, conflicts, _ in conflict_slots[:5]:  # Try top 5 candidates
        logger.info(f"  Trying to resolve conflicts at day {day}, hour {hour} with {len(conflicts)} conflicts")
        
        # Try moving each conflict class
        moved_classes = []
        all_moved = True
        
        # Randomize the order of conflicting classes to try
        random.shuffle(conflicts)
        
        for conflict_class in conflicts:
            # Find an alternative slot for this conflict class
            alt_day, alt_hour, move_success = find_alternative_slot(
                conflict_class,
                day,
                hour,
                schedule,
                conflict_class.get("week_type", week_type),
                teacher_availability,
                occupied_slots_by_teacher
            )
            
            if move_success:
                logger.info(f"    Successfully found alternative slot ({alt_day},{alt_hour}) for {conflict_class['subject']}")
                # Temporarily move the class
                moved_classes.append({
                    "class": conflict_class,
                    "old_day": day,
                    "old_hour": hour,
                    "new_day": alt_day,
                    "new_hour": alt_hour
                })
                
                # Perform the move in the schedule
                remove_from_schedule(conflict_class, day, hour, schedule, occupied_slots_by_teacher)
                add_to_schedule(conflict_class, alt_day, alt_hour, schedule, occupied_slots_by_teacher)
            else:
                logger.info(f"    Could not find alternative for {conflict_class['subject']} ({conflict_class['type']})")
                all_moved = False
                break
        
        # If we successfully moved all conflicting classes
        if all_moved and moved_classes:
            logger.info(f"  Successfully resolved all conflicts, slot ({day},{hour}) is now available")
            
            # Update the result list for all moved classes
            for move in moved_classes:
                update_result(
                    move["class"],
                    move["old_day"],
                    move["old_hour"],
                    move["new_day"],
                    move["new_hour"],
                    result
                )
            
            return day, hour, True
            
        # If we couldn't move all classes, roll back any moves we made
        if not all_moved and moved_classes:
            logger.info(f"  Could not move all classes, rolling back {len(moved_classes)} moves")
            for move in moved_classes:
                # Roll back the move
                remove_from_schedule(move["class"], move["new_day"], move["new_hour"], schedule, occupied_slots_by_teacher)
                add_to_schedule(move["class"], move["old_day"], move["old_hour"], schedule, occupied_slots_by_teacher)
    
    # If we couldn't resolve any slot
    logger.info("  Could not resolve any conflicts")
    # Return None, None, False instead of just False
    return None, None, False
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
    Գլխավոր ֆունկցիան, որն իրականացնում է ժամանակացույցի ստեղծումը բազմաթրեդային մոտեցմամբ
    """
    master_seed = int(time.time())
    random.seed(master_seed)
    logger.info(f"Օգտագործվում է պատահականացման մաստեր սերմը՝ {master_seed}")

    try:
        # 1. Զուգահեռաբար բեռնում է տվյալները
        teacher_avail, raw_data, room_types_from_db = load_data_parallel()
        
        # Ստուգում է արդյոք բեռնումը հաջող է եղել
        if not raw_data:
            logger.error("Չհաջողվեց բեռնել դասերի տվյալները, ավարտ")
            return False
        
        # Օգտագործում է բեռնված լսարանների տիպերը
        global ROOM_TYPES
        if room_types_from_db:
            ROOM_TYPES = room_types_from_db
            logger.info(f"Օգտագործվում են {len(ROOM_TYPES)} լսարանների տիպեր բազայից")
        else:
            logger.warning("Չկան լսարանների տիպեր բազայից, օգտագործվում են սահմանված արժեքները")
            # Այստեղ կարող ենք օգտագործել հարկադրված backup տարբերակ
            initialize_room_types_backup()
        
        # 2. Գեներացնում է մի քանի զուգահեռ ժամանակացույցներ և ընտրում լավագույնը
        logger.info("Գեներացնում է մի քանի ժամանակացույցեր...")
        final_schedule, course_loads = generate_multiple_schedules(raw_data, teacher_avail, attempts=4)
        
        if not final_schedule:
            logger.error("Չհաջողվեց ստեղծել ժամանակացույցը")
            return False
        
        logger.info(f"Ստեղծված է ժամանակացույց {len(final_schedule)} դասերով")
        
        # 3. Արտահանում է կուրսերի ծանրաբեռնվածության տվյալները
        export_course_load_balance(course_loads)
        
        # 4. Զուգահեռաբար ստուգում է բախումները
        logger.info("Ստուգում է ժամանակացույցի բախումները...")
        clashes = find_conflicts_parallel(final_schedule)
        
        if clashes:
            Path("conflicts.json").write_text(
                json.dumps(clashes, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            
            # Հաշվում է բախումների տարբեր տիպերը
            conflict_types = {}
            for clash in clashes:
                issue = clash.get("issue", "Unknown")
                conflict_types[issue] = conflict_types.get(issue, 0) + 1
            
            logger.warning(f"❗ Գտնվել է {len(clashes)} բախումներ, տես ./conflicts.json")
            logger.warning(f"Բախումների տիպեր՝ {conflict_types}")
        else:
            logger.info("✅ Բախումներ չեն հայտնաբերվել")
        
        # 5. Պատրաստում և պահպանում է արդյունքները
        logger.info("Պատրաստում է տվյալները բազայի համար...")
        db_schedule = prepare_schedule_for_db(final_schedule)
        
        # Պահպանում է նաև JSON տարբերակը
        Path("schedule_output.json").write_text(
            json.dumps(final_schedule, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        logger.info("Ժամանակացույցը պահպանված է schedule_output.json ֆայլում")
        
        # Արտահանում է հավելյալ վիճակագրություն
        slots_used = set((cls["assigned_day"], cls["assigned_hour"]) for cls in final_schedule)
        classes_by_day = {}
        for cls in final_schedule:
            day = cls["assigned_day"]
            classes_by_day[day] = classes_by_day.get(day, 0) + 1
            
        classes_by_week = {"համարիչ": 0, "հայտարար": 0, "երկուսն էլ": 0}
        for cls in final_schedule:
            week_type = cls.get("week_type", "համարիչ")
            classes_by_week[week_type] = classes_by_week.get(week_type, 0) + 1
        
        stats = {
            "total_classes": len(final_schedule),
            "filled_slots": len(slots_used),
            "classes_by_day": classes_by_day,
            "classes_by_week": classes_by_week,
            "course_loads_summary": {
                "balanced_courses": sum(1 for course, loads in course_loads.items() 
                                     if abs(loads["համարիչ"] - loads["հայտարար"]) <= 3),
                "imbalanced_courses": sum(1 for course, loads in course_loads.items() 
                                      if abs(loads["համարիչ"] - loads["հայտարար"]) > 3)
            }
        }
        
        Path("schedule_stats.json").write_text(
            json.dumps(stats, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        logger.info("Վիճակագրությունը պահպանված է schedule_stats.json ֆայլում")
        
        # 6. Պահպանում է տվյալները բազայում
        logger.info("Պահպանում է տվյալները բազայում...")
        save_schedule_to_db(db_schedule)
        logger.info(f"Պահպանված է {len(db_schedule)} դասեր բազայում")
        
        logger.info("Ժամանակացույցը հաջողությամբ ստեղծված է")
        return True
    
    except Exception as e:
        logger.error(f"❌ ՍԽԱԼ: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    main()