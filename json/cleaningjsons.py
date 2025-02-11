import json
import pandas as pd

# Имя файла с исходным расписанием
input_filename = "updated_witheverything.json"

# Загрузка данных из JSON
with open(input_filename, "r", encoding="utf-8") as f:
    data = json.load(f)

# Если нужно убрать поля, не нужные для создания узлов (например, schedule_times и type_of_week)
for lesson in data:
    lesson.pop("schedule_times", None)
    lesson.pop("type_of_week", None)

# Преобразуем данные в DataFrame для удобного анализа
df = pd.DataFrame(data)

# Выведем первые несколько записей для проверки
print("Первые 5 строк DataFrame:")
print(df.head(), "\n")

# Выведем общую информацию по столбцам
print("Информация о DataFrame:")
print(df.info(), "\n")

# Выведем сводную статистику по строкам (учитывая, что данные строковые – можно указать include='all')
print("Сводная статистика по данным:")
print(df.describe(include="all"), "\n")

# Пример группировки по курсу
course_groups = df.groupby("course").size().reset_index(name="count")
print("Количество уроков по курсам:")
print(course_groups, "\n")

# Пример группировки по предмету
subject_groups = df.groupby("subject").size().reset_index(name="count")
print("Количество уроков по предметам:")
print(subject_groups, "\n")

# Можно также изучить распределение по частотам (weekly_frequency и biweekly_frequency)
freq_groups = df.groupby(["weekly_frequency", "biweekly_frequency"]).size().reset_index(name="count")
print("Распределение по weekly_frequency и biweekly_frequency:")
print(freq_groups, "\n")

# Если нужно сохранить очищенные данные для дальнейшей работы (например, для создания узлов)
output_filename = "updated_everything.json"
with open(output_filename, "w", encoding="utf-8") as f_out:
    json.dump(data, f_out, ensure_ascii=False, indent=4)

print("Очищенные данные записаны в", output_filename)
