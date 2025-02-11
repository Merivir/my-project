import json

TYPE_MAP = {
    "Դաս": "lecture",
    "Գործ1": "work1",
    "Գործ2": "work2",
    "Գործ3": "work3",
    "Լաբ1": "lab1",
    "Լաբ2": "lab2",
    "Լաբ3": "lab3",
    "Լաբ4": "lab4"
}

def find_best_slot(entry, occupied_slots, teacher_schedule, room_schedule):
    """
    Փնտրում է լավագույն ազատ ժամ՝ խուսափելու համար բախումներից:
    """
    for day_of_week in range(1, 6):  # Մեկ շաբաթվա 5 օր
        for time_of_day in range(1, 5):  # Օրվա 4 դասաժամ
            slot_key = (entry["course"], day_of_week, time_of_day)
            room_conflict = any((day_of_week, time_of_day) in room_schedule.get(room, set()) for room in entry["rooms"])
            teacher_conflict = any((day_of_week, time_of_day) in teacher_schedule.get(teacher, set()) for teacher in entry["teachers"])
            if slot_key not in occupied_slots and not room_conflict and not teacher_conflict:
                return day_of_week, time_of_day
    return None, None

def generate_schedule(data):
    schedule = []
    conflicts = []
    occupied_slots = {}  # Պահպանում ենք զբաղված ժամերը
    teacher_schedule = {}  # Ուսուցիչների զբաղվածության ստուգման համար
    room_schedule = {}  # Լսարանների զբաղվածության ստուգման համար

    type_priority = ["lecture", "work1", "work2", "work3", "lab1", "lab2", "lab3", "lab4"]
    
    CONFLICTS = {
        "lecture": {"lecture", "work1", "work2", "work3", "lab1", "lab2", "lab3", "lab4"},
        "work1": {"lab1", "lab2"},
        "work2": {"lab2", "lab3"},
        "work3": {"lab3", "lab4"},
        "lab1": {"work1"},
        "lab2": {"work1", "work2"},
        "lab3": {"work2", "work3"},
        "lab4": {"work3"}
    }

    for priority in type_priority:
        for entry in data:
            subject_types = [TYPE_MAP.get(t, t) for t in entry["type"]]
            for subject_type in subject_types:
                if subject_type in priority:
                    week_type = entry["biweekly_frequency"] if entry["biweekly_frequency"] == 2 else entry["weekly_frequency"]
                    
                    for day_of_week in range(1, 6):  # Մեկ շաբաթվա 5 օր
                        for time_of_day in range(1, 5):  # Օրվա 4 դասաժամ
                            slot_key = (entry["course"], day_of_week, time_of_day)
                            room_conflict = any((day_of_week, time_of_day) in room_schedule.get(room, set()) for room in entry["rooms"])
                            teacher_conflict = any((day_of_week, time_of_day) in teacher_schedule.get(teacher, set()) for teacher in entry["teachers"])
                            conflict_found = any(existing_type in CONFLICTS.get(subject_type, set()) for existing_type in occupied_slots.get(slot_key, set()))

                            if not conflict_found and not room_conflict and not teacher_conflict:
                                occupied_slots.setdefault(slot_key, set()).add(subject_type)
                                for room in entry["rooms"]:
                                    room_schedule.setdefault(room, set()).add((day_of_week, time_of_day))
                                for teacher in entry["teachers"]:
                                    teacher_schedule.setdefault(teacher, set()).add((day_of_week, time_of_day))
                                
                                schedule.append({
                                    "level": entry["level"],
                                    "course": entry["course"],
                                    "subject": entry["subject"],
                                    "type": [subject_type],
                                    "teachers": entry["teachers"],
                                    "rooms": entry["rooms"],
                                    "day_of_week": day_of_week,
                                    "time_of_day": time_of_day,
                                    "week_type": week_type
                                })
                                break  # Յուրաքանչյուր դասի համար տեղավորում ենք միայն մեկ անգամ
                        else:
                            continue
                        break
                    else:
                        # Եթե չգտնվեց ազատ ժամ, փնտրում ենք լավագույն այլընտրանքային ժամ
                        new_day, new_time = find_best_slot(entry, occupied_slots, teacher_schedule, room_schedule)
                        if new_day and new_time:
                            occupied_slots.setdefault((entry["course"], new_day, new_time), set()).add(subject_type)
                            for room in entry["rooms"]:
                                room_schedule.setdefault(room, set()).add((new_day, new_time))
                            for teacher in entry["teachers"]:
                                teacher_schedule.setdefault(teacher, set()).add((new_day, new_time))
                            
                            schedule.append({
                                "level": entry["level"],
                                "course": entry["course"],
                                "subject": entry["subject"],
                                "type": [subject_type],
                                "teachers": entry["teachers"],
                                "rooms": entry["rooms"],
                                "day_of_week": new_day,
                                "time_of_day": new_time,
                                "week_type": week_type
                            })
    
    return schedule, conflicts

# Գեներացնել դասացուցակը JSON ֆայլից
if __name__ == "__main__":
    with open("updated_everything.json", "r", encoding="utf-8") as f:
        sample_data = json.load(f)

    final_schedule, detected_conflicts = generate_schedule(sample_data)
    
    with open("final_schedule.json", "w", encoding="utf-8") as f:
        json.dump(final_schedule, f, ensure_ascii=False, indent=4)
    
    with open("conflicts.json", "w", encoding="utf-8") as f:
        json.dump(detected_conflicts, f, ensure_ascii=False, indent=4)
    
    print(json.dumps(final_schedule, ensure_ascii=False, indent=4))
    if detected_conflicts:
        print("\nDetected Conflicts:")
        print(json.dumps(detected_conflicts, ensure_ascii=False, indent=4))
