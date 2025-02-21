const daysOfWeek = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
const timeSlots = ["I", "II", "III", "IV"];
let isConfirmed = false;

document.addEventListener("DOMContentLoaded", () => {
    loadTeachers();
    generateTimeSlotCheckboxes("primarySlotsContainer");
    generateTimeSlotCheckboxes("backupSlotsContainer");

    document.getElementById("teacherSelect").addEventListener("change", (e) => {
        updateTeacherInfo(e.target.value);
        toggleCheckboxes(true);
    });

    document.addEventListener("change", (event) => {
        if (event.target.classList.contains("time-slot-checkbox")) {
            updateConfirmButton();
        }
    });

    document.getElementById("confirmAvailability").addEventListener("click", confirmAvailability);
    document.getElementById("generateSchedule").addEventListener("click", generateSchedule);
});


// ✅ Բեռնում ենք դասախոսների ցանկը
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

    } catch (error) {
        console.error("⛔ Error loading teachers:", error);
    }
}

async function updateTeacherInfo(teacherId) {
    if (!teacherId) {
        document.getElementById("teacher-info").innerHTML = "Ընտրեք դասախոս";
        return;
    }

    try {
        const response = await fetch(`/api/schedule/teacher/${teacherId}`);

        if (!response.ok) {
            console.error(`❌ Server Error: ${response.status}`);
            document.getElementById("teacher-info").innerHTML = "Տվյալներ չեն գտնվել";
            return;
        }

        const data = await response.json();
        document.getElementById("teacher-info").innerHTML = `
            <strong>${data.teacherName}</strong> ունի <strong>${data.subjectCount}</strong> դասաժամ:
        `;
    } catch (error) {
        console.error("⛔ Error fetching teacher schedule:", error);
        document.getElementById("teacher-info").innerHTML = "Տվյալներ չեն գտնվել";
    }
}


// ✅ Ստեղծում ենք checkbox-ները
function generateTimeSlotCheckboxes(containerId) {
    const container = document.getElementById(containerId);
    
    // Ստուգում ենք, եթե վերնագիրը արդեն կա, չավելացնենք կրկնակի
    if (!container.previousElementSibling || container.previousElementSibling.tagName !== "H2") {
        const title = document.createElement("h2");
        title.textContent = containerId === "primarySlotsContainer" ? "Առաջնային դասաժամեր" : "Երկրորդային դասաժամեր";
        title.classList.add("schedule-title");
        container.parentNode.insertBefore(title, container);
    }

    // Ջնջում ենք միայն աղյուսակը, ոչ թե վերնագիրը
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
            checkbox.value = `${dayIndex + 1}-${slotIndex + 1}`;
            checkbox.disabled = true;

            const cell = document.createElement("td");
            cell.appendChild(checkbox);
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}


// ✅ Թույլատրում կամ անջատում ենք checkbox-ները
function toggleCheckboxes(enable) {
    document.querySelectorAll(".time-slot-checkbox").forEach(checkbox => {
        checkbox.disabled = !enable;
    });
}

// ✅ Թարմացնում ենք "Հաստատել ժամերը" կոճակը
function updateConfirmButton() {
    const anyChecked = document.querySelectorAll(".time-slot-checkbox:checked").length > 0;
    document.getElementById("confirmAvailability").disabled = !anyChecked; 
}

// ✅ Հաստատում ենք ընտրված դասաժամերը
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

// ✅ Ստեղծում ենք դասացուցակը
function generateSchedule() {
    if (!isConfirmed) {
        alert("⚠️ Խնդրում ենք նախ հաստատել ժամերը:");
        return;
    }

    alert("📅 Դասացուցակը ստեղծվեց!");
}
