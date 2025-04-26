import pyodbc
import json
from collections import defaultdict

def extract_building_floor(room_number):
    """ Վերադարձնում է մասնաշենք/հարկ key լսարանի համարից """
    if not room_number:
        return "special"
    
    digits = ''.join(filter(str.isdigit, room_number))
    
    if len(digits) >= 5:
        return digits[:3]  # 5 նիշանոցների համար
    elif len(digits) >= 4:
        return digits[:2]  # 4 նիշանոցների համար
    else:
        return "special"  # մնացած դեպքերը

# 1. MSSQL Connection
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=schedule;"
    "UID=admin;"
    "PWD=mypassword"
)
cursor = conn.cursor()

# 2. SQL հարցում
cursor.execute("""
SELECT room_number, type_name
FROM (
    SELECT 
        r.number AS room_number,
        ty.name AS type_name
    FROM Schedule s
    JOIN Rooms r ON s.room_id = r.id
    JOIN Types ty ON s.type_id = ty.id
) AS sub
GROUP BY room_number, type_name
""")
rows = cursor.fetchall()

# 3. Պատրաստում ենք raw data
data = [{"room_number": row.room_number, "type_name": row.type_name} for row in rows]

# 4. Պատրաստում ենք Դաս / Գործ / Լաբ բաժանումը
categories = {
    "Դաս": defaultdict(set),
    "Գործ": defaultdict(set),
    "Լաբ": defaultdict(set)
}

for entry in data:
    room = entry["room_number"]
    typ = entry["type_name"]
    key = extract_building_floor(room)
    
    if any(word in typ for word in ["Լաբ", "Լաբ1", "Լաբ2", "Լաբ3", "Լաբ4", "Լաբ5"]):
        categories["Լաբ"][key].add(room)
    elif any(word in typ for word in ["Գործ", "Գործ1", "Գործ2", "Գործ3", "Գործ4", "Գործ5"]):
        categories["Գործ"][key].add(room)
    elif "Դաս" in typ:
        categories["Դաս"][key].add(room)

# 5. Փոխակերպում set-երը list-ի և սորտավորում
final_categories = {}
for cat, floors in categories.items():
    final_categories[cat] = {}
    for floor, rooms in floors.items():
        final_categories[cat][floor] = sorted(list(rooms))

# 6. Ավարտ․ գրում ենք JSON ֆայլ
with open("rooms_grouped_unique.json", "w", encoding="utf-8") as f:
    json.dump(final_categories, f, ensure_ascii=False, indent=2)

print("✅ JSON ֆայլը պատրաստ է։")
