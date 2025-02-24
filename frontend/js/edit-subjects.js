document.addEventListener("DOMContentLoaded", async () => {
    const courseSelect = document.getElementById("courseSelect");
    const courseCodeSelect = document.getElementById("courseCodeSelect");
    const subjectsContainer = document.getElementById("subjectsContainer");
    const saveChangesBtn = document.getElementById("saveChangesBtn");

    document.querySelector(".back-arrow").addEventListener("click", (event) => {
        event.preventDefault();
        window.history.back(); // Տանում է նախորդ էջ
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
            console.log("✅ Levels loaded:", levels);
    
            courseSelect.innerHTML = `<option value="">Ընտրել կուրս...</option>` +
                levels.map(level => `<option value="${level.id}">${level.name}</option>`).join("");
        } catch (error) {
            console.error("⛔ Error loading levels:", error);
        }
    }
    
    async function loadCourseCodes(levelId) {
        try {
            console.log(`📡 Fetching courses for levelId: ${levelId}`);
            
            if (!levelId || isNaN(levelId)) {
                console.error("⛔ Invalid levelId:", levelId);
                return;
            }
    
            const response = await fetch(`/api/courses?levelId=${levelId}`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
            const courses = await response.json();
            console.log("✅ Courses fetched:", courses);
    
            if (!Array.isArray(courses)) throw new Error("Returned data is not an array");
    
            courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>` +
                courses.map(course => `<option value="${course.id}">${course.code}</option>`).join("");
    
            courseCodeSelect.disabled = false;
        } catch (error) {
            console.error("⛔ Error loading course codes:", error);
        }
    }
    
    async function loadCourseCodes(levelId) {
        try {
            console.log(`📡 Fetching courses for levelId: ${levelId}`);
            
            if (!levelId || isNaN(levelId)) {
                console.error("⛔ Invalid levelId:", levelId);
                return;
            }
    
            const response = await fetch(`/api/courses?levelId=${levelId}`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
            const courses = await response.json();
            console.log("✅ Courses fetched:", courses);
    
            if (!Array.isArray(courses)) throw new Error("Returned data is not an array");
    
            courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>` +
                courses.map(course => `<option value="${course.id}">${course.code}</option>`).join("");
    
            courseCodeSelect.disabled = false;
        } catch (error) {
            console.error("⛔ Error loading course codes:", error);
        }
    }
    
    async function loadSubjects(courseCode) {
        try {
            console.log(`📡 Fetching subjects for courseCode: ${courseCode}`);
            const response = await fetch(`/api/subjects/${courseCode}`);
    
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
    
            const subjects = await response.json();
            console.log("📦 Received subjects:", subjects); // ✅ Ստուգում ենք API-ից ստացված տվյալները
    
            if (!Array.isArray(subjects) || subjects.length === 0) {
                console.warn("⚠️ No subjects received or data is not an array!");
                document.getElementById("subjectsContainer").innerHTML = `<p style="color: red;">📢 Առարկաներ չեն գտնվել!</p>`;
                return;
            }
    
            renderSubjects(subjects); // ✅ Առարկաները ցույց ենք տալիս
        } catch (error) {
            console.error("⛔ Error loading subjects:", error);
        }
    }
    
    function renderSubjects(subjects) {
        console.log("📦 Rendering subjects:", subjects);
    
        const subjectsContainer = document.getElementById("subjectsContainer");
        subjectsContainer.innerHTML = ""; // Մաքրում ենք հին տվյալները
    
        subjects.forEach(subject => {
            const subjectElement = document.createElement("div");
            subjectElement.classList.add("subject-card");
    
            // ✅ Ապահովում ենք, որ `undefined` արժեքներ չլինեն
            subjectElement.setAttribute("data-id", subject.subject_id);
            subjectElement.setAttribute("data-subject_id", subject.subject_id || "");
            subjectElement.setAttribute("data-teacher_id", subject.teacher_id || "");
            subjectElement.setAttribute("data-room_id", subject.room_id || "");
            subjectElement.setAttribute("data-type_id", subject.type_id || "");
            subjectElement.setAttribute("data-frequency", subject.weekly_type || "");
    
            subjectElement.innerHTML = `
                <h3>${subject.subject_name || "Առարկա չկա"}</h3>
                <p><strong>Դասախոս:</strong> ${subject.teacher_name || "Չի նշված"}</p>
                <p><strong>Լսարան:</strong> ${subject.room_number || "Չի նշված"}</p>
                <p><strong>Դասի Տիպ:</strong> ${subject.type_name || "Չի նշված"}</p>
                <p><strong>Հաճախականություն:</strong> 
                    ${subject.weekly_type === "weekly" ? "Ամեն շաբաթ" : subject.weekly_type === "biweekly" ? "2 շաբաթը մեկ" : "Չի նշված"}
                </p>
                <button class="delete-btn" data-id="${subject.subject_id}">❌ Ջնջել</button>
            `;
    
            // ✅ Ավելացնում ենք click event, որպեսզի pop-up-ը բացվի սեղմելիս
            subjectElement.addEventListener("click", function () {
                openEditPopup(subjectElement);
            });
    
            subjectsContainer.appendChild(subjectElement);
        });
    
        console.log("✅ Rendered subjects successfully!");
    }
    
    
    // Կուրս ընտրելիս բեռնում ենք համապատասխան կոդերը
    courseSelect.addEventListener("change", (e) => {
        const selectedLevel = e.target.value;
        if (selectedLevel) {
            loadCourseCodes(selectedLevel);
        } else {
            courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>`;
            courseCodeSelect.disabled = true;
        }
    });

    // Կուրսի կոդ ընտրելիս բեռնում ենք առարկաները
    courseCodeSelect.addEventListener("change", (e) => {
        const selectedCourseCode = e.target.value;
        if (selectedCourseCode) {
            loadSubjects(selectedCourseCode);
        } else {
            subjectsContainer.innerHTML = "";
            saveChangesBtn.disabled = true;
        }
    });


    // Ջնջման կոճակի վրա event listener
    subjectsContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const subjectId = e.target.dataset.id;
            if (confirm("Դուք վստահ ե՞ք, որ ցանկանում եք ջնջել այս առարկան։")) {
                try {
                    await fetch(`/api/subjects/${subjectId}`, { method: "DELETE" });
                    loadSubjects(courseCodeSelect.value); // Թարմացնում ենք ցուցակը
                } catch (error) {
                    console.error("⛔ Error deleting subject:", error);
                }
            }
        }
    });


    subjectsContainer.addEventListener("click", (event) => {
        const subjectCard = event.target.closest(".subject-card");
        if (subjectCard) {
            console.log("✅ Click detected on subject:", subjectCard);
            openEditPopup(subjectCard);
        }
    });

    // Բեռնում ենք կուրսերը սկզբում
    loadCourses();
});

function openEditPopup(subjectCard) {
    const popup = document.getElementById("editPopup");

    // 🔹 Ստանում ենք տվյալները data-ատրիբուտներից
    const subjectId = subjectCard.dataset.subject_id;
    const subjectName = subjectCard.querySelector("h3").textContent.trim(); // Վերցնում ենք ճիշտ անունը
    const teacherName = subjectCard.querySelector("p:nth-child(2)").textContent.split(": ")[1].trim();
    const roomNumber = subjectCard.querySelector("p:nth-child(3)").textContent.split(": ")[1].trim();
    const typeName = subjectCard.querySelector("p:nth-child(4)").textContent.split(": ")[1].trim();
    const frequency = subjectCard.dataset.frequency || "weekly";

    console.log("🔍 Ստացված տվյալները ✅", {
        subjectId,
        subjectName,
        teacherName,
        roomNumber,
        typeName,
        frequency
    });

    // 🔹 Popup-ի դաշտերի ստացում
    const subjectInput = document.getElementById("editSubject"); // Այստեղ readonly input է, անունը կտեսնենք
    const teacherSelect = document.getElementById("editTeacher");
    const roomSelect = document.getElementById("editRoom");
    const typeSelect = document.getElementById("editType");
    const frequencySelect = document.getElementById("editFrequency");

    if (!subjectInput || !teacherSelect || !roomSelect || !typeSelect || !frequencySelect) {
        console.error("❌ DOM տարր չի գտնվել: Ստուգիր HTML-ում ID-ները։");
        return;
    }

    // ✅ 1. Առարկայի անունը ուղիղ ցույց տալու համար input-ում
    subjectInput.value = subjectName;
    subjectInput.setAttribute("readonly", true); // Կանխում ենք փոփոխությունը

    // ✅ 2. Լցնում ենք դասախոսների dropdown-ը
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

            const matchedTeacher = data.find(t => t.name === teacherName);
            if (matchedTeacher) {
                teacherSelect.value = matchedTeacher.id;
            }
        })
        .catch(error => console.error("❌ Դասախոսների բեռնման սխալ:", error));

    // ✅ 3. Լցնում ենք լսարանների dropdown-ը
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

            const matchedRoom = data.find(r => r.number === roomNumber);
            if (matchedRoom) {
                roomSelect.value = matchedRoom.id;
            }
        })
        .catch(error => console.error("❌ Լսարանների բեռնման սխալ:", error));

    // ✅ 4. Լցնում ենք դասի տեսակների dropdown-ը
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

            const matchedType = data.find(t => t.name === typeName);
            if (matchedType) {
                typeSelect.value = matchedType.id;
            }
        })
        .catch(error => console.error("❌ Դասի տեսակների բեռնման սխալ:", error));

    // ✅ 5. Հաճախականությունը
    frequencySelect.innerHTML = `
        <option value="weekly">Ամեն շաբաթ</option>
        <option value="biweekly">2 շաբաթը մեկ</option>
    `;
    frequencySelect.value = frequency;

    // ✅ Popup-ը բացում ենք
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



async function loadDropdownData(elementId, apiEndpoint) {
    try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();

        const select = document.getElementById(elementId);
        select.innerHTML = data.map(item => `<option value="${item.id}">${item.name}</option>`).join("");
    } catch (error) {
        console.error(`⛔ Error fetching ${elementId}:`, error);
    }
}


async function saveEditedSchedule() {
    const id = document.getElementById("editPopup").getAttribute("data-id");
    const updatedSchedule = {
        subject_id: document.getElementById("editSubject").value,
        teacher_id: document.getElementById("editTeacher").value,
        room_id: document.getElementById("editRoom").value,
        type_id: document.getElementById("editType").value,
        frequency: document.getElementById("editFrequency").value
    };

    try {
        const response = await fetch(`/api/edit/${id}`, { // ✅ Ուղղակիորեն edit API-ին ենք դիմում
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSchedule)
        });

        if (response.ok) {
            alert("✅ Փոփոխությունը պահպանվեց!");
            closeEditPopup();
            location.reload();
        } else {
            alert("❌ Սխալ փոփոխման ժամանակ");
        }
    } catch (error) {
        console.error("⛔ Error saving changes:", error);
    }
}


function renderSubjects(subjects) {
    console.log("📦 Rendering subjects:", subjects);

    const subjectsContainer = document.getElementById("subjectsContainer");
    if (!subjectsContainer) {
        console.error("⛔ Error: subjectsContainer not found in DOM!");
        return;
    }

    subjectsContainer.innerHTML = ""; // Մաքրում ենք հին տվյալները

    subjects.forEach(subject => {
        const subjectElement = document.createElement("div");
        subjectElement.classList.add("subject-card");

        // ✅ Ավելացնում ենք դասի տվյալները որպես data-* attributes
        subjectElement.setAttribute("data-id", subject.subject_id);
        subjectElement.setAttribute("data-subject_id", subject.subject_id);
        subjectElement.setAttribute("data-teacher_id", subject.teacher_id);
        subjectElement.setAttribute("data-room_id", subject.room_id);
        subjectElement.setAttribute("data-type_id", subject.type_id);
        subjectElement.setAttribute("data-frequency", subject.weekly_type);

        subjectElement.innerHTML = `
            <h3>${subject.subject_name || "Առարկա չկա"}</h3>
            <p><strong>Դասախոս:</strong> ${subject.teacher_name || "Չի նշված"}</p>
            <p><strong>Լսարան:</strong> ${subject.room_number || "Չի նշված"}</p>
            <p><strong>Դասի Տիպ:</strong> ${subject.type_name || "Չի նշված"}</p>
            <p><strong>Հաճախականություն:</strong> 
                ${subject.weekly_type === "weekly" ? "Ամեն շաբաթ" : subject.weekly_type === "biweekly" ? "2 շաբաթը մեկ" : "Չի նշված"}
            </p>
            <button class="delete-btn" data-id="${subject.subject_id}">❌ Ջնջել</button>
        `;

        // ✅ Ավելացնում ենք click event, որպեսզի pop-up-ը բացվի սեղմելիս
        subjectElement.addEventListener("click", function () {
            openEditPopup(subjectElement);
        });

        subjectsContainer.appendChild(subjectElement);
    });

    console.log("✅ Rendered subjects successfully!");
}

async function loadDropdownData(elementId, apiEndpoint) {
    try {
        console.log(`📡 Fetching ${elementId} from ${apiEndpoint}...`);
        
        const response = await fetch(apiEndpoint);

        if (!response.ok) {
            throw new Error(`❌ Failed to fetch ${elementId}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(`❌ Invalid data format for ${elementId}`);
        }

        const select = document.getElementById(elementId);
        select.innerHTML = `<option value="">Ընտրել...</option>` + 
            data.map(item => `<option value="${item.id}">${item.name || item.number}</option>`).join("");

        console.log(`✅ Loaded ${elementId} successfully`);
    } catch (error) {
        console.error(`⛔ Error fetching ${elementId}:`, error);
    }
}
