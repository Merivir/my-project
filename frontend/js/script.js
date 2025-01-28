document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 Script loaded: Waiting for clicks...");

    const popup = document.getElementById("classPopup");

    // 📌 **Փակելու ֆունկցիա**
    function closePopup() {
        if (!popup) return;
        popup.classList.add("hidden");
        popup.style.display = "none";
        popup.style.visibility = "hidden";
        popup.style.opacity = "0";
        console.log("✔️ Popup is now closed!");
    }

    // 📌 **Բացելու ֆունկցիա**
    function openPopup(cell) {
        console.log("📌 Opening popup with data:", cell.dataset);
        document.getElementById('popupSubject').textContent = cell.dataset.subject || 'N/A';
        document.getElementById('popupTeacher').textContent = cell.dataset.teacher || 'N/A';
        document.getElementById('popupRoom').textContent = cell.dataset.room || 'N/A';
        document.getElementById('popupGroup').textContent = cell.dataset.group || 'N/A';

        const link = document.getElementById('popupLink');
        link.href = cell.dataset.link || '#';
        link.textContent = cell.dataset.link ? 'Zoom' : 'N/A';

        popup.classList.remove("hidden");
        popup.style.display = "block";
        popup.style.visibility = "visible";
        popup.style.opacity = "1";

        console.log("🎉 Popup opened!");
    }

    // 📌 **Խաչը (X) սեղմելիս popup-ը փակելու event**
    document.querySelectorAll(".close-popup").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopImmediatePropagation(); // Կասեցնում ենք բոլոր event-ները
            console.log("❌ Popup closed by clicking X button");
            closePopup();
        });
    });

    // 📌 **Դուրս սեղմելիս popup-ը փակելու event**
    document.addEventListener("mousedown", function (event) {
        if (!popup.contains(event.target) && !event.target.classList.contains("schedule-cell")) {
            console.log("✅ Click detected outside popup, closing...");
            closePopup();
        }
    });

    // 📌 **Դասացուցակի բջիջի վրա սեղմելիս popup-ը բացելու event**
    document.getElementById("scheduleBody").addEventListener("click", function (event) {
        if (event.target.classList.contains("schedule-cell")) {
            console.log("✅ Cell clicked, opening popup...");
            openPopup(event.target);
        }
    });
});


// 📌 Ֆունկցիա՝ դասացուցակի բեռնում
async function loadSchedule() {
    try {
        console.log("🔍 Փնտրում ենք տվյալները...");

        const response = await fetch('/schedule'); // Կանչում ենք backend API-ն
        if (!response.ok) throw new Error('❌ Backend-ից սխալ պատասխան');

        const schedule = await response.json(); // JSON դարձնում ենք տվյալները
        console.log("📌 Աղյուսակի տվյալները:", schedule); // Console-ում ցույց ենք տալիս տվյալները

        updateScheduleTable(schedule);
    } catch (err) {
        console.error('❌ Տվյալների բեռնման սխալ:', err);
    }
}

function updateScheduleTable(schedule) {
    console.log("📌 Աղյուսակի մեջ ավելացվող տվյալները:", schedule);

    const tableBody = document.getElementById('scheduleBody');
    tableBody.innerHTML = ''; // Մաքրում ենք աղյուսակը

    // Ֆիքսված ժամերը
    const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];

    // Օրերի հարմարեցված ցուցակը ըստ սյունակների
    const days = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];

    // Ստեղծում ենք նոր աղյուսակ
    timeSlots.forEach(timeSlot => {
        const row = document.createElement("tr");

        // Ավելացնում ենք ժամանակի սյունը
        const timeCell = document.createElement("td");
        timeCell.textContent = timeSlot;
        row.appendChild(timeCell);

        // Ավելացնում ենք դատարկ բջիջներ (կամ տվյալները)
        days.forEach(day => {
            const cell = document.createElement("td");
            cell.textContent = "-"; // Դեֆոլտ արժեք

            // Փնտրում ենք տվյալների ցանկից համապատասխան ժամի և օրվա դասը
            const classData = schedule.find(entry => entry.time_slot === timeSlot && entry.day_name === day);

            if (classData) {
                cell.innerHTML = `📖 ${classData.subject_name}`;
                cell.classList.add("schedule-cell");

                // Պահպանում ենք տվյալները `data-` ատրիբուտներում (popup-ի համար)
                cell.dataset.subject = classData.subject_name;
                cell.dataset.teacher = classData.teacher_name;
                cell.dataset.room = classData.room_number;
                cell.dataset.group = classData.group_name;
               
                let details = {};
                try {
                    details = JSON.parse(classData.details); // Փորձում ենք JSON-ի string-ը վերածել object-ի
                } catch (e) {
                    console.error("❌ JSON Parse Error:", e);
                }

                // Եթե json-ում `zoom_link` կամ `notes` չկա, ապա թող լինի լռելյայն արժեք
                cell.dataset.link = details.zoom_link || "#";
                cell.dataset.notes = details.notes || "Նշումներ չկան";
            }

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    console.log("✅ Աղյուսակը թարմացվեց։");
}




// 📌 Բացվող popup-ի ֆունկցիան
function openPopup(cell) {
    const popup = document.getElementById("classPopup");
    if (!popup) {
        console.error("❌ Error: Popup element not found in DOM!");
        return;
    }

    console.log("📌 Opening popup with data:", cell.dataset); // Տեսնենք ինչ տվյալներ կան
    document.getElementById('popupSubject').textContent = cell.dataset.subject || 'N/A';
    document.getElementById('popupTeacher').textContent = cell.dataset.teacher || 'N/A';
    document.getElementById('popupRoom').textContent = cell.dataset.room || 'N/A';
    document.getElementById('popupGroup').textContent = cell.dataset.group || 'N/A';

    const link = document.getElementById('popupLink');
    link.href = cell.dataset.link || '#';
    link.textContent = cell.dataset.link ? 'Zoom' : 'N/A';

    popup.classList.remove("hidden"); // Show popup
    popup.style.display = "block"; // Եթե CSS-ի պատճառով չի երևում
    console.log("🎉 Popup opened!");
}


