import json
import networkx as nx

# Մարմինային տիպերի բառարանը՝ պատկանում է մեր դիցի կարգավորումին
TYPE_MAP = {
    "Դաս": "lecture",
    "Գործ": "work",     # առանց համարը (համեմատաբար խառնել չկան)
    "Գործ1": "work1",
    "Գործ2": "work2",
    "Գործ3": "work3",
    "Լաբ1": "lab1",
    "Լաբ2": "lab2",
    "Լաբ3": "lab3",
    "Լաբ4": "lab4"
}

# Հնարավոր անհամատեղելի խմբերը՝
# work1 հակառակ lab1, lab2 և work1
# work2 հակառակ lab2, lab3 և work2
# work3 հակառակ lab3, lab4 և work3
CONFLICTS = {
    "work1": {"lab1", "lab2", "work1"},
    "work2": {"lab2", "lab3", "work2"},
    "work3": {"lab3", "lab4", "work3"},
    "lab1": {"work1"},
    "lab2": {"work1", "work2"},
    "lab3": {"work2", "work3"},
    "lab4": {"work3"}
}

def build_graph(data):
    """
    Ստեղծում է գրաֆ, որտեղ յուրաքանչյուր գրառում ստանդարտ նոդ է,
    և ավելացնում է լրացուցիչ հատկություն՝ mapped_type՝ որը ստանում է TYPE_MAP-ի միջոցով:
    """
    G = nx.Graph()
    for i, entry in enumerate(data):
        # Ենթադրում ենք, որ entry–ն ունի 'level', 'course', 'subject', 'type' (լիստ), 'teachers', 'rooms',
        # 'weekly_frequency' և 'biweekly_frequency' բանալիները:
        raw_type = entry["type"][0] if entry.get("type") and entry["type"] else "N/A"
        mapped_type = TYPE_MAP.get(raw_type, raw_type)
        # Ավելացնում ենք նոդը և ավելացնում ենք mapped_type-ը:
        G.add_node(i, **entry, mapped_type=mapped_type)
    
    n = len(data)
    # Ավելացնում ենք գրաֆի եռքները, երբ որևէ երկու նոդերի միջև կոնֆլիկտ կա:
    for i in range(n):
        for j in range(i + 1, n):
            node1 = G.nodes[i]
            node2 = G.nodes[j]
            conflict = False

            # 1. Դասախոսների կոնֆլիկտ (հիմնվում է, թե արդյոք դասախոսները համընկնում են)
            if set(node1.get("teachers", [])) & set(node2.get("teachers", [])):
                conflict = True

            # 2. Լսարանների կոնֆլիկտ (համընկնում են լսարանները)
            if set(node1.get("rooms", [])) & set(node2.get("rooms", [])):
                conflict = True

            # 3. Տիպերի կոնֆլիկտ, թե ինչպես ենք վերագրում mapped_type-ը
            type1 = node1.get("mapped_type", "")
            type2 = node2.get("mapped_type", "")

            # Եթե երկուսն էլ դաս (lecture) են, ապա կոնֆլիկտ անորոշ:
            if type1 == "lecture" and type2 == "lecture":
                conflict = True
            else:
                # Եթե երկուսն էլ զնված են որպես unnumbered work ("work") 
                # ապա կոնֆլիկտ սահմանված տիպով չեն հակամարտում:
                if type1 == "work" and type2 == "work":
                    pass
                else:
                    # Նույն տիպերի (work1, work2, work3, lab1, lab2, lab3, lab4) հակամարտությունը:
                    if type1 in CONFLICTS:
                        if type2 in CONFLICTS[type1]:
                            conflict = True
                    if type2 in CONFLICTS:
                        if type1 in CONFLICTS[type2]:
                            conflict = True

            if conflict:
                G.add_edge(i, j)
    return G

def color_graph(G):
    """
    Օգտագործում է գրաֆի գրիելի պլաու (greedy) ալգորիթմ՝՝ հնարավորինս նվազեցնել կոնֆլիկտները:
    """
    coloring = nx.coloring.greedy_color(G, strategy="largest_first")
    for node, color in coloring.items():
        G.nodes[node]["time_slot"] = color
    return G

def detect_conflicts(G):
    """
    Ստուգում է կոնֆլիկտները, որ երկու նոդեր նույն time_slot ունեն:
    """
    conflicts = []
    for i, j in G.edges():
        if G.nodes[i]["time_slot"] == G.nodes[j]["time_slot"]:
            conflicts.append({
                "course1": G.nodes[i].get("course", ""),
                "subject1": G.nodes[i].get("subject", "N/A"),
                "course2": G.nodes[j].get("course", ""),
                "subject2": G.nodes[j].get("subject", "N/A"),
                "issue": "Time slot conflict"
            })
    return conflicts

def schedule_from_colored_graph(G):
    """
    Պարբերաբար վերափոխում է գրաֆի տվյալները,՝ ձևավորելով վերջնական դասացուցակ,
    ներառումով շաբաթի օր, ժամային սլոտ, և շաբաթական/երկուսյուն փոփոխականություն:
    """
    schedule = []
    for node, data in G.nodes(data=True):
        time_slot = data["time_slot"]
        # Կատարում ենք մի պարզ հաշվարկ՝, օրինակ՝ օգտագործում ենք modulo տարբեր թվերի համար
        week_type = data.get("biweekly_frequency", 1) if data.get("biweekly_frequency", 1) == 2 else data.get("weekly_frequency", 1)
        day_of_week = (time_slot % 5) + 1    # 1-5 օրերի համար
        time_of_day = (time_slot % 4) + 1     # 1-4 ժամային սլոտներ
        schedule.append({
            "level": data.get("level", ""),
            "course": data.get("course", ""),
            "subject": data.get("subject", "N/A"),
            "type": data.get("type", []),
            "teachers": data.get("teachers", []),
            "rooms": data.get("rooms", []),
            "week_type": week_type,
            "day_of_week": day_of_week,
            "time_of_day": time_of_day
        })
    return schedule

if __name__ == "__main__":
    with open("updated_everything.json", "r", encoding="utf-8") as f:
        sample_data = json.load(f)
    
    G = build_graph(sample_data)
    G = color_graph(G)
    conflicts = detect_conflicts(G)
    final_schedule = schedule_from_colored_graph(G)
    
    with open("final_schedule.json", "w", encoding="utf-8") as f:
        json.dump(final_schedule, f, ensure_ascii=False, indent=4)
    
    with open("conflicts.json", "w", encoding="utf-8") as f:
        json.dump(conflicts, f, ensure_ascii=False, indent=4)
    
    print("Расписание успешно сформировано с минимальными конфликтами! 🎨")
    if conflicts:
        print("\nОбнаружены конфликты:")
        print(json.dumps(conflicts, ensure_ascii=False, indent=4))
