// 🔹 Գլոբալ փոփոխականներ
let scheduleData = [];
let levelGroups = {}; 
let currentLevel = "Առաջին"; 

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded");

    restoreFilterSelection();  // ✅ Նախ վերականգնում ենք ֆիլտրը
    await loadSchedule();      // ✅ Բեռնում ենք ամբողջ դասացուցակը (API-ից)
    activateCourseButtons();   // ✅ Կուրսի կոճակները միացնում ենք
    updateCourseFilter();      // ✅ Թարմացնում ենք կուրսի կոդերի dropdown-ը
    filterByCourse(currentLevel); // ✅ Ցուցադրում ենք առաջին կուրսի դասացուցակը
});


// document.addEventListener("DOMContentLoaded", () => {
//     fetch('http://localhost:3000/api/schedule')
//         .then(response => response.json())
//         .then(data => {
//             console.log(" API-ից ստացված տվյալները:", data);

//             if (!data || data.length === 0) {
//                 console.warn(" API-ից տվյալներ չկան:");
//                 return;
//             }

//             scheduleData = data;

//             // Կազմում ենք levelGroups ըստ level_name-ի (Առաջին, Երկրորդ, Երրորդ, Չորրորդ)
//             levelGroups = {};
//             data.forEach(entry => {
//                 let level = entry.level_name;
//                 if (!level) {
//                     console.warn(" entry-ում level տվյալը բացակայում է:", entry);
//                     return;
//                 }
//                 if (!levelGroups[level]) {
//                     levelGroups[level] = [];
//                 }
//                 levelGroups[level].push(entry);
//             });

//             console.log(" Ստեղծված levelGroups:", levelGroups);

//             //  Կուրսի կոճակները միացնում ենք
//             activateCourseButtons();

//             //  Սկզբում ցույց ենք տալիս "Առաջին" կուրսի դասացուցակը
//             filterByCourse("Առաջին");
//         })
//         .catch(error => console.error(" API-ի սխալ:", error));
// });


async function loadCourseCodes() {
    try {
        console.log("📡 Fetching course codes...");
        const response = await fetch("/api/courses");
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const courses = await response.json();
        console.log(" Courses loaded:", courses); // Ստուգելու համար console-ում

        const courseCodeSelect = document.getElementById("courseCodeFilter"); // Ստուգիր, որ ճիշտ ID է
        if (!courseCodeSelect) {
            console.error(" Course code dropdown not found!");
            return;
        }

        courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>`; // Սկզբնական տարբերակ

        courses.forEach(course => {
            const option = document.createElement("option");
            option.value = course.code;
            option.textContent = course.code;
            courseCodeSelect.appendChild(option);
        });

        courseCodeSelect.disabled = false; // Անջատվածից ակտիվ դարձնել
        console.log(" Course codes successfully added to the dropdown.");

    } catch (error) {
        console.error(" Error loading course codes:", error);
    }
}

// Էջը բեռնվելուց հետո բեռնում ենք կուրսերի կոդերը
document.addEventListener("DOMContentLoaded", loadCourseCodes);

function activateCourseButtons() {
    console.log(" Կուրսի կոճակները ակտիվացվում են");

    const courseButtons = document.querySelectorAll(".course-btn");
    if (!courseButtons || courseButtons.length === 0) {
        console.error(" Կուրսի կոճակները չեն գտնվել!");
        return;
    }

    const levelMap = {
        "1": "Առաջին",
        "2": "Երկրորդ",
        "3": "Երրորդ",
        "4": "Չորրորդ"
    };

    courseButtons.forEach(button => {
        console.log(` Կուրսի կոճակ գտնվեց: ${button.textContent}`);

        button.addEventListener("click", function () {
            const selectedLevelNumber = this.dataset.course;

            if (!selectedLevelNumber || !levelMap[selectedLevelNumber]) {
                console.error(" Անվավեր կուրսի ընտրություն:", selectedLevelNumber);
                return;
            }

            const selectedLevel = levelMap[selectedLevelNumber]; // Վերածում ենք ճիշտ անունին
            console.log(` Սեղմվեց ${selectedLevelNumber}-րդ կուրսի կոճակը, որը համապատասխանում է "${selectedLevel}"`);

            currentLevel = selectedLevel;
            filterByCourse(selectedLevel);
        });
    });
}

//  Դասացուցակի ֆիլտրում ըստ կուրսի
function filterByCourse(selectedLevel) {
    console.log(` filterByCourse ֆունկցիան կանչվեց կուրսի համար: ${selectedLevel}`);

    const scheduleContainer = document.getElementById("scheduleContainer");
    if (!scheduleContainer) {
        console.error(" scheduleContainer տարրը չի գտնվել!");
        return;
    }

    //  Մաքրում ենք ամբողջ աղյուսակը
    scheduleContainer.innerHTML = "";

    if (!levelGroups[selectedLevel] || levelGroups[selectedLevel].length === 0) {
        console.warn(` No Schedule Found for ${selectedLevel}`);
        scheduleContainer.innerHTML = `<p style="color: red;">📢 No schedule available for ${selectedLevel}!</p>`;
        return;
    }

    console.log(` filterByCourse ստացավ տվյալներ:`, levelGroups[selectedLevel]);

    renderTables(levelGroups[selectedLevel]);
}

function applyFilter() {
    const selectedCode = document.getElementById("courseCodeFilter").value;
    
    console.log(` Ընտրված կուրսը: ${currentLevel}`);
    console.log(` Ընտրված կուրսի կոդը: ${selectedCode}`);

    if (!selectedCode) {
        filterByCourse(currentLevel);
        return;
    }

    if (!levelGroups[currentLevel]) {
        console.warn(` No schedule data found for course level: ${currentLevel}`);
        return;
    }

    //  Ֆիլտրում ենք տվյալ կուրսի դասացուցակը ըստ կուրսի կոդի
    const filteredEntries = levelGroups[currentLevel].filter(entry => 
        entry.course_code === selectedCode
    );

    console.log(` Ֆիլտրված տվյալներ ${selectedCode}-ի համար:`, filteredEntries);

    if (filteredEntries.length === 0) {
        document.getElementById("scheduleContainer").innerHTML = `<p style="color: red;">📢 No schedule available for ${selectedCode}!</p>`;
        return;
    }

    renderTables(filteredEntries);
}

function buildScheduleTable(containerId, entries) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found.`);
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
            .map(day => {
                const lessons = entries.filter(entry => entry.day_name === day && entry.time_slot === slot);
                const cell = document.createElement("td");

                if (lessons.length > 0) {
                    lessons.forEach(lesson => {
                        const lessonDiv = document.createElement("div");
                        lessonDiv.textContent = `${lesson.subject_name} (${lesson.teacher_name})`;

                        //  Ավելացնում ենք կլիկ իրադարձություն (Popup)
                        lessonDiv.addEventListener("click", () => openPopup(lessonDiv));

                        cell.appendChild(lessonDiv);
                    });
                } else {
                    cell.textContent = "-";
                }

                return cell.outerHTML;
            }).join("");

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}


function filterScheduleByCourseCode(selectedCode) {
    console.log(`🔍 filterScheduleByCourseCode կանչվեց: ${selectedCode}`);

    const scheduleContainer = document.getElementById("scheduleContainer");
    if (!scheduleContainer) {
        console.error("scheduleContainer տարրը չի գտնվել!");
        return;
    }

    // Պահպանում ենք վերնագիրը, եթե այն արդեն կա
    let titleElement = document.querySelector(".schedule-title");
    if (!titleElement) {
        titleElement = document.createElement("h2");
        titleElement.classList.add("schedule-title");
        titleElement.textContent = "Դասացուցակ";
        scheduleContainer.prepend(titleElement); // Դնում ենք վերևում
    }

    // Մաքրում ենք աղյուսակը՝ առանց վերնագիրը ջնջելու
    scheduleContainer.querySelectorAll("table").forEach(table => table.remove());

    if (!selectedCode || selectedCode === "") {
        console.log(" Ցուցադրում ենք բոլոր դասացուցակները");
        filterByCourse(currentCourseYear, courseGroups);
        return;
    }

    //  Ֆիլտրում ենք ըստ ընտրված կուրսի կոդի
    const filteredEntries = scheduleData.filter(entry => entry.course_code === selectedCode);
    console.log(`${selectedCode}-ի համար գտնվեց ${filteredEntries.length} դաս`);

    if (filteredEntries.length === 0) {
        scheduleContainer.innerHTML += `<p style="color: red;">📢 No schedule available for ${selectedCode}!</p>`;
        return;
    }

    renderFilteredTables(filteredEntries);
}

function renderFilteredTables(scheduleData) {
    console.log(" Showing filtered schedule:", scheduleData);

    const container = document.getElementById("scheduleContainer");

    // Մաքրում ենք նախորդ աղյուսակները
    container.innerHTML = "";

    let uniqueCourseCodes = [...new Set(scheduleData.map(item => item.course_code))].sort();

    uniqueCourseCodes.forEach(courseCode => {
        ["համարիչ", "հայտարար"].forEach(weekType => {
            const filteredData = scheduleData.filter(
                item => item.course_code === courseCode && item.week_type === weekType
            );

            if (filteredData.length === 0) {
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

            ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"].forEach(slot => {
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
                                "Գործ": "🛠️"
                            };

                            lessonDiv.textContent = `${typeEmojiMap[lesson.type_name] || "📌"} ${lesson.subject_name}`;
                            lessonDiv.dataset.subject = lesson.subject_name;
                            lessonDiv.dataset.teacher = lesson.teacher_name;
                            lessonDiv.dataset.room = lesson.room_number;
                            lessonDiv.dataset.type = lesson.type_name;

                            // ✅ Ավելացնում ենք click իրադարձություն (Popup)
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
function renderTables(scheduleData) {
    console.log(" Rendering tables...");

    const scheduleContainer = document.getElementById("scheduleContainer");
    scheduleContainer.innerHTML = "";

    const uniqueCourseCodes = [...new Set(scheduleData.map(item => item.course_code))].sort();

    uniqueCourseCodes.forEach(courseCode => {
        ["համարիչ", "հայտարար"].forEach(weekType => {
            //  Ստանում ենք տվյալ կուրսի համապատասխան տվյալները
            let filteredData = scheduleData.filter(item => item.course_code === courseCode);

            //  "երկուսն էլ" պարունակող դասերը բաժանում ենք երկու մասի՝ "համարիչ" և "հայտարար"
            let expandedData = [];
            filteredData.forEach(entry => {
                if (entry.week_type === "երկուսն էլ") {
                    expandedData.push({ ...entry, week_type: "համարիչ" });
                    expandedData.push({ ...entry, week_type: "հայտարար" });
                } else {
                    expandedData.push(entry);
                }
            });

            //  Ֆիլտրում ենք ըստ համապատասխան "համարիչ" կամ "հայտարար" արժեքի
            const weeklyData = expandedData.filter(item => item.week_type === weekType);
            if (weeklyData.length === 0) return;

            const courseTitle = document.createElement("h2");
            courseTitle.textContent = `${courseCode} - ${weekType}`;
            scheduleContainer.appendChild(courseTitle);

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

            ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"].forEach(slot => {
                const row = document.createElement("tr");

                const timeCell = document.createElement("td");
                timeCell.textContent = slot;
                row.appendChild(timeCell);

                ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"].forEach(day => {
                    const cell = document.createElement("td");
                    const lessons = weeklyData.filter(entry => entry.day_name === day && entry.time_slot === slot);

                    if (lessons.length > 0) {
                        lessons.forEach(lesson => {
                            const lessonDiv = document.createElement("div");
                            lessonDiv.textContent = `${lesson.subject_name} (${lesson.teacher_name})`;

                            //  Պահպանում ենք տվյալները dataset-ի մեջ popup-ի համար
                            lessonDiv.dataset.subject = lesson.subject_name;
                            lessonDiv.dataset.teacher = lesson.teacher_name;
                            lessonDiv.dataset.room = lesson.room_number;
                            lessonDiv.dataset.type = lesson.type_name;

                            //  Ավելացնում ենք click իրադարձություն՝ popup բացելու համար
                            lessonDiv.addEventListener("click", function () {
                                console.log(` Սեղմվեց ${lesson.subject_name}, բացում ենք popup...`);
                                openPopup(this);
                            });

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
            scheduleContainer.appendChild(table);
        });
    });

    console.log("Աղյուսակը թարմացվեց,  դասերը կրկնվեցին");
}



//  Փոփափ բացելու ֆունկցիա
function openPopup(element) {
    console.log(" Popup բացելու փորձ...");

    const popup = document.getElementById("classPopup");
    if (!popup) {
        console.error(" Popup տարրը չի գտնվել!");
        return;
    }

    console.log(" Popup-ը գտնվեց, բացում ենք...");

    document.getElementById("popupSubject").textContent = element.dataset.subject || "Առարկա չստացվեց";
    document.getElementById("popupTeacher").textContent = element.dataset.teacher || "Դասախոս չստացվեց";
    document.getElementById("popupRoom").textContent = element.dataset.room || "Լսարան չստացվեց";
    document.getElementById("popupType").textContent = element.dataset.type || "Տիպ չստացվեց";

    popup.classList.remove("hidden");
    popup.style.display = "block";

    console.log(" Popup բացված է!");
}

//  Փակելու ֆունկցիա (աշխատում է բոլոր դեպքերում)
function closePopup() {
    const popup = document.getElementById("classPopup");
    if (!popup) {
        console.error(" Popup element not found!");
        return;
    }

    popup.classList.add("hidden"); //  Ավելացնում ենք `hidden` դասը
    popup.style.display = "none"; //  Եթե CSS-ում խնդիր լինի, սա էլ կաշխատի

    console.log(" Popup closed!");
}

document.addEventListener("DOMContentLoaded", function () {
    const closePopupButton = document.getElementById("closePopup");
    
    if (closePopupButton) {
        console.log(" closePopup կոճակը գտնվեց, ավելացնում ենք click իրադարձություն...");
        closePopupButton.addEventListener("click", closePopup);
    } else {
        console.warn(" closePopup կոճակը չի գտնվել, popup-ը կարող է չաշխատել");
    }
});


//  API-ից դասացուցակի բեռնում
async function loadSchedule() {
    try {
        console.log(" Fetching schedule from API...");
        const response = await fetch("/api/schedule");
        scheduleData = await response.json(); 

        console.log(" Full Schedule Data:", scheduleData);

        if (!scheduleData || scheduleData.length === 0) {
            console.warn("No schedule data received from API!");
            return;
        }

        //  Կազմում ենք levelGroups ըստ level_name-ի
        levelGroups = {};
        scheduleData.forEach(entry => {
            let level = entry.level_name;
            if (!level) {
                console.warn(" Missing level_name in entry:", entry);
                return;
            }
            if (!levelGroups[level]) {
                levelGroups[level] = [];
            }
            levelGroups[level].push(entry);
        });

        console.log(" Level Groups Created:", levelGroups);
    } catch (error) {
        console.error(" Error loading schedule:", error);
    }
}


async function loadCourses(selectedLevel) {
    try {
        console.log(` Fetching course codes for level: ${selectedLevel}`);
        const response = await fetch(`/api/courses`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const courses = await response.json();
        console.log(" All courses:", courses);

        //  Ֆիլտրում ենք ըստ level-ի
        const filteredCourses = courses.filter(course => isCourseMatchingLevel(course));

        console.log(` Filtered courses for '${selectedLevel}':`, filteredCourses);

        const courseCodeSelect = document.getElementById("courseCodeFilter");
        if (!courseCodeSelect) {
            console.error(" Course code dropdown not found!");
            return;
        }

        courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>`;
        filteredCourses.forEach(course => {
            const option = document.createElement("option");
            option.value = course.code;
            option.textContent = course.code;
            courseCodeSelect.appendChild(option);
        });

        courseCodeSelect.disabled = false;
        console.log(` Course codes for '${selectedLevel}' successfully added.`);

    } catch (error) {
        console.error("Error loading course codes:", error);
    }
}

document.getElementById("courseCodeFilter").addEventListener("change", function () {
    localStorage.setItem("selectedCourseCode", this.value);
    console.log(` Պահպանվել է ֆիլտրը: ${this.value}`);
});

function updateCourseFilter() {
    const courseCodeFilter = document.getElementById("courseCodeFilter");
    courseCodeFilter.innerHTML = `<option value="">Բոլորը</option>`; // Սկզբնական արժեք

    if (!scheduleData || scheduleData.length === 0) {
        console.warn(" No schedule data available!");
        return;
    }

    if (!levelGroups[currentLevel]) {
        console.warn(` No data for current level: ${currentLevel}`);
        return;
    }

    // 🔹 Վերցնում ենք միայն ընտրված կուրսի կոդերը
    const filteredCourses = levelGroups[currentLevel].map(entry => entry.course_code);
    const uniqueCourseCodes = [...new Set(filteredCourses)].sort();

    uniqueCourseCodes.forEach(code => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = code;
        courseCodeFilter.appendChild(option);
    });

    console.log(` Course codes updated for level "${currentLevel}"`);
}


function activateCourseButtons() {
    console.log(" Կուրսի կոճակները ակտիվացվում են");

    const courseButtons = document.querySelectorAll(".course-btn");
    if (!courseButtons || courseButtons.length === 0) {
        console.error(" Կուրսի կոճակները չեն գտնվել!");
        return;
    }

    const levelMap = {
        "1": "Առաջին",
        "2": "Երկրորդ",
        "3": "Երրորդ",
        "4": "Չորրորդ"
    };

    courseButtons.forEach(button => {
        console.log(` Կուրսի կոճակ գտնվեց: ${button.textContent}`);

        button.addEventListener("click", function () {
            const selectedLevelNumber = this.dataset.course;

            if (!selectedLevelNumber || !levelMap[selectedLevelNumber]) {
                console.error(" Անվավեր կուրսի ընտրություն:", selectedLevelNumber);
                return;
            }

            const selectedLevel = levelMap[selectedLevelNumber];
            console.log(` Ընտրվեց "${selectedLevel}" կուրս`);

            currentLevel = selectedLevel;
            updateCourseFilter(); // Թարմացնում ենք ֆիլտրի dropdown-ը
            filterByCourse(selectedLevel);
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const filterButton = document.getElementById("applyFilter");

    if (filterButton) {
        console.log(" applyFilter կոճակը գտնվեց, ավելացնում ենք կլիկ իրադարձություն...");
        filterButton.addEventListener("click", function () {
            console.log(" applyFilter կոճակը սեղմվեց!"); // Սեղմելուց պետք է տպվի
            applyFilter(); // Կանչում ենք ֆիլտրման ֆունկցիան
        });
    } else {
        console.error(" applyFilter կոճակը չի գտնվել!");
    }
});


function restoreFilterSelection() {
    console.log(" Վերականգնում ենք ֆիլտրի վերջին ընտրությունը...");

    const courseCodeFilter = document.getElementById("courseCodeFilter");
    if (!courseCodeFilter) {
        console.error(" courseCodeFilter տարրը չի գտնվել!");
        return;
    }

    const savedFilter = localStorage.getItem("selectedCourseCode");
    if (savedFilter) {
        courseCodeFilter.value = savedFilter;
        console.log(` Վերականգնված ֆիլտրը: ${savedFilter}`);
    } else {
        console.log(" Ոչ մի ֆիլտր չի պահպանվել");
    }
}
