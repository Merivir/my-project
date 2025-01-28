document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 Script loaded: Waiting for clicks...");
    loadSchedule();  
    setInterval(loadSchedule, 10000); // 10 վայրկյանում մեկ նորից բերում ենք տվյալները

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
        console.log("🔍 Fetching data from API...");

        const response = await fetch('/schedule'); // Կանչում ենք backend API-ն
        if (!response.ok) throw new Error('❌ Backend-ից սխալ պատասխան');

        const schedule = await response.json(); // JSON դարձնում ենք տվյալները
        console.log("📌 API-ից բերված տվյալները:", schedule); 

        // Ֆորմատավորում ենք տվյալները, որ ճիշտ լինի
        const formattedSchedule = normalizeScheduleData(schedule);
        console.log("📌 Ֆորմատավորված տվյալները:", formattedSchedule);

        updateScheduleTable(formattedSchedule);
    } catch (err) {
        console.error('❌ Տվյալների բեռնման սխալ:', err);
    }
}

// 📌 **Ֆորմատավորում ենք API-ից եկած տվյալները**
function normalizeScheduleData(schedule) {
    console.log("🔎 Normalizing data:", schedule);

    return schedule.map(entry => {
        console.log("🔍 Checking details field:", entry.details, "Type:", typeof entry.details);

        let details = {};

        if (typeof entry.details === "string") {
            try {
                details = JSON.parse(entry.details);
                
                // Եթե դեռ string է մնացել, կրկին JSON.parse ենք անում
                if (typeof details === "string") {
                    details = JSON.parse(details);
                }
            } catch (error) {
                console.error("❌ JSON Parse Error (Invalid JSON String):", error, "Value:", entry.details);
                details = {}; // Եթե JSON-ը կոռումպացված է, օգտագործում ենք դատարկ օբյեկտ
            }
        } else if (typeof entry.details === "object" && entry.details !== null) {
            details = entry.details; // Արդեն Object է, թողնում ենք ինչպես կա
        }

        return {
            day_name: getDayName(entry.day_id),
            week_type: getWeekType(entry.week_id),
            time_slot: getTimeSlot(entry.time_slot_id),
            subject_name: entry.subject_name || "Առարկա չի նշված",
            teacher_name: entry.teacher_name || "Դասախոս չի նշված",
            room_number: entry.room_number || "Լսարան չկա",
            group_name: entry.group_name || "Խումբ չկա",
            details: details
        };
    });
}

// **Օգնական ֆունկցիաներ՝ `id`-ները փոխելու անուններով արժեքների**
function getDayName(dayId) {
    const days = {
        1: "Երկուշաբթի",
        2: "Երեքշաբթի",
        3: "Չորեքշաբթի",
        4: "Հինգշաբթի",
        5: "Ուրբաթ"
    };
    return days[dayId] || "Անհայտ օր";
}

function getWeekType(weekId) {
    const weeks = {
        1: "Համարիչ",
        2: "Հայտարար"
    };
    return weeks[weekId] || "Անհայտ շաբաթ";
}

function getTimeSlot(timeSlotId) {
    const timeSlots = {
        1: "09:30-10:50",
        2: "11:00-12:20",
        3: "12:50-14:10",
        4: "14:20-15:40"
    };
    return timeSlots[timeSlotId] || "Անհայտ ժամ";
}


// 📌 **Աղյուսակը թարմացնելու ֆունկցիան**
function updateScheduleTable(schedule) {
    console.log("📌 Updating table with new data:", schedule);

    const tableBody = document.getElementById('scheduleBody');
    tableBody.innerHTML = ''; // Մաքրում ենք աղյուսակը

    // Ֆիքսված ժամերը
    const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];

    // Օրերի ցուցակը ըստ սյունակների
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
                
                // ❌ **Հեռացնում ենք կրկնակի JSON.parse()**
                let details = classData.details || {};

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


