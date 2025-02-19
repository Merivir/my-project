// 🔹 Global փոփոխականներ
let scheduleData = []; // Ամեն դասացուցակի տվյալները
let currentCourseYear = "1"; // Սկզբում ընտրում ենք առաջին կուրսը
let courseMap = {}; // Mapping՝ կուրսի համար՝ courses-ի ID-ներով

// Օրերի և ժամային սլոտների ցուցակը (ստանդարտ)
const days = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];

// 🔹 Հիմնական գործողություններ, երբ բեռնվում է էջը
document.addEventListener("DOMContentLoaded", () => {
    fetch('http://localhost:3000/api/schedule')
        .then(response => response.json())
        .then(data => {
            console.log("📌 Data from API:", data);

            const container = document.getElementById("scheduleContainer");
            container.innerHTML = ""; // Մաքրում ենք նախորդ աղյուսակները

            // ✅ Բերում ենք բոլոր course_code-երը և ստեղծում ենք դրանց համար աղյուսակներ
            const courses = [...new Set(data.map(row => row.course_code))]; // Վերցնում ենք միայն եզակի կուրսերը

            courses.forEach(course => {
                // ✅ Ստեղծում ենք 2 առանձին աղյուսակ՝ "Համարիչ" և "Հայտարար"
                ["համարիչ", "հայտարար"].forEach(weekType => {
                    const title = document.createElement("h2");
                    title.textContent = `${course} - ${weekType}`;
                    container.appendChild(title);

                    const table = document.createElement("table");
                    table.setAttribute("border", "1");

                    // ✅ Ավելացնում ենք աղյուսակի վերնագրերը
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Կուրս</th>
                                <th>Օր</th>
                                <th>Շաբաթ</th>
                                <th>Ժամ</th>
                                <th>Սենյակ</th>
                                <th>Առարկա</th>
                                <th>Դասախոս</th>
                                <th>Տիպ</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-${course}-${weekType}"></tbody>
                    `;
                    container.appendChild(table);
                });
            });

            // ✅ Տվյալները ավելացնում ենք համապատասխան աղյուսակի մեջ
            data.forEach(row => {
                const tbody = document.getElementById(`tbody-${row.course_code}-${row.week_type}`);
                if (tbody) {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${row.course_code}</td>
                        <td>${row.day_name}</td>
                        <td>${row.week_type}</td>
                        <td>${row.time_slot}</td>
                        <td>${row.room_number}</td>
                        <td>${row.subject_name}</td>
                        <td>${row.teacher_name}</td>
                        <td>${row.type_name}</td>
                    `;
                    tbody.appendChild(tr);
                }
            });
        })
        .catch(error => console.error("❌ Error fetching schedule:", error));
});


// 🔹 Ֆունկցիա՝ API-ից դասացուցակի տվյալների բեռնում
async function loadSchedule() {
    try {
        console.log("📡 Fetching schedule from API...");
        const response = await fetch("/api/schedule");
        const scheduleData = await response.json();

        console.log("✅ Full Schedule Data with course_code:", JSON.stringify(scheduleData, null, 2));

        if (!scheduleData || scheduleData.length === 0) {
            console.warn("⚠️ No schedule data received from API!");
            return;
        }

        scheduleData.forEach(item => {
            if (!item.course_code) {
                console.warn("⚠️ Missing course_code in:", item);
            }
        });

        displaySchedule(scheduleData);
    } catch (error) {
        console.error("❌ Error loading schedule:", error);
    }
}


function displaySchedule(scheduleData) {
    const scheduleContainer = document.getElementById("scheduleContainer");
    scheduleContainer.innerHTML = "";

    scheduleData.forEach((item) => {
        const scheduleItem = document.createElement("div");
        scheduleItem.classList.add("schedule-item");
        scheduleItem.innerHTML = `
            <p><strong>Կուրսի կոդը:</strong> ${item.course_code}</p>
            <p><strong>Օր:</strong> ${item.day_name}</p>
            <p><strong>Ժամ:</strong> ${item.time_slot}</p>
            <p><strong>Առարկա:</strong> ${item.subject_name}</p>
            <p><strong>Դասարան:</strong> ${item.room_number}</p>
            <p><strong>Դասախոս:</strong> ${item.teacher_name}</p>
            <p><strong>Դասի տեսակ:</strong> ${item.type_name}</p>
        `;
        scheduleContainer.appendChild(scheduleItem);
    });
}


// 🔹 Ֆունկցիա՝ API-ից կուրսերի տվյալների բեռնում
async function loadCourses() {
    try {
        console.log("📡 Fetching courses from API...");
        const response = await fetch("/api/courses");
        if (!response.ok) throw new Error(`⚠️ Server error: ${response.status}`);
        const courses = await response.json();

        console.log("✅ Raw Courses Data:", courses);
        console.log("🔍 First Course Example:", courses[0]); // Ստուգում ենք առաջին կուրսի օրինակը

        // Մաքուր courseMap-ի ստեղծում
        courseMap = { "1": [], "2": [], "3": [], "4": [] };

        courses.forEach(course => {
            const courseCode = course.code || course.course_code || course.id;
            if (!courseCode) {
                console.warn("⚠️ Course entry missing 'code':", course);
                return;
            }

            const firstDigit = courseCode.match(/\d/); // Գտնում ենք առաջին թիվը
            if (!firstDigit) {
                console.warn(`⚠️ No digit found in course code: ${courseCode}`);
                return;
            }

            const year = firstDigit[0];
            if (year === "4") courseMap["1"].push(courseCode);
            else if (year === "3") courseMap["2"].push(courseCode);
            else if (year === "2") courseMap["3"].push(courseCode);
            else if (year === "1") courseMap["4"].push(courseCode);
        });

        console.log("✅ courseMap after processing:", courseMap);
    } catch (error) {
        console.error("⛔ Error loading courses:", error);
    }
}

function filterScheduleByCourseYear(courseYear) {
    const courseCodes = courseMap[courseYear] || [];
    console.log("🔍 Course Codes for Year:", courseYear, "→", courseCodes);

    if (courseCodes.length === 0) {
        console.warn(`⚠️ No course codes found for year ${courseYear}`);
        return;
    }

    const scheduleContainer = document.getElementById("scheduleContainer");
    if (!scheduleContainer) {
        console.error("⛔ scheduleContainer not found in DOM!");
        return;
    }

    scheduleContainer.innerHTML = "";
    let foundAny = false;

    courseCodes.forEach(courseCode => {
        console.log(`🔍 Checking for course code: ${courseCode}`);

        const filteredEntries = scheduleData.filter(entry => {
            if (!entry.course_code) {
                console.warn(`⚠️ Missing course_code for entry:`, entry);
                return false; // Չփորձենք համեմատել `undefined`
            }
            return entry.course_code.trim() === courseCode.trim();
        });

        console.log(`📌 Found ${filteredEntries.length} entries for course code: ${courseCode}`);

        if (filteredEntries.length > 0) {
            foundAny = true;
            const courseTitle = document.createElement("h2");
            courseTitle.textContent = `Դասացուցակ - ${courseCode}`;
            scheduleContainer.appendChild(courseTitle);

            const tableDiv = document.createElement("div");
            tableDiv.id = `schedule-${courseCode}`;
            scheduleContainer.appendChild(tableDiv);

            buildScheduleTable(tableDiv.id, filteredEntries);
        } else {
            console.warn(`⚠️ No schedule found for course code: ${courseCode}`);
        }
    });

    if (!foundAny) {
        scheduleContainer.innerHTML = `<p style="color: red;">📢 No schedules available for this year!</p>`;
    }
}



// 🔹 Ֆունկցիա՝ կուրսերի կոճակները թարմացնելու համար
function updateCourseButtons() {
    const courseButtonsContainer = document.getElementById("course-buttons");
    if (!courseButtonsContainer) {
        console.error("⛔ course-buttons container not found!");
        return;
    }

    console.log("🔍 Updating Course Buttons. Current Course Map:", courseMap);
    courseButtonsContainer.innerHTML = "";

    Object.keys(courseMap).forEach(year => {
        if (courseMap[year].length > 0) {
            const button = document.createElement("button");
            button.textContent = `Կուրս ${year}`;
            button.onclick = () => {
                currentCourseYear = year;
                filterScheduleByCourseYear(year);
            };
            courseButtonsContainer.appendChild(button);
        } else {
            console.warn(`❌ Skipping year ${year}, no schedules available.`);
        }
    });

    if (courseButtonsContainer.innerHTML === "") {
        courseButtonsContainer.innerHTML = `<p style="color: red;">📢 No courses available!</p>`;
    }
}

// 🔹 Ֆունկցիա՝ HTML աղյուսակի կառուցում
function buildScheduleTable(containerId, entries) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`⛔ Container with id ${containerId} not found.`);
        return;
    }

    const table = document.createElement("table");
    table.className = "schedule-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = "<th>Ժամ</th>" + days.map(day => `<th>${day}</th>`).join("");
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    timeSlots.forEach(slot => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${slot}</td>` + days.map(day => `<td class='schedule-cell' data-day='${day}' data-slot='${slot}'>-</td>`).join("");
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.innerHTML = "";
    container.appendChild(table);
}

// 🔹 Փոփափ պատուհանի բացում
function openPopup(element) {
    const popup = document.getElementById("classPopup");
    if (!popup) return;
    document.getElementById("popupSubject").textContent = element.dataset.subject || "Առարկա չստացվեց";
    document.getElementById("popupTeacher").textContent = element.dataset.teacher || "Դասախոս չստացվեց";
    document.getElementById("popupRoom").textContent = element.dataset.room || "Լսարան չստացվեց";
    document.getElementById("popupType").textContent = element.dataset.type || "Տիպ չստացվեց";
    popup.classList.remove("hidden");
}

// 🔹 Փոփափ պատուհանի փակում
function closePopup() {
    const popup = document.getElementById("classPopup");
    if (!popup) return;
    popup.classList.add("hidden");
}
