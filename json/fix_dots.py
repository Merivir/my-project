# Բացում ենք ֆայլը և կարդում պարունակությունը
with open("dots.txt", "r", encoding="utf-8") as file:
    lines = file.readlines()

# Փոփոխում ենք տվյալները՝ ավելացնելով վերջակետ անհրաժեշտ բառերից հետո
fixed_lines = []
for line in lines:
    line = line.rstrip()  # Հեռացնում ենք ավելորդ բացատները
    
    if line.startswith(" Առարկա: "):
        line = line.replace(" Առարկա: ", "Առարկա։ ", 1)
    if line.startswith(" Դասի տեսակ: "):
        line = line.replace(" Դասի տեսակ: ", "Դասի տեսակ։ ", 1)
    if line.startswith(" Դասախոս: "):
        line = line.replace(" Դասախոս: ", "Դասախոս։ ", 1)
    if line.startswith(" Լսարան: "):
        line = line.replace(" Լսարան: ", "Լսարան։ ", 1)
    
    fixed_lines.append(line)

# Արդյունքը պահում ենք նոր ֆայլում
with open("dots_fixed.txt", "w", encoding="utf-8") as file:
    file.write("\n".join(fixed_lines))

print("Փոփոխված ֆայլը ստեղծվել է `dots_fixed.txt` անունով։")
