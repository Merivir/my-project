import pyodbc
import json
from collections import defaultdict

def extract_building_floor(room_number):
    """ Վերադարձնում է մասնաշենք/հարկ key լսարանի համարից """
    if not room_number:
        return "special"
    
    digits = ''.join(filter(str.isdigit, room_number))
    
    if len(digits) >= 5:
        return digits[:3]  # առաջին 3 թիվը
    elif len(digits) >= 4:
        return digits[:2]  # առաջին 2 թիվը
    else:
        return "special"  # եթե շատ փոքր կամ տառեր ունի

# 🛠️ 1. MSSQL Connection
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=schedule;"
    "UID=admin;"
    "PWD=mypassword"
)
cursor = conn.cursor()

# 🛠️ 2. SQL հարցում
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

# 🛠️ 3. Պատրաստում ենք raw data
data = [{"room_number": row.room_number, "type_name": row.type_name} for row in rows]

# 🛠️ 4. Պատրաստում ենք Դաս / Գործ / Լաբ բաժանումը
categories = {
    "Դաս": defaultdict(list),
    "Գործ": defaultdict(list),
    "Լաբ": defaultdict(list)
}

for entry in data:
    room = entry["room_number"]
    typ = entry["type_name"]
    key = extract_building_floor(room)
    
    if any(word in typ for word in ["Լաբ", "Լաբ1", "Լաբ2", "Լաբ3", "Լաբ4", "Լաբ5"]):
        categories["Լաբ"][key].append(room)
    elif any(word in typ for word in ["Գործ", "Գործ1", "Գործ2", "Գործ3", "Գործ4", "Գործ5"]):
        categories["Գործ"][key].append(room)
    elif "Դաս" in typ:
        categories["Դաս"][key].append(room)

# 🛠️ 5. Ավարտ․ գրում ենք JSON ֆայլ
with open("rooms_grouped_by_floor.json", "w", encoding="utf-8") as f:
    json.dump(categories, f, ensure_ascii=False, indent=2)

print("✅ JSON ֆայլը պատրաստ է։")
