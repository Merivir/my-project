import json
import re

# File paths
file_path = "DataSchedule.txt"
output_path = "class_schedule.json"

# Mapping of course levels (based on the first digit of the course number)
course_levels = {
    "4": "Առաջին",
    "3": "Երկրորդ",
    "2": "Երրորդ",
    "1": "Չորրորդ"
}

# Temporary storage variables
schedule = []
current_course = None
current_level = ""
current_subject = None    # current subject
last_subject = None       # last encountered subject (for fallback if needed)
current_type = ""
current_teachers = []
current_rooms = []

def flush_record():
    """
    Saves the current record (if both a course and subject exist) into the schedule list,
    then resets the temporary subject-related fields.
    """
    global current_course, current_level, current_subject, current_type, current_teachers, current_rooms
    if current_course and current_subject:
        record = {
            "level": current_level,
            "course": current_course,
            "subject": current_subject,
            "type": current_type,
            "teachers": current_teachers,
            "rooms": current_rooms
        }
        schedule.append(record)
    # Reset subject-related fields
    current_subject = None
    current_type = ""
    current_teachers = []
    current_rooms = []
    return

def split_line(line, delimiter1=":", delimiter2="։"):
    """
    Splits the line using delimiter1 if it is present; otherwise uses delimiter2.
    Returns the part after the delimiter if found, else returns an empty string.
    """
    if delimiter1 in line:
        return line.split(delimiter1, 1)[1].strip()
    elif delimiter2 in line:
        return line.split(delimiter2, 1)[1].strip()
    else:
        return ""

with open(file_path, "r", encoding="utf-8") as file:
    for line in file:
        line = line.strip()
        if not line:
            continue

        # Check if the line matches a course code (e.g., "ՄԹ440" or "Լ125")
        course_match = re.match(r"^[Ա-Ֆ]{1,3}\d{3,4}$", line)
        if course_match:
            # Flush any pending record for the previous course
            if current_course is not None and current_subject:
                flush_record()
            # New course encountered.
            current_course = line
            digits = re.search(r"\d+", line)
            if digits:
                first_digit = digits.group()[0]
                current_level = course_levels.get(first_digit, "")
            else:
                current_level = ""
            # Reset subject-related fields for the new course.
            current_subject = None
            last_subject = None
            current_type = ""
            current_teachers = []
            current_rooms = []
            continue

        # Process subject line
        if line.startswith("Առարկա:") or line.startswith("Առարկա։"):
            if current_subject:
                flush_record()
            current_subject = split_line(line, ":", "։")
            last_subject = current_subject
            continue

        # Process type line
        if line.startswith("Դասի տեսակ:") or line.startswith("Դասի տեսակ։"):
            current_type = split_line(line, ":", "։")
            continue

        # Process teacher line
        if line.startswith("Դասախոս:") or line.startswith("Դասախոս։"):
            teachers_str = split_line(line, ":", "։")
            current_teachers = [t.strip() for t in teachers_str.split(",") if t.strip()]
            continue

        # Process room line
        if line.startswith("Լսարան:") or line.startswith("Լսարան։"):
            rooms_str = split_line(line, ":", "։")
            current_rooms = [r.strip() for r in rooms_str.split(",") if r.strip()]
            # Do not use a fallback for subject here
            flush_record()
            continue

# Flush any pending record at the end of the file.
if current_course and current_subject:
    flush_record()

# Save the schedule to a JSON file.
with open(output_path, "w", encoding="utf-8") as json_file:
    json.dump(schedule, json_file, ensure_ascii=False, indent=4)

print(f"✅ JSON ֆայլը հաջողությամբ ստեղծվեց: {output_path}")
