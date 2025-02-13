const daysOfWeek = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
const timeSlots = ["I", "II", "III", "IV"];
let selectedTimeslots = [];
let isConfirmed = false;

document.addEventListener("DOMContentLoaded", () => {
    loadTeachers();
    generateTimeSlotCheckboxes("primarySlotsContainer");
    generateTimeSlotCheckboxes("backupSlotsContainer");
});

async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers');
        if (!response.ok) throw new Error("⚠️ Server Error: " + response.status);

        const teachers = await response.json();
        const teacherSelect = document.getElementById("teacherSelect");

        teacherSelect.innerHTML = '<option value="">Ընտրել դասախոս</option>';
        teachers.forEach(teacher => {
            const option = document.createElement("option");
            option.value = teacher.id;
            option.textContent = teacher.name;
            teacherSelect.appendChild(option);
        });

        teacherSelect.addEventListener("change", () => {
            toggleCheckboxes(true);
        });

    } catch (error) {
        console.error("⛔ Error loading teachers:", error);
    }
}

// Ստեղծում ենք checkbox-ները (սկզբում անաշխատունակ)
function generateTimeSlotCheckboxes(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const table = document.createElement("table");
    table.classList.add("schedule-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = "<th></th>" + timeSlots.map(slot => `<th>${slot}</th>`).join("");
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    daysOfWeek.forEach((day, dayIndex) => {
        const row = document.createElement("tr");

        const dayLabel = document.createElement("td");
        dayLabel.textContent = day;
        row.appendChild(dayLabel);

        timeSlots.forEach((_, slotIndex) => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("time-slot-checkbox");
            checkbox.name = `${containerId}_slots`;
            checkbox.value = `${dayIndex + 1}-${slotIndex + 1}`;
            checkbox.disabled = true; // Սկզբում անաշխատունակ

            const cell = document.createElement("td");
            cell.appendChild(checkbox);
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

// Թույլատրում ենք checkbox-ները դասախոսի ընտրությունից հետո
function toggleCheckboxes(enable) {
    document.querySelectorAll(".time-slot-checkbox").forEach(checkbox => {
        checkbox.disabled = !enable;
    });
}
