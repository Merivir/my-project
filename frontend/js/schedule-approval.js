// Ստանում ենք role-ը URL-ով կամ localStorage-ից
function getUserRoleFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("role") || localStorage.getItem("userRole") || "guest";
}

const userRole = getUserRoleFromURL();
const isAdmin = userRole === "admin";

document.addEventListener("DOMContentLoaded", function () {
    fetch("/schedule_approval")
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                document.querySelector("#scheduleBody").innerHTML =
                    "<tr><td colspan='8' style='text-align:center;'>📢 Տվյալներ չկան</td></tr>";
                return;
            }

            renderSchedule(data);
        })
        .catch(error => console.error("Error fetching schedule approval data:", error));

    if (isAdmin) {
        document.getElementById("confirmBtn")?.addEventListener("click", function () {
            alert("Դասացուցակը հաստատված է!");
            window.location.href = "/guest";
        });

        document.getElementById("rejectBtn")?.addEventListener("click", function () {
            const confirmReject = confirm("Համոզվա՞ծ եք, որ ցանկանում եք հրաժարվել։");
            if (confirmReject) {
                window.location.href = "/admin-dashboard";
            }
        });
    } else {
        document.getElementById("confirmBtn")?.remove();
        document.getElementById("rejectBtn")?.remove();
    }
});

function renderSchedule(data) {
    const container = document.getElementById("scheduleContainer");
    if (!container) return console.error("📛 scheduleContainer not found");
    container.innerHTML = "";

    const grouped = {};
    const dualWeekLessons = new Map();

    data.forEach(item => {
        const course = item.course;
        const weekType = item.week_type;
        const targetWeekTypes = weekType === "երկուսն էլ" ? ["համարիչ", "հայտարար"] : [weekType];

        targetWeekTypes.forEach(type => {
            if (!grouped[course]) grouped[course] = {};
            if (!grouped[course][type]) grouped[course][type] = [];
            grouped[course][type].push({ ...item, originalWeekType: weekType });
        });
    });

    const days = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
    const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];

    for (const [course, weekTypes] of Object.entries(grouped)) {
        const courseTitle = document.createElement("h2");
        courseTitle.textContent = `📘 ${course}`;
        container.appendChild(courseTitle);

        for (const [weekType, lessons] of Object.entries(weekTypes)) {
            const weekTitle = document.createElement("h3");
            weekTitle.textContent = `🕓 Շաբաթվա տեսակ՝ ${weekType}`;
            container.appendChild(weekTitle);

            const table = document.createElement("table");
            table.classList.add("schedule-table");

            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            headerRow.innerHTML = "<th>Ժամ</th>" + days.map(day => `<th>${day}</th>`).join("");
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            timeSlots.forEach(slot => {
                const row = document.createElement("tr");
                const timeCell = document.createElement("td");
                timeCell.textContent = slot;
                row.appendChild(timeCell);

                days.forEach(day => {
                    const cell = document.createElement("td");
                    cell.id = `cell-${day}-${slot}-${course}-${weekType}`;
                    cell.classList.add("dropzone");
                    cell.dataset.day = day;
                    cell.dataset.slot = slot;

                    if (isAdmin) {
                        cell.addEventListener("dragover", e => e.preventDefault());
                        cell.addEventListener("drop", handleDrop);
                    }

                    const matchingLessons = lessons.filter(l => l.day === day && l.time_slot === slot);
                    matchingLessons.forEach(lesson => {
                        const div = document.createElement("div");
                        div.classList.add("class-block");
                        div.draggable = isAdmin;
                        div.innerHTML = `<strong>${lesson.subject}</strong>, ${lesson.class_type}, ${lesson.room}, ${lesson.teacher}`;
                        div.dataset.id = lesson.id;
                        div.dataset.day = day;
                        div.dataset.slot = slot;
                        div.dataset.course = course;
                        div.dataset.week = weekType;
                        div.dataset.originalWeek = lesson.originalWeekType || weekType;

                        if (isAdmin) {
                            div.addEventListener("dragstart", handleDragStart);
                        }

                        cell.appendChild(div);

                        if (lesson.originalWeekType === "երկուսն էլ") {
                            if (!dualWeekLessons.has(lesson.id)) dualWeekLessons.set(lesson.id, []);
                            dualWeekLessons.get(lesson.id).push(div);
                        }
                    });

                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);
        }
    }

    window._dualWeekLessonsMap = dualWeekLessons;
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = "move";
}

async function handleDrop(e) {
    e.preventDefault();

    if (draggedElement?.dataset.originalWeek === "երկուսն էլ" && draggedElement.dataset.week !== "համարիչ") {
        alert("«Երկուսն էլ» դասերը կարող եք տեղափոխել միայն համարիչ աղյուսակից:");
        return;
    }

    if (!draggedElement || this.contains(draggedElement)) return;

    const newDay = this.dataset.day;
    const newSlot = this.dataset.slot;

    draggedElement.dataset.day = newDay;
    draggedElement.dataset.slot = newSlot;
    draggedElement.classList.add("modified");
    this.appendChild(draggedElement);

    const id = draggedElement.dataset.id;
    if (window._dualWeekLessonsMap?.has(id)) {
        const related = window._dualWeekLessonsMap.get(id);
        related.forEach(copy => {
            copy.dataset.day = newDay;
            copy.dataset.slot = newSlot;
            copy.textContent = draggedElement.textContent;
            copy.classList.add("modified");

            const cellId = `cell-${newDay}-${newSlot}-${copy.dataset.course}-${copy.dataset.week}`;
            const cell = document.getElementById(cellId);
            if (cell && copy.parentNode !== cell) {
                copy.parentNode?.removeChild(copy);
                cell.appendChild(copy);
            }
        });
    }

    const payload = {
        id,
        new_day: newDay,
        new_slot: newSlot,
        course: draggedElement.dataset.course,
        week_type: draggedElement.dataset.originalWeek || draggedElement.dataset.week
    };

    try {
        const res = await fetch("/api/schedule/update-positions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([payload])
        });

        const result = await res.json();
        if (!res.ok) {
            alert("❌ Չհաջողվեց պահպանել դիրքը");
            console.error(result);
        } else {
            const fresh = await fetch("/schedule_approval");
            const updated = await fresh.json();
            renderSchedule(updated);
        }
    } catch (err) {
        console.error("❌ Error during auto-save:", err);
    }
}

function collectModifiedLessons() {
    return Array.from(document.querySelectorAll(".class-block.modified")).map(el => ({
        id: el.dataset.id,
        new_day: el.dataset.day,
        new_slot: el.dataset.slot,
        course: el.dataset.course,
        week_type: el.dataset.originalWeek || el.dataset.week
    }));
}
