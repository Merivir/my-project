import json
import networkx as nx

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

def build_graph(data):
    """
    Создает граф, где вершины - занятия, а рёбра - конфликты (общий преподаватель, аудитория, тип занятия).
    """
    G = nx.Graph()
    
    # Добавляем вершины
    for i, entry in enumerate(data):
        G.add_node(i, **entry)
    
    # Добавляем рёбра между конфликтующими занятиями
    for i in range(len(data)):
        for j in range(i + 1, len(data)):
            entry1, entry2 = data[i], data[j]
            
            # Проверяем пересечения по преподавателям, аудиториям или типам занятий
            if (set(entry1["teachers"]) & set(entry2["teachers"]) or
                set(entry1["rooms"]) & set(entry2["rooms"]) or
                set(TYPE_MAP.get(t, t) for t in entry1["type"]) & CONFLICTS.get(TYPE_MAP.get(entry2["type"][0], entry2["type"][0]), set())):
                G.add_edge(i, j)
    
    return G

def color_graph(G):
    """
    Применяет алгоритм раскраски графа (жадный подход), чтобы минимизировать конфликты.
    """
    coloring = nx.coloring.greedy_color(G, strategy="largest_first")
    
    # Записываем результат обратно в граф
    for node, color in coloring.items():
        G.nodes[node]["time_slot"] = color
    
    return G

def detect_conflicts(G):
    """
    Проверяет наличие конфликтов после раскраски графа.
    """
    conflicts = []
    
    for i, j in G.edges():
        if G.nodes[i]["time_slot"] == G.nodes[j]["time_slot"]:
            conflicts.append({
                "course1": G.nodes[i]["course"],
                "subject1": G.nodes[i]["subject"],
                "course2": G.nodes[j]["course"],
                "subject2": G.nodes[j]["subject"],
                "issue": "Time slot conflict"
            })
    
    return conflicts

def schedule_from_colored_graph(G):
    """
    Преобразует раскрашенный граф обратно в расписание с указанием недели, дня и времени.
    """
    schedule = []
    
    for node, data in G.nodes(data=True):
        time_slot = data["time_slot"]
        week_type = data["biweekly_frequency"] if data["biweekly_frequency"] == 2 else data["weekly_frequency"]
        day_of_week = (time_slot % 5) + 1  # Дни недели (1-5)
        time_of_day = (time_slot % 4) + 1  # Временные слоты (1-4)
        
        schedule.append({
            "level": data["level"],
            "course": data["course"],
            "subject": data["subject"],
            "type": data["type"],
            "teachers": data["teachers"],
            "rooms": data["rooms"],
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