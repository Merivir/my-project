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
        const response = await fetch('/api/teachers'); // Կանչում է backend API-ն
        if (!response.ok) throw new Error("⚠️ Server Error: " + response.status);

        const teachers = await response.json();
        const teacherSelect = document.getElementById("teacherSelect");

        // Մաքրում ենք dropdown-ը և ավելացնում ենք "Ընտրել դասախոս"
        teacherSelect.innerHTML = '<option value="">Ընտրել դասախոս</option>';
        
        // Ավելացնում ենք բոլոր դասախոսներին ընտրացանկում
        teachers.forEach(teacher => {
            const option = document.createElement("option");
            option.value = teacher.id;
            option.textContent = teacher.name;
            teacherSelect.appendChild(option);
        });

        // Դասախոսի ընտրության դեպքում թույլատրում ենք checkbox-ները
        teacherSelect.addEventListener("change", () => {
            toggleCheckboxes(true);
        });

    } catch (error) {
        console.error("⛔ Error loading teachers:", error);
    }
}

// Կանչում ենք `loadTeachers()`, երբ էջը բեռնվում է
document.addEventListener("DOMContentLoaded", () => {
    loadTeachers();
});


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

// Հաստատում ենք ընտրված դասաժամերը
function confirmAvailability() {
    const checkedSlots = Array.from(document.querySelectorAll(".time-slot-checkbox:checked"))
        .map(checkbox => checkbox.value);

    if (checkedSlots.length === 0) {
        alert("⚠️ Խնդրում ենք ընտրել առնվազն մեկ դասաժամ:");
        return;
    }

    isConfirmed = true;
    document.getElementById("generateSchedule").disabled = false;
    alert("✅ Ժամերը հաստատված են!");
}

// Ստեղծում ենք դասացուցակը
function generateSchedule() {
    if (!isConfirmed) {
        alert("⚠️ Խնդրում ենք նախ հաստատել ժամերը:");
        return;
    }

    alert("📅 Դասացուցակը ստեղծվեց!");
}
