// 🔹 Գլոբալ փոփոխականներ
let scheduleData = [];
let currentCourseYear = "1"; // Սկզբում 1-ին կուրսն է ընտրված
let courseGroups = {};

// 🔹 API-ից դասացուցակի բեռնում
document.addEventListener("DOMContentLoaded", () => {
    fetch('http://localhost:3000/api/schedule')
        .then(response => response.json())
        .then(data => {
            console.log("📌 API-ից ստացված տվյալները:", data);

            if (!data || data.length === 0) {
                console.warn("⚠️ API-ից տվյալներ չկան:");
                return;
            }

            scheduleData = data;

            courseGroups = {
                "1": data.filter(entry => entry.course_code.match(/\d/)[0] === "4"),
                "2": data.filter(entry => entry.course_code.match(/\d/)[0] === "3"),
                "3": data.filter(entry => entry.course_code.match(/\d/)[0] === "2"),
                "4": data.filter(entry => entry.course_code.match(/\d/)[0] === "1")
            };

            console.log("🔍 Ստեղծված courseGroups:", courseGroups);

            // ✅ Ակտիվացնում ենք կուրսի կոճակները
            activateCourseButtons();

            // ✅ Սկզբում ցույց ենք տալիս 1-ին կուրսի դասացուցակը
            filterByCourse(currentCourseYear, courseGroups);
        })
        .catch(error => console.error("❌ API-ի սխալ:", error));
});

// 🔹 Կուրսի կոճակների կապում
function activateCourseButtons() {
    console.log("📌 Կուրսի կոճակները ակտիվացվում են");

    const courseButtons = document.querySelectorAll(".course-btn");

    if (!courseButtons || courseButtons.length === 0) {
        console.error("⛔ Կուրսի կոճակները չեն գտնվել!");
        return;
    }

    courseButtons.forEach(button => {
        console.log(`✅ Կուրսի կոճակ գտնվեց: ${button.textContent}`);

        button.addEventListener("click", function () {
            const selectedCourse = this.dataset.course;
            console.log(`📌 Սեղմվեց ${selectedCourse}-րդ կուրսի կոճակը`);

            if (courseGroups[selectedCourse]) {
                console.log(`✅ Գտնված տվյալներ ${selectedCourse}-րդ կուրսի համար:`, courseGroups[selectedCourse]);
            } else {
                console.warn(`❌ Տվյալներ չկան ${selectedCourse}-րդ կուրսի համար`);
            }

            // ✅ Թարմացնում ենք ֆիլտրը
            updateCourseFilter(selectedCourse);
            
            // ✅ Ցույց ենք տալիս ընտրված կուրսի դասացուցակը
            filterByCourse(selectedCourse, courseGroups);
        });
    });
}


// 🔹 Ֆիլտրի թարմացում (Ըստ ընտրված կուրսի)
function updateCourseFilter(selectedCourse) {
    console.log(`📌 Ֆիլտրը թարմացվում է ${selectedCourse}-րդ կուրսի համար`);

    const courseCodeFilter = document.getElementById("courseCodeFilter");
    if (!courseCodeFilter) {
        console.error("⚠️ Ֆիլտրի տարրը չի գտնվել!");
        return;
    }

    courseCodeFilter.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Բոլորը";
    courseCodeFilter.appendChild(defaultOption);

    if (!courseGroups[selectedCourse] || courseGroups[selectedCourse].length === 0) {
        console.warn(`❌ ${selectedCourse}-րդ կուրսի համար չկան դասացուցակներ`);
        return;
    }

    const uniqueCourseCodes = [...new Set(courseGroups[selectedCourse].map(item => item.course_code))].sort();

    uniqueCourseCodes.forEach(code => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = code;
        courseCodeFilter.appendChild(option);
    });

    console.log("✅ Ֆիլտրի տվյալները թարմացվեցին:", uniqueCourseCodes);
}

// 🔹 Դասացուցակի ֆիլտրում ըստ կուրսի
function filterByCourse(selectedCourse, courseGroups) {
    console.log(`📌 filterByCourse ֆունկցիան կանչվեց կուրսի համար: ${selectedCourse}`);

    if (!courseGroups[selectedCourse] || courseGroups[selectedCourse].length === 0) {
        console.warn(`❌ No Schedule Found for Course ${selectedCourse}`);
        return;
    }

    console.log(`✅ filterByCourse ստացավ տվյալներ:`, courseGroups[selectedCourse]);

    renderTables(courseGroups[selectedCourse]);
}

// 🔹 Ֆիլտրի "Հաստատել" կոճակի իրադարձություն
document.getElementById("applyFilter").addEventListener("click", function () {
    const selectedCode = document.getElementById("courseCodeFilter").value;
    console.log(`📌 Ընտրվել է ֆիլտրի արժեքը: ${selectedCode}`);

    filterScheduleByCourseCode(selectedCode);
});

// 🔹 Դասացուցակի ֆիլտրում ըստ կուրսի կոդի
function filterScheduleByCourseCode(selectedCode) {
    const scheduleContainer = document.getElementById("scheduleContainer");

    if (!scheduleContainer) {
        console.error("⛔ scheduleContainer տարրը չի գտնվել!");
        return;
    }

    scheduleContainer.innerHTML = "";

    if (!selectedCode || selectedCode === "") {
        console.log("📌 Ցուցադրում ենք բոլոր դասացուցակները");
        filterByCourse(currentCourseYear, courseGroups);
        return;
    }

    const filteredEntries = scheduleData.filter(entry => entry.course_code === selectedCode);
    
    if (filteredEntries.length === 0) {
        scheduleContainer.innerHTML = `<p style="color: red;">📢 No schedule available for ${selectedCode}!</p>`;
        return;
    }

    console.log(`✅ ${selectedCode}-ի համար գտնվեց ${filteredEntries.length} դաս`);

    buildScheduleTable("scheduleContainer", filteredEntries);
}

// 🔹 HTML աղյուսակի կառուցում
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
    headerRow.innerHTML = "<th>Ժամ</th>" + ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"]
        .map(day => `<th>${day}</th>`).join("");
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"].forEach(slot => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${slot}</td>` + ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"]
            .map(day => `<td class='schedule-cell' data-day='${day}' data-slot='${slot}'>-</td>`).join("");
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.innerHTML = "";
    container.appendChild(table);
}



// // ✅ Ֆիլտրող ֆունկցիա (1-ին, 2-րդ, 3-րդ, 4-րդ կուրսերը)
// function filterByCourse(selectedCourse, courseGroups) {
//     console.log(`📌 filterByCourse ֆունկցիան կանչվեց կուրսի համար: ${selectedCourse}`);

//     if (!courseGroups[selectedCourse] || courseGroups[selectedCourse].length === 0) {
//         console.warn(`❌ No Schedule Found for Course ${selectedCourse}`);
//         return;
//     }

//     console.log(`✅ filterByCourse ստացավ տվյալներ:`, courseGroups[selectedCourse]);

//     renderTables(courseGroups[selectedCourse]);
// }



function renderTables(scheduleData) {
    console.log("📌 Creating Tables with Data:", scheduleData);

    const container = document.getElementById("scheduleContainer");
    
    // ✅ Պահպանում ենք ֆիլտրի տարրը
    const filterContainer = document.querySelector(".filter-container");
    if (!filterContainer) {
        console.error("⚠️ Ֆիլտրը չի գտնվել!");
        return;
    }

    // ✅ Մաքրում ենք միայն աղյուսակները, այլ ոչ թե ամբողջ կոնտեյները
    container.querySelectorAll("table, h2, p").forEach(element => element.remove());

    let uniqueCourseCodes = [...new Set(scheduleData.map(item => item.course_code))].sort();

    uniqueCourseCodes.forEach(courseCode => {
        ["համարիչ", "հայտարար"].forEach(weekType => {
            const filteredData = scheduleData.filter(
                item => item.course_code === courseCode && item.week_type === weekType
            );

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
                    const lessons = filteredData.filter(
                        entry => entry.day_name === day && entry.time_slot === slot
                    );

                    if (lessons.length > 0) {
                        lessons.forEach(lesson => {
                            const lessonDiv = document.createElement("div");
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

                            const lessonText = `${typeEmojiMap[lesson.type_name] || "📌"} ${lesson.subject_name}`;
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

    // ✅ Վերադարձնում ենք ֆիլտրի տարրը իր տեղը
    container.prepend(filterContainer);
}


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



// ✅ Ֆիլտրի ընտրությունը պահում ենք localStorage-ում
function saveFilterSelection() {
    const selectedFilter = document.getElementById("courseCodeFilter").value;
    localStorage.setItem("selectedCourseCode", selectedFilter);
}

// ✅ Էջի բեռնումից հետո կրկին օգտագործում ենք պահված ֆիլտրը
function restoreFilterSelection() {
    const savedFilter = localStorage.getItem("selectedCourseCode");
    if (savedFilter) {
        //document.getElementById("courseCodeFilter").value = savedFilter;
        filterScheduleByCourseCode(savedFilter);
    }
}

// // ✅ Ֆիլտրի հաստատման կոճակի վրա ավելացնենք saveFilterSelection
// document.getElementById("applyFilter").addEventListener("click", function() {
//     saveFilterSelection(); // ✅ Պահում ենք ֆիլտրի տվյալները
//     let selectedCode = document.getElementById("courseCodeFilter").value;
//     filterScheduleByCourseCode(selectedCode);
// });

// ✅ Էջի բեռնումից հետո վերստին բեռնում ենք ֆիլտրի ընտրությունը
document.addEventListener("DOMContentLoaded", restoreFilterSelection);


// // ✅ Ֆիլտրող ֆունկցիա ըստ կուրսի կոդի
// function filterScheduleByCourseCode(selectedCode) {
//     let tables = document.querySelectorAll(".schedule-table");

//     tables.forEach(table => {
//         // ✅ Ցուցադրում ենք միայն ընտրված կուրսի աղյուսակը
//         if (selectedCode === "" || table.id.includes(selectedCode)) {
//             table.style.display = "table";
//         } else {
//             table.style.display = "none";
//         }
//     });
// }


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


// // 🔹 Ֆունկցիա՝ HTML աղյուսակի կառուցում
// function buildScheduleTable(containerId, entries) {
//     const container = document.getElementById(containerId);
//     if (!container) {
//         console.error(`⛔ Container with id ${containerId} not found.`);
//         return;
//     }

//     const table = document.createElement("table");
//     table.className = "schedule-table";

//     const thead = document.createElement("thead");
//     const headerRow = document.createElement("tr");
//     headerRow.innerHTML = "<th>Ժամ</th>" + days.map(day => `<th>${day}</th>`).join("");
//     thead.appendChild(headerRow);
//     table.appendChild(thead);

//     const tbody = document.createElement("tbody");
//     timeSlots.forEach(slot => {
//         const row = document.createElement("tr");
//         row.innerHTML = `<td>${slot}</td>` + days.map(day => `<td class='schedule-cell' data-day='${day}' data-slot='${slot}'>-</td>`).join("");
//         tbody.appendChild(row);
//     });
//     table.appendChild(tbody);

//     container.innerHTML = "";
//     container.appendChild(table);
// }
