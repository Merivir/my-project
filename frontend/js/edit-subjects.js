document.addEventListener("DOMContentLoaded", async () => {
    const courseSelect = document.getElementById("courseSelect");
    const courseCodeSelect = document.getElementById("courseCodeSelect");
    const subjectsContainer = document.getElementById("subjectsContainer");
    const saveChangesBtn = document.getElementById("saveChangesBtn");
    const container = document.getElementById("teacherContainer");


    // Վերադառնալ նախորդ էջին
    document.querySelector(".back-arrow").addEventListener("click", (event) => {
        event.preventDefault();
        window.history.back();
    });

    // ➕ Ավելացնել առարկա popup-ի մաս
    const addSubjectBtn = document.getElementById("addSubjectBtn");
    const addSubjectPopup = document.getElementById("addSubjectPopup");
    const addSubjectPopupOverlay = document.getElementById("addSubjectPopupOverlay");
    const closePopupBtn = document.getElementById("closeAddSubjectPopup");

     // Create a new <select> element
     const newSelect = document.createElement("select");
     newSelect.classList.add("teacherSelect");

    // 📌 Երբ կուրսի կոդն ընտրվում է, "➕ Ավելացնել առարկա" կոճակը ակտիվանում է
    courseCodeSelect.addEventListener("change", () => {
        addSubjectBtn.disabled = !courseCodeSelect.value;
    });

    // 🔓 Popup բացել
    addSubjectBtn.addEventListener("click", function () {
        addSubjectPopup.classList.add("visible");
        addSubjectPopupOverlay.style.display = "block";
    });

    // ❌ Popup փակել (X կոճակ)
    closePopupBtn.addEventListener("click", function () {
        addSubjectPopup.classList.remove("visible");
        addSubjectPopupOverlay.style.display = "none";
    });

    // ❌ Overlay սեղմելիս popup-ը փակվի
    addSubjectPopupOverlay.addEventListener("click", function () {
        addSubjectPopup.classList.remove("visible");
        addSubjectPopupOverlay.style.display = "none";
    });


    // 📡 API-ից բեռնում ենք դասախոսներին
    loadTeachers("newTeacher", "/api/lecture-teachers");
    loadTeachers("practicalTeacher", "/api/practical-teachers");
    loadTeachers("labTeacher", "/api/lab-teachers");

    // 📌 Գործնական & Լաբորատոր checkbox-ների աշխատեցում
    document.getElementById("enablePractical").addEventListener("change", function () {
        const practicalSection = document.getElementById("practicalSection");
        const practicalTeacher = document.getElementById("practicalTeacher");
        const practicalCount = document.getElementById("practicalCount");
        const practicalFrequency = document.getElementById("practicalFrequency");

        practicalSection.classList.toggle("hidden", !this.checked);
        practicalTeacher.disabled = !this.checked;
        practicalCount.disabled = !this.checked;
        practicalFrequency.disabled = !this.checked;
    });

    document.getElementById("enableLab").addEventListener("change", function () {
        const labSection = document.getElementById("labSection");
        const labTeacher = document.getElementById("labTeacher");
        const labCount = document.getElementById("labCount");
        const labFrequency = document.getElementById("labFrequency");

        labSection.classList.toggle("hidden", !this.checked);
        labTeacher.disabled = !this.checked;
        labCount.disabled = !this.checked;
        labFrequency.disabled = !this.checked;
    });

    /**
 * 📡 Fetch teachers from API and populate a given <select> dropdown
 * @param {string} selectId - The ID of the dropdown element
 * @param {string} apiUrl - The API endpoint
 */
async function loadTeachers(selectId, apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`❌ Server error: ${response.status}`);

        const teachers = await response.json();

        // Wait for the element to be available in the DOM
        setTimeout(() => {
            const selectElement = document.getElementById(selectId);

            if (!selectElement) {
                console.error(`❌ Select element with ID ${selectId} not found!`);
                return;
            }

            // Clear old options
            selectElement.innerHTML = "";

            // Add default option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Ընտրել դասախոս...";
            selectElement.appendChild(defaultOption);

            // Populate dropdown
            teachers.forEach(teacher => {
                const option = document.createElement("option");
                option.value = teacher.id;
                option.textContent = teacher.name;
                selectElement.appendChild(option);
            });

            console.log(`🎉 Updated ${selectId} successfully!`);
        }, 50); // Small delay to ensure the new select exists
    } catch (error) {
        console.error(`❌ Error loading teachers for ${selectId}:`, error);
    }
}

    

// ➕ Add another lecture teacher
    document.getElementById("addAnotherTeacher").addEventListener("click", function () {
        addTeacherDropdown("newTeacher", "teacherContainer", "/api/lecture-teachers");
    });

    // ➕ Add another practical teacher
    document.getElementById("addPracticalTeacher").addEventListener("click", function () {
        addTeacherDropdown("practicalTeacher", "practicalSection", "/api/practical-teachers");
    });

    // ➕ Add another lab teacher
    document.getElementById("addLabTeacher").addEventListener("click", function () {
        addTeacherDropdown("labTeacher", "labSection", "/api/lab-teachers");
    });

    // Բեռնում ենք կուրսերը Levels աղյուսակից
    async function loadCourses() {
        try {
            console.log("📡 Fetching levels...");
            const response = await fetch("/api/levels");
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            const levels = await response.json();
            console.log("Levels loaded:", levels);
            courseSelect.innerHTML = `<option value="">Ընտրել կուրս...</option>` +
                levels.map(level => `<option value="${level.id}">${level.name}</option>`).join("");
        } catch (error) {
            console.error(" Error loading levels:", error);
        }
    }

    // Բեռնում ենք Courses-ի կոդերը՝ ընտրված level-ի հիման վրա
    async function loadCourseCodes(levelId) {
        try {
            console.log(`📡 Fetching courses for levelId: ${levelId}`);
            if (!levelId || isNaN(levelId)) {
                console.error(" Invalid levelId:", levelId);
                return;
            }
            const response = await fetch(`/api/courses?levelId=${levelId}`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const courses = await response.json();
            console.log(" Courses fetched:", courses);
            if (!Array.isArray(courses)) throw new Error("Returned data is not an array");
            courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>` +
                courses.map(course => `<option value="${course.id}">${course.code}</option>`).join("");
            courseCodeSelect.disabled = false;
        } catch (error) {
            console.error(" Error loading course codes:", error);
        }
    }

    // Բեռնում ենք առարկաները՝ ընտրված Courses-ի կոդի հիման վրա
    async function loadSubjects(courseCode) {
        try {
            console.log(` Fetching subjects for courseCode: ${courseCode}`);
            const response = await fetch(`/api/subjects/${courseCode}`);
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            const subjects = await response.json();
            console.log(" Received subjects (Updated List from schedule_editable):", subjects);
            if (!Array.isArray(subjects) || subjects.length === 0) {
                console.warn(" No subjects received or data is not an array!");
                subjectsContainer.innerHTML = `<p style="color: red;">📢 Առարկաներ չեն գտնվել!</p>`;
                return;
            }
            renderSubjects(subjects); // Թարմացնում ենք UI-ն
        } catch (error) {
            console.error(" Error loading subjects:", error);
        }
    }

    // Ստեղծում ենք առարկաների ցուցադրության card-երը
    function renderSubjects(subjects) {
        console.log(" Rendering subjects:", subjects);
        subjectsContainer.innerHTML = ""; // Մաքրում ենք հին տվյալները

        subjects.forEach(subject => {
            const subjectElement = document.createElement("div");
            subjectElement.classList.add("subject-card");

            // Հիմնականում, data-schedule-id-ը պահպանվում է schedule_editable-ի id-ի արժեքով
            subjectElement.setAttribute("data-schedule-id", subject.schedule_id);
            // Եթե պահանջվում է նաև առարկայի նախնական id-ը՝ subjects_editable-ի, կարող եք նաև ավելացնել
            subjectElement.setAttribute("data-subject_id", subject.subject_id || "");

            // Մյուս data attributes
            subjectElement.setAttribute("data-teacher_id", subject.teacher_id || "");
            subjectElement.setAttribute("data-room_id", subject.room_number || "");
            subjectElement.setAttribute("data-type_id", subject.type_id || "");
            subjectElement.setAttribute("data-frequency", subject.weekly_type || "weekly");
            subjectElement.setAttribute("data-teacher_name", subject.teacher_name || "");
            subjectElement.setAttribute("data-room_number", subject.room_number || "");
            subjectElement.setAttribute("data-type_name", subject.type_name || "");

            subjectElement.innerHTML = `
                <h3>${subject.subject_name || "Առարկա չկա"}</h3>
                <p><strong>Դասախոս:</strong> ${subject.teacher_name || "Չի նշված"}</p>
                <p><strong>Լսարան:</strong> ${subject.room_number || "Չի նշված"}</p>
                <p><strong>Դասի Տիպ:</strong> ${subject.type_name || "Չի նշված"}</p>
                <p><strong>Հաճախականություն:</strong> 
                    ${subject.weekly_type === "weekly" ? "Ամեն շաբաթ" : subject.weekly_type === "biweekly" ? "2 շաբաթը մեկ" : "Չի նշված"}
                </p>
                <button class="delete-btn" data-id="${subject.schedule_id}">❌ Ջնջել</button>
            `;

            // Եթե delete-btn-ին սեղմվում է, չբացել edit pop-up-ը
            subjectElement.addEventListener("click", function (event) {
                if (event.target.classList.contains("delete-btn")) return;
                openEditPopup(subjectElement);
            });

            subjectsContainer.appendChild(subjectElement);
        });
        console.log(" Rendered subjects successfully!");
    }

    // Ավելացնում ենք loadSubjects-ը գլոբալ, որպեսզի այն հասանելի լինի window-ի միջոցով
    window.loadSubjects = loadSubjects;

    // Event listener կուրսի ընտրության համար
    courseSelect.addEventListener("change", (e) => {
        const selectedLevel = e.target.value;
        if (selectedLevel) {
            loadCourseCodes(selectedLevel);
        } else {
            courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>`;
            courseCodeSelect.disabled = true;
        }
    });

    // Event listener Courses-ի կոդի ընտրության համար, որտեղ բեռնվում են առարկաները
    courseCodeSelect.addEventListener("change", (e) => {
        const selectedCourseCode = e.target.value;
        if (selectedCourseCode) {
            loadSubjects(selectedCourseCode);
        } else {
            subjectsContainer.innerHTML = "";
            saveChangesBtn.disabled = true;
        }
    });

    // Event listener subjectsContainer-ի delete կոճակների համար
    subjectsContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const subjectId = e.target.dataset.id;
            if (confirm("Դուք համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս առարկան?")) {
                try {
                    await fetch(`/api/schedule/${subjectId}`, { method: "DELETE" });
                    alert(" Առարկան հաջողությամբ ջնջվեց");
                    loadSubjects(courseCodeSelect.value); // Թարմացնում ենք ցուցակը
                } catch (error) {
                    console.error("Error deleting subject:", error);
                }
            }
        }
    });

    // Բեռնում ենք կուրսերը առաջին անգամ
    loadCourses();
});


// ➕ Popup բացելու ֆունկցիա (Ավելացնել առարկա)
function openAddSubjectPopup() {
    const popup = document.getElementById("addSubjectPopup");
    const overlay = document.getElementById("addSubjectPopupOverlay");
    popup.classList.add("visible");
    overlay.style.display = "block";

    // 🔄 Մաքրում ենք հին տվյալները (հնարավոր է՝ նախորդ սխալից մնացած լինեն)
    document.getElementById("newTeacher").innerHTML = "<option value=''>Ընտրել դասախոս...</option>";
    document.getElementById("practicalTeacher").innerHTML = "<option value=''>Ընտրել դասախոս...</option>";
    document.getElementById("labTeacher").innerHTML = "<option value=''>Ընտրել դասախոս...</option>";
}

// ❌ Popup փակելու ֆունկցիա (Ավելացնել առարկա)
function closeAddSubjectPopup() {
    const popup = document.getElementById("addSubjectPopup");
    const overlay = document.getElementById("addSubjectPopupOverlay");
    popup.classList.remove("visible");
    overlay.style.display = "none";
}

// Edit pop-up-ի բացման ֆունկցիա
function openEditPopup(subjectCard) {
    const popup = document.getElementById("editPopup");
    // Ստեղծում ենք առարկայի schedule_editable-ի id-ն data attribute-ի միջոցով
    popup.setAttribute("data-schedule-id", subjectCard.getAttribute("data-schedule-id"));

    const subjectInput = document.getElementById("editSubject");
    const teacherSelect = document.getElementById("editTeacher");
    const roomSelect = document.getElementById("editRoom");
    const typeSelect = document.getElementById("editType");
    const frequencySelect = document.getElementById("editFrequency");

    if (!subjectInput || !teacherSelect || !roomSelect || !typeSelect || !frequencySelect) {
        console.error(" Error: One of the form elements is missing in openEditPopup!");
        return;
    }

    // Պահպանում ենք edit pop-up-ի վրա schedule_editable-ի id-ը
    const scheduleId = subjectCard.getAttribute("data-schedule-id");
    console.log(" Setting schedule_id:", scheduleId);
    subjectInput.setAttribute("data-schedule-id", scheduleId);
    subjectInput.value = subjectCard.querySelector("h3").textContent.trim();
    subjectInput.setAttribute("readonly", true);

    // Բեռնվում ենք դասախոսների տվյալները
    fetch("/api/teachers")
        .then(response => response.json())
        .then(data => {
            teacherSelect.innerHTML = "";
            data.forEach(teacher => {
                const option = document.createElement("option");
                option.value = teacher.id;
                option.textContent = teacher.name;
                teacherSelect.appendChild(option);
            });
            const matchedTeacher = data.find(t => t.name === subjectCard.getAttribute("data-teacher_name"));
            if (matchedTeacher) {
                teacherSelect.value = matchedTeacher.id;
            }
        })
        .catch(error => console.error("Դասախոսների բեռնման սխալ:", error));

    // Բեռնվում ենք լսարանների տվյալները
    fetch("/api/rooms")
        .then(response => response.json())
        .then(data => {
            roomSelect.innerHTML = "";
            data.forEach(room => {
                const option = document.createElement("option");
                option.value = room.id;
                option.textContent = room.number;
                roomSelect.appendChild(option);
            });
            const matchedRoom = data.find(r => r.number === subjectCard.getAttribute("data-room_number"));
            if (matchedRoom) {
                roomSelect.value = matchedRoom.id;
            }
        })
        .catch(error => console.error(" Լսարանների բեռնման սխալ:", error));

    // Բեռնվում ենք դասի տեսակների տվյալները
    fetch("/api/types")
        .then(response => response.json())
        .then(data => {
            typeSelect.innerHTML = "";
            data.forEach(type => {
                const option = document.createElement("option");
                option.value = type.id;
                option.textContent = type.name;
                typeSelect.appendChild(option);
            });
            const matchedType = data.find(t => t.name === subjectCard.getAttribute("data-type_name"));
            if (matchedType) {
                typeSelect.value = matchedType.id;
            }
        })
        .catch(error => console.error(" Դասի տեսակների բեռնման սխալ:", error));

    frequencySelect.innerHTML = `
        <option value="weekly">Ամեն շաբաթ</option>
        <option value="biweekly">2 շաբաթը մեկ</option>
    `;
    frequencySelect.value = subjectCard.getAttribute("data-frequency") || "weekly";

    popup.classList.add("visible");
}

function closeEditPopup() {
    const popup = document.getElementById("editPopup");
    const overlay = document.getElementById("popupOverlay");
    if (popup && overlay) {
        popup.classList.remove("visible");
        popup.classList.add("hidden");
        overlay.classList.remove("visible");
    }
}

async function saveEditedSchedule() {
    // Ստանում ենք schedule_editable-ի գրառման id-ը, որը պահպանված է edit pop-up-ում
    const scheduleId = document.getElementById("editPopup").getAttribute("data-schedule-id");
    const updatedSchedule = {
        // Եթե ցանկանում եք subject_id-ն չփոփոխել, ապա այն թողնել նույնը,
        // կամ եթե պետք է թարմացնել էլ այն, ապա կարող եք ավելացնել այն որպես անչափի արժեք
        teacher_id: parseInt(document.getElementById("editTeacher").value) || null,
        room_id: parseInt(document.getElementById("editRoom").value) || null,
        type_id: parseInt(document.getElementById("editType").value) || null,
        frequency: document.getElementById("editFrequency").value || "weekly"
    };

    console.log("📤 Sending data to API:", updatedSchedule);

    try {
        const response = await fetch(`/api/edit/${scheduleId}`, { 
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSchedule)
        });
        const responseData = await response.json();
        console.log(" Server Response:", responseData);
        if (response.ok) {
            alert(" Փոփոխությունը պահպանվեց!");
            closeEditPopup();
            // Թարմացնում ենք subjects-ի ցուցակը
            if (typeof window.loadSubjects === "function") {
                await window.loadSubjects(document.getElementById("courseCodeSelect").value);
            } else {
                console.error(" Error: loadSubjects is not defined.");
            }
        } else {
            console.error(" Error response:", responseData);
            alert(` Սխալ փոփոխման ժամանակ: ${responseData.error}`);
        }
    } catch (error) {
        console.error(" Error saving changes:", error);
    }
}

async function loadDropdownData(elementId, apiEndpoint) {
    try {
        console.log(`📡 Fetching ${elementId} from ${apiEndpoint}...`);
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
            throw new Error(` Failed to fetch ${elementId}: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error(` Invalid data format for ${elementId}`);
        }
        const select = document.getElementById(elementId);
        select.innerHTML = `<option value="">Ընտրել...</option>` + 
            data.map(item => `<option value="${item.id}">${item.name || item.number}</option>`).join("");
        console.log(` Loaded ${elementId} successfully`);
    } catch (error) {
        console.error(` Error fetching ${elementId}:`, error);
    }
}

async function fetchData(url, elementId) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        const select = document.getElementById(elementId);
        select.innerHTML = `<option value="">Ընտրել...</option>` + 
            data.map(item => `<option value="${item.id}">${item.name || item.number}</option>`).join("");
    } catch (error) {
        console.error(` Error fetching ${elementId}:`, error);
    }
}

/**
 * 📌 Add a new teacher dropdown dynamically
 * @param {string} baseSelectId - The ID of the base teacher dropdown to copy
 * @param {string} containerId - The ID of the container where new dropdowns should be added
 * @param {string} apiUrl - The API endpoint to fetch teachers from
 */
function addTeacherDropdown(baseSelectId, containerId, apiUrl) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`❌ Container with ID ${containerId} not found!`);
        return;
    }

    // Create a new <div> wrapper for layout
    const wrapper = document.createElement("div");
    wrapper.classList.add("teacher-wrapper");

    // Create a new <select> element
    const newSelect = document.createElement("select");
    newSelect.classList.add("teacherSelect");

    // Generate a unique ID for the new dropdown
    const newSelectId = `${baseSelectId}-${Date.now()}`;
    newSelect.id = newSelectId;

    // Create a remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.classList.add("remove-teacher-btn");
    removeBtn.addEventListener("click", () => {
        wrapper.remove(); // Remove the select element when clicking ❌
    });

    // Append select and remove button to wrapper
    wrapper.appendChild(newSelect);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);

    // Load teachers into the new dropdown
    loadTeachers(newSelectId, apiUrl);

    console.log(`➕ Added new teacher dropdown: ${newSelectId}`);
}

/**
 * 📌 Add a new teacher dropdown dynamically **with a remove button next to it**
 * @param {string} baseSelectId - The ID of the base teacher dropdown to copy
 * @param {string} containerId - The ID of the container where new dropdowns should be added
 * @param {string} apiUrl - The API endpoint to fetch teachers from
 */
function addTeacherDropdown(baseSelectId, containerId, apiUrl) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`❌ Container with ID ${containerId} not found!`);
        return;
    }

    // Create a new <div> wrapper with flex display
    const wrapper = document.createElement("div");
    wrapper.classList.add("teacher-wrapper");

    // Create a new <select> element
    const newSelect = document.createElement("select");
    newSelect.classList.add("teacherSelect");

    // Generate a unique ID for the new dropdown
    const newSelectId = `${baseSelectId}-${Date.now()}`;
    newSelect.id = newSelectId;

    // Create a remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.classList.add("remove-teacher-btn");
    removeBtn.addEventListener("click", () => {
        wrapper.remove(); // Remove the select element when clicking ❌
    });

    // Apply flex display to align items properly
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "row";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "10px"; // Space between dropdown and ❌ button
    wrapper.style.marginBottom = "5px"; // Space between rows

    // Append select and remove button
    wrapper.appendChild(newSelect);
    wrapper.appendChild(removeBtn);

    // **Insert the new dropdown BELOW the last existing one**
    container.appendChild(wrapper);

    // Load teachers into the new dropdown
    loadTeachers(newSelectId, apiUrl);

    console.log(`➕ Added new teacher dropdown: ${newSelectId}`);
}
