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
    
    // Բեռնում ենք կուրսի կոդերը՝ ըստ ընտրված կուրսի
    async function loadCourseCodes(levelId) {
        try {
            const response = await fetch(`/api/courses?levelId=${levelId}`);
            const courses = await response.json();
            courseCodeSelect.innerHTML = `<option value="">Ընտրել կուրսի կոդ...</option>` +
                courses.map(course => `<option value="${course.id}">${course.code}</option>`).join("");
            courseCodeSelect.disabled = false;
        } catch (error) {
            console.error("⛔ Error loading course codes:", error);
        }
    }

    // Բեռնում ենք առարկաները՝ ըստ կուրսի կոդի
    async function loadSubjects(courseCode) {
        try {
            const response = await fetch(`/api/subjects/${courseCode}`);
            const subjects = await response.json();
            console.log("📦 Received subjects:", subjects); // ✅ Ստուգում ենք, ինչ տվյալ է գալիս
    
            if (!Array.isArray(subjects)) {
                throw new Error("Returned data is not an array");
            }
    
            subjectsContainer.innerHTML = subjects.map(subject => `
                <div class="subject-card">
                    <h3>${subject.name}</h3>
                    <p><strong>Դասախոս:</strong> ${subject.teacher}</p>
                    <p><strong>Տիպ:</strong> ${subject.type}</p>
                    <button class="edit-btn" data-id="${subject.id}">✏️ Խմբագրել</button>
                    <button class="delete-btn" data-id="${subject.id}">❌ Ջնջել</button>
                </div>
            `).join("");
    
            saveChangesBtn.disabled = false;
        } catch (error) {
            console.error("⛔ Error loading subjects:", error);
        }
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


