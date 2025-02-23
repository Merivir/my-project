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
        if (!subjectsContainer) {
            console.error("⛔ Error: subjectsContainer not found in DOM!");
            return;
        }
    
        subjectsContainer.innerHTML = subjects.map(subject => `
            <div class="subject-card">
                <h3>${subject.subject_name || "Առարկա չկա"}</h3>
                <p><strong>Դասախոս:</strong> ${subject.teacher_name || "Չի նշված"}</p>
                <p><strong>Լսարան:</strong> ${subject.room_number || "Չի նշված"}</p>
                <p><strong>Դասի Տիպ:</strong> ${subject.type_name || "Չի նշված"}</p>
                <p><strong>Հաճախականություն:</strong> 
                    ${subject.weekly_type === "weekly" ? "Ամեն շաբաթ" : subject.weekly_type === "biweekly" ? "2  շաբաթը մեկ" : "Չի նշված"}
                </p>
                <button class="delete-btn" data-id="${subject.subject_id}">❌ Ջնջել</button>
            </div>
        `).join("");
    
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

    // Բեռնում ենք կուրսերը սկզբում
    loadCourses();
});


