import json

def normalize_types(types):
    """
    Եթե `types`-ը սխալ ֆորմատով է ("Լաբ1, Լաբ3"), բաժանում է այն ճիշտ ցուցակի։
    """
    if isinstance(types, list):
        split_types = []
        for t in types:
            split_types.extend([x.strip() for x in t.split(",")])
        return split_types
    return types

def split_schedule_times(input_data):
    transformed_data = []
    
    for entry in input_data:
        level = entry["level"]
        course = entry["course"]
        subject = entry["subject"]
        types = normalize_types(entry.get("type", ["Անորոշ"]))  # Բաժանում ենք type-ը
        teachers = entry.get("teachers", ["Անորոշ"]) if entry.get("teachers") else ["Անորոշ"]
        rooms = entry.get("rooms", ["Անորոշ"]) if entry.get("rooms") else ["Անորոշ"]
        weekly_frequency = entry.get("weekly_frequency", 1)
        biweekly_frequency = entry.get("biweekly_frequency", 1)
        type_of_week = entry.get("type_of_week", 0)
        schedule_times = entry.get("schedule_times", [])

        # Պարզում ենք ամենաերկար ցուցակը
        max_length = max(len(types), len(teachers), len(rooms))

        # Բաժանում ենք յուրաքանչյուր դաս առանձին
        for i in range(max_length):
            for schedule in schedule_times:
                transformed_entry = {
                    "level": level,
                    "course": course,
                    "subject": subject,
                    "type": [types[i % len(types)]],  
                    "teachers": [teachers[i % len(teachers)]],
                    "rooms": [rooms[i % len(rooms)]],
                    "weekly_frequency": 1,  # Ամեն դասի համար դարձնում ենք 1
                    "biweekly_frequency": biweekly_frequency,
                    "type_of_week": type_of_week,
                    "schedule_times": [schedule]  # Յուրաքանչյուր դաս առանձին է
                }
                transformed_data.append(transformed_entry)

    return transformed_data


# ✅ Ստուգում ենք, որ thematic_transformed.json ֆայլը կա
input_file = "thematic_transformed.json"
output_file = "thematic.json"

# Կարդում ենք տվյալները JSON ֆայլից
with open(input_file, "r", encoding="utf-8") as f:
    input_data = json.load(f)

# Վերափոխում ենք տվյալները
transformed_data = split_schedule_times(input_data)

# ✅ Ստուգում ենք, որ տվյալներ կան նախքան գրելը
if transformed_data:
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(transformed_data, f, ensure_ascii=False, indent=4)
    print(f"✅ Վերափոխված տվյալները հաջողությամբ պահվեցին '{output_file}' ֆայլում!")
else:
    print(f"❌ '{output_file}' ֆայլը չստեղծվեց, քանի որ տվյալներ չկան։")
