import json

def convert_type_to_list(json_data):
    """
    JSON-ում `type`-ը դարձնում է list (զանգված), եթե այն դեռ չի հանդիսանում։
    """
    for entry in json_data:
        if "type" in entry and not isinstance(entry["type"], list):
            entry["type"] = [entry["type"]]  # Վերածում ենք list-ի
    
    return json_data

# Կարդում ենք JSON ֆայլը
with open("updated_everything.json", "r", encoding="utf-8") as file:
    schedule_data = json.load(file)

# Թարմացնում ենք տվյալները
updated_schedule = convert_type_to_list(schedule_data)

# Պահպանում ենք նորացված JSON-ը
with open("updated_witheverything.json", "w", encoding="utf-8") as file:
    json.dump(updated_schedule, file, ensure_ascii=False, indent=4)

print("✅ JSON ֆայլը թարմացվեց՝ `type`-ը դարձավ list, եթե այն դեռ չկար որպես ցանկ։")
