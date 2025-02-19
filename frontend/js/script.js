// 🔹 Global փոփոխականներ
let scheduleData = []; // Ամեն դասացուցակի տվյալները
let currentCourseYear = "1"; // Սկզբում ընտրում ենք առաջին կուրսը
let courseMap = {}; // Mapping՝ կուրսի համար՝ courses-ի ID-ներով

document.addEventListener("DOMContentLoaded", () => {
    fetch('http://localhost:3000/api/schedule')
        .then(response => response.json())
        .then(data => {
            console.log("📌 Data from API:", data);

            const container = document.getElementById("scheduleContainer");

            // ✅ Նախ մաքրում ենք նախորդ կուրսի կոճակները
            const existingButtons = document.querySelector(".course-buttons");
            if (existingButtons) existingButtons.remove();

            // ✅ Կուրսերի սահմանում ըստ կուրսի կոդի առաջին թվի
            const getCourseYear = (code) => {
                const match = code.match(/\d/); // Վերցնում ենք առաջին թվանշանը
                return match ? match[0] : null;
            };

            const courseGroups = {
                "1": data.filter(entry => getCourseYear(entry.course_code) === "4"),
                "2": data.filter(entry => getCourseYear(entry.course_code) === "3"),
                "3": data.filter(entry => getCourseYear(entry.course_code) === "2"),
                "4": data.filter(entry => getCourseYear(entry.course_code) === "1")
            };

            console.log("📌 Filtered Course Groups:", courseGroups);

            // ✅ Ստեղծում ենք կուրսերի կոճակները
            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("course-buttons");

            ["1", "2", "3", "4"].forEach(courseNum => {
                const button = document.createElement("button");
                button.classList.add("course-btn");
                button.textContent = `${courseNum}-րդ կուրս`;
                button.dataset.course = courseNum;

                button.addEventListener("click", () => {
                    console.log(`📌 Button Clicked: ${courseNum}-րդ կուրս`);
                    filterByCourse(courseNum, courseGroups);
                });

                buttonContainer.appendChild(button);
            });

            container.prepend(buttonContainer);

            // ✅ Սկզբում ցուցադրում ենք **1-ին կուրսի աղյուսակները**
            filterByCourse("1", courseGroups);
        })
        .catch(error => console.error("❌ Error fetching schedule:", error));
});

// ✅ Ֆիլտրող ֆունկցիա (1-ին, 2-րդ, 3-րդ, 4-րդ կուրսերը)
function filterByCourse(selectedCourse, courseGroups) {
    console.log(`📌 Filtering for Course: ${selectedCourse}`);
    
    const container = document.getElementById("scheduleContainer");

    // ✅ Ջնջում ենք նախորդ աղյուսակները
    document.querySelectorAll(".schedule-table, .no-schedule").forEach(el => el.remove());

    if (!courseGroups[selectedCourse] || courseGroups[selectedCourse].length === 0) {
        console.log(`❌ No Schedule Found for Course ${selectedCourse}`);
        
        const message = document.createElement("p");
        message.classList.add("no-schedule");
        message.textContent = "Ներկա պահին դասացուցակը դեռևս հասանելի չէ";
        container.appendChild(message);
        return;
    }

    console.log(`✅ Rendering Schedule for Course ${selectedCourse}`, courseGroups[selectedCourse]);

    // ✅ Ավելացնում ենք աղյուսակները
    renderTables(courseGroups[selectedCourse]);
}

function renderTables(scheduleData) {
    console.log("📌 Creating Tables with Data:", scheduleData);

    const container = document.getElementById("scheduleContainer");
    container.querySelectorAll("table, h2, p").forEach(element => element.remove());

    let uniqueCourseCodes = [...new Set(scheduleData.map(item => item.course_code))].sort();

    uniqueCourseCodes.forEach(courseCode => {
        ["համարիչ", "հայտարար"].forEach(weekType => {
            const filteredData = scheduleData
                .filter(item => item.course_code === courseCode && item.week_type === weekType);

            if (filteredData.length === 0) {
                const noDataMessage = document.createElement("p");
                noDataMessage.classList.add("no-schedule");
                noDataMessage.textContent = `${courseCode} - ${weekType}: Ներկա պահին տվյալներ չկան`;
                container.appendChild(noDataMessage);
                return;
            }

            const courseTitle = document.createElement("h2");
            courseTitle.textContent = `${courseCode} - ${weekType}`;
            container.appendChild(courseTitle);

            const table = document.createElement("table");
            table.classList.add("schedule-table");

            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            ["Ժամ", "Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"].forEach(day => {
                const th = document.createElement("th");
                th.textContent = day;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];

            timeSlots.forEach(slot => {
                const row = document.createElement("tr");

                const timeCell = document.createElement("td");
                timeCell.textContent = slot;
                row.appendChild(timeCell);

                ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"].forEach(day => {
                    const cell = document.createElement("td");
                    const lessons = filteredData.filter(item => item.day_name === day && item.time_slot === slot);

                    if (lessons.length > 0) {
                        lessons.forEach(lesson => {
                            const lessonDiv = document.createElement("div");

                            // ✅ **Առարկայի անունին ավելացնում ենք էմոջի՝ առանց փակագծերի**
                            const typeEmojiMap = {
                                "Դաս": "📖",
                                "Լաբ": "🔬",
                                "Լաբ1": "🔬", 
                                "Լաբ1": "🔬", 
                                "Լաբ1": "🔬", 
                                "Լաբ1": "🔬", 
                                "Լաբ1": "🔬", 
                                "Գործ": "🛠️",
                                "Գործ1": "🛠️",
                                "Գործ2": "🛠️",
                                "Գործ3": "🛠️",
                                "Գործ4": "🛠️",
                            };

                            const lessonType = lesson.type_name || "Այլ";
                            const lessonText = `${typeEmojiMap[lessonType] || "📌"} ${lesson.subject_name}`;

                            lessonDiv.textContent = lessonText;

                            lessonDiv.dataset.subject = lesson.subject_name;
                            lessonDiv.dataset.teacher = lesson.teacher_name;
                            lessonDiv.dataset.room = lesson.room_number;
                            lessonDiv.dataset.type = lesson.type_name;

                            lessonDiv.addEventListener("click", () => openPopup(lessonDiv));

                            cell.appendChild(lessonDiv);
                        });
                    } else {
                        cell.textContent = "-";
                    }

                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);
        });
    });
}


// ✅ Պոպափ պատուհանի բացման ֆունկցիա
// ✅ Փոփափ բացելու ֆունկցիա
function openPopup(element) {
    const popup = document.getElementById("classPopup");
    document.getElementById("popupSubject").textContent = element.dataset.subject || "Առարկա չստացվեց";
    document.getElementById("popupTeacher").textContent = element.dataset.teacher || "Դասախոս չստացվեց";
    document.getElementById("popupRoom").textContent = element.dataset.room || "Լսարան չստացվեց";
    document.getElementById("popupType").textContent = element.dataset.type || "Տիպ չստացվեց";
    popup.classList.remove("hidden");
    popup.style.display = "block";
}

// ✅ Փակելու ֆունկցիա (աշխատում է բոլոր դեպքերում)
function closePopup() {
    const popup = document.getElementById("classPopup");
    if (!popup) {
        console.error("⛔ Popup element not found!");
        return;
    }

    popup.classList.add("hidden"); // ✅ Ավելացնում ենք `hidden` դասը
    popup.style.display = "none"; // ✅ Եթե CSS-ում խնդիր լինի, սա էլ կաշխատի

    console.log("✅ Popup closed!");
}



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


