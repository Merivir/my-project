import json

def add_frequency_fields(json_data):
    """
    JSON-ում ավելացնում է weekly_frequency և biweekly_frequency դաշտերը՝ նախնական արժեքներով։
    """
    for entry in json_data:
        entry["weekly_frequency"] = 1  # Առ默认 մեկ անգամ շաբաթվա մեջ
        entry["biweekly_frequency"] = 2  # Առ默认 երկու շաբաթվա մեջ երկու անգամ
    
    return json_data

# Ֆայլից կարդալ JSON-ը
with open("class_schedule.json", "r", encoding="utf-8") as file:
    schedule_data = json.load(file)

# Մշակում ենք
updated_schedule = add_frequency_fields(schedule_data)

# Պահպանում ենք նորացված JSON-ը
with open("updated_schedule.json", "w", encoding="utf-8") as file:
    json.dump(updated_schedule, file, ensure_ascii=False, indent=4)

print("✅ JSON ֆայլը թարմացվեց՝ ավելացված `weekly_frequency` և `biweekly_frequency` դաշտերով։")
