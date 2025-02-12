import json
import itertools

# Սահմանում ենք օրերի եւ ժամերի դոմենը:
DAYS = range(1, 6)    # 1-ից 5
TIMES = range(1, 5)   # 1-ից 4

# Կարգավիճակները, որոնք կօգտագործենք կոնֆլիկտների ստուգման համար:
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

# Կոնֆլիկտների կանոնները (համակցական սետեր):
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

def convert_schedule_keys(schedule):
    """
    Վերահավաքում է ժամանակացույցի grid–ը, որտեղ tuple բանալիները վերափոխվում են "day-time" տողերի:
    """
    new_schedule = {}
    for (day, time), sessions in schedule.items():
        key_str = f"{day}-{time}"
        new_schedule[key_str] = sessions
    return new_schedule

def get_conflict_tags(session):
    """
    Վերադարձնում է դասի տիպերի համապատասխան tag–ները (հնարավորությամբ մի քանի tag):
    """
    tags = set()
    for t in session.get("type", []):
        if t in TYPE_MAP:
            tags.add(TYPE_MAP[t])
    return tags

def slot_has_conflict(slot_sessions, new_session):
    """
    Եթե 'slot_sessions'–ում արդեն կա որևէ դաս, ստուգում է,
    թե արդյոք ավելացված 'new_session'-ը կոնֆլիկտում է հետ ունեցած դասերի հետ ըստ սահմանված կանոնների:
    """
    new_tags = get_conflict_tags(new_session)
    for s in slot_sessions:
        existing_tags = get_conflict_tags(s)
        # Եթե որևէ lecture–ն է, ապա չհնարավոր է համատեղել ուրիշ որևէ դաս:
        if "lecture" in new_tags or "lecture" in existing_tags:
            return True
        for tag in new_tags:
            if tag in CONFLICTS:
                if any(existing_tag in CONFLICTS[tag] for existing_tag in existing_tags):
                    return True
        # ինչպես նաև ստուգում ենք հակասականությունը հակառակ:
        for tag in existing_tags:
            if tag in CONFLICTS:
                if any(new_tag in CONFLICTS[tag] for new_tag in new_tags):
                    return True
    return False

def find_free_slot(schedule_grid, session):
    """
    Գտնում է այն առաջին ազատ սլոտը, որտեղ կարելի է տեղադրել 'session'-ը՝ ստուգելով կոնֆլիկտները։
    'schedule_grid'-ը տիպավորումն է dictionary, որտեղ բացի (day, time) ստուգվում են արդեն պատշաճ դասերը:
    """
    for day in DAYS:
        for time in TIMES:
            slot = (day, time)
            if not slot_has_conflict(schedule_grid[slot], session):
                return slot
    return None

def initialize_schedule():
    """
    Սկզբում ստեղծում ենք դատարկ ժամանակացույցի grid՝ օրերով և ժամերով:
    """
    grid = {}
    for day in DAYS:
        for time in TIMES:
            grid[(day, time)] = []  # սկսում ենք դատարկ slot
    return grid

def schedule_sessions(sessions, common=True):
    """
    Թող common=True, ապա ժամանակացույցի կետերը կստուգվեն երկու շաբաթների համար (երկուսում նույնը պետք է լինի),
    եթե common=False, ապա տվյալները նախատեսված են մեկ շաբաթ (week_type–ը ընդգրկում է ինչ շաբաթ),
    ու մենք միայն մեկ հանգույցում ենք այն տեղադրում:
    
    Այս ֆունկցիան կգտնի և կբաշխի յուրաքանչյուր դասին ժամանակացույցի սլոտը, ու կավելացնի նրանց համապատասխան grid–ում:
    
    Վերադարձնում է schedule_grid, որը բնութագրում է յուրաքանչյուր (day,time) սլոտում գտնվում են դասերը:
    """
    schedule_grid = initialize_schedule()
    assignments = {}  # session id (հետևել ենք, որ յուրաքանչուր session-ին կարելի է ավելացնել "id" կամ օգտագործել իր եզակի սերվե)
    for session in sessions:
        slot = find_free_slot(schedule_grid, session)
        if slot is None:
            print("Չհնարավոր է տեղադրել դասը՝", session)
        else:
            schedule_grid[slot].append(session)
            # Հիշել ավելացնել slot-ին session-ի ինֆորմացիան:
            session["assigned_slot"] = slot
            assignments[id(session)] = slot
    return schedule_grid, assignments

def group_sessions_by_common_key(data):
    """
    Ընդհանուր ենք խումբավորում դասերը ըստ ամենանշանակ թե ամենքը նույնին են,
    առանց week_type–ը։ Եթե խմբում երկու տարբեր week_type–ներ (1 և 2) կան, ապա այդ դասերը համարվում են 'համընդհանուր'
    (common)։
    Վերադարձնում է tuple (common_sessions, one_week_sessions)
    որտեղ common_sessions-ում էլ երկու գրառում կա (հիմք, որոնք պետք է նույն սլոտն ունեն),
    իսկ one_week_sessions-ը պարունակում է այն, որոնք միայն մեկ շաբաթի համար են:
    """
    groups = {}
    for session in data:
        # Ստեղծենք բանալին՝ բոլոր դաշտերը, բացի week_type-ի:
        key = (session.get("level"), session.get("course"), session.get("subject"),
               tuple(sorted(session.get("type", []))),
               tuple(sorted(session.get("teachers", []))) if session.get("teachers") else (),
               tuple(sorted(session.get("rooms", []))) if session.get("rooms") else (),
               session.get("weekly_frequency"), session.get("biweekly_frequency"))
        groups.setdefault(key, []).append(session)
    common = []
    one_week = []
    for group in groups.values():
        week_types = {s.get("week_type") for s in group}
        if len(week_types) == 2:
            # Դասը տեղի ունի երկու շաբաթում՝ common session
            # Համոզվենք, որ չորրորդ (հայտարարիչ) գրառում կարելի է ընտրել որպես ներկայացուցիչ:
            # (և մենք պահպանում ենք, որ պետք է նույն slot–ը լինի երկու շաբաթներում)
            common.extend(group)
        else:
            one_week.extend(group)
    return common, one_week

def main():
    # Կարդում ենք տվյալները (հիմնականում JSON ֆայլը, այստեղ պարզապես օգտագործենք data փոփոխական՝ օրինակ)
    with open("schedule_with_week_type.json", encoding="utf-8") as f:
        data = json.load(f)
    
    # Խումբավորում ըստ այն բանալիի, որը չի ներառում week_type–ը:
    common_sessions, one_week_sessions = group_sessions_by_common_key(data)
    
    print("Համընդհանուր դասերի քանակ՝", len(common_sessions))
    print("Մի շաբաթվա դասերի քանակ՝", len(one_week_sessions))
    
    # Ստեղծենք երկու շաբաթների ժամանակացույցի grid:
    schedule_week1 = initialize_schedule()
    schedule_week2 = initialize_schedule()
    
    # 1. Հիշենք՝ common sessions–ը պետք է տեղադրվեն նույն slot–ում երկու շաբաթում:
    for session in common_sessions:
        # Այս դաշտերը պետք է առանձին ընտրվեն:
        slot = find_free_slot(schedule_week1, session)
        if slot is None:
            print("Չհնարավոր է տեղադրել համընդհանուր դասը՝", session)
        else:
            # Ավելացնում ենք նույն slot երկու շաբաթում:
            schedule_week1[slot].append(session)
            schedule_week2[slot].append(session)
            session["assigned_slot"] = slot
    
    # 2. Հանձնել մի շաբաթվա դասերը:
    # Վերլուծենք մեկ շաբաթվա դասերը ըստ week_type:
    sessions_week1 = [s for s in one_week_sessions if s.get("week_type") == 1]
    sessions_week2 = [s for s in one_week_sessions if s.get("week_type") == 2]
    
    # Հարմար slot–ներ մեկ շաբաթում:
    for session in sessions_week1:
        slot = find_free_slot(schedule_week1, session)
        if slot is None:
            print("Չհնարավոր է տեղադրել 1-ին շաբաթվա դասը՝", session)
        else:
            schedule_week1[slot].append(session)
            session["assigned_slot"] = slot
    for session in sessions_week2:
        slot = find_free_slot(schedule_week2, session)
        if slot is None:
            print("Չհնարավոր է տեղադրել 2-րդ շաբաթվա դասը՝", session)
        else:
            schedule_week2[slot].append(session)
            session["assigned_slot"] = slot

    # Արդյունքների տպում՝ օրերով եւ ժամերով (սորտավորելով):
    def print_schedule(schedule, week):
        print(f"\nԺամանակացույց, շաբաթ {week}:")
        for day in DAYS:
            for time in TIMES:
                slot = (day, time)
                sessions = schedule[slot]
                if sessions:
                    print(f"Օր {day}, Ժամ {time}:")
                    for s in sessions:
                        print(f"  {s['course']} - {s['subject']} ({', '.join(s['type'])})")
    
    print_schedule(schedule_week1, 1)
    print_schedule(schedule_week2, 2)
    
    schedule_week1_str_keys = convert_schedule_keys(schedule_week1)
    schedule_week2_str_keys = convert_schedule_keys(schedule_week2)

    # Հիմա կարող ենք պահպանել time schedule–ը JSON–ում:
    with open("final_schedule_week1.json", "w", encoding="utf-8") as f1, \
         open("final_schedule_week2.json", "w", encoding="utf-8") as f2:
        json.dump(schedule_week1_str_keys, f1, ensure_ascii=False, indent=4)
        json.dump(schedule_week2_str_keys, f2, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    main()
