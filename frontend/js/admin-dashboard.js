const daysOfWeek = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
const timeSlots = ["I", "II", "III", "IV"];
let isConfirmed = false;

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("generatePopup");
  const overlay = document.getElementById("generatePopupOverlay");
  const openBtn = document.getElementById("openGeneratePopup");
  const confirmBtn = document.getElementById("confirmGenerateBtn");
  const cancelBtn = document.getElementById("cancelGenerateBtn");

  if (!popup || !overlay || !openBtn || !confirmBtn || !cancelBtn) {
    console.error("❌ Մեկ կամ մի քանի popup տարրեր չգտնվեցին HTML-ում");
    return;
  }

  openBtn.addEventListener("click", () => {
    popup.classList.remove("hidden");
    overlay.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
    overlay.classList.add("hidden");
  });
  
  // Փոփափի overlay-ի սեղման գործառույթ
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      popup.classList.add("hidden");
      overlay.classList.add("hidden");
    }
  });

  confirmBtn.addEventListener("click", async () => {
    // Ցուցադրում ենք բեռնման անիմացիան
    showLoading();
    
    try {
      const res = await fetch("/api/generate-schedule", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        // Ցուցադրում ենք հաջողության անիմացիան
        setTimeout(() => {
          showSuccess();
        }, 1000);
        
        // Ուղղորդում ենք դեպի հաստատման էջ 2 վայրկյան անց
        setTimeout(() => {
          window.location.href = "/schedule-approval?role=admin";
        }, 3000);
      } else {
        // Ցուցադրում ենք սխալի անիմացիան
        setTimeout(() => {
          showError(data.error || "Դասացուցակի կառուցման ընթացքում առաջացել է սխալ");
        }, 1000);
      }
    } catch (err) {
      console.error("Սխալ ալգորիթմի ընթացքում:", err);
      // Ցուցադրում ենք սխալի անիմացիան
      setTimeout(() => {
        showError("Սերվերի հետ կապ հաստատելու ընթացքում սխալ առաջացավ");
      }, 1000);
    }
  });
});

// Բեռնման վիճակը փոփափի մեջ ցուցադրելու գործառույթ
function showLoading() {
  const popup = document.getElementById("generatePopup");
  popup.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Դասացուցակի կառուցում...</div>
    </div>
  `;
}

// Հաջողության վիճակը ցուցադրելու գործառույթ
function showSuccess() {
  const popup = document.getElementById("generatePopup");
  popup.innerHTML = `
    <div class="result-container success">
      <div class="result-icon">
        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
          <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      <div class="result-text">Դասացուցակը բարեհաջող կառուցվել է</div>
      <button class="close-popup">Փակել</button>
    </div>
  `;

  // Փակման կոճակի գործառույթ
  document.querySelector('.close-popup').addEventListener('click', () => {
    const popup = document.getElementById("generatePopup");
    const overlay = document.getElementById("generatePopupOverlay");
    popup.classList.add("hidden");
    overlay.classList.add("hidden");
  });
}

// Սխալի վիճակը ցուցադրելու գործառույթ
function showError(errorMessage = "Դասացուցակի կառուցման ընթացքում առաջացել է սխալ") {
  const popup = document.getElementById("generatePopup");
  popup.innerHTML = `
    <div class="result-container error">
      <div class="result-icon">
        <i class="fas fa-times"></i>
      </div>
      <div class="result-text">${errorMessage}</div>
      <button class="close-popup">Փակել</button>
    </div>
  `;

  // Փակման կոճակի գործառույթ
  document.querySelector('.close-popup').addEventListener('click', () => {
    const popup = document.getElementById("generatePopup");
    const overlay = document.getElementById("generatePopupOverlay");
    popup.classList.add("hidden");
    overlay.classList.add("hidden");
    
    // Ձևափոխում ենք փոփափը սկզբնական վիճակի
    setTimeout(() => {
      popup.innerHTML = `
        <p>Ցանկանում եք ստեղծել դասացուցակ՝ հիմնվելով առկա բոլոր սահմանափակումների վրա՞</p>
        <div class="popup-buttons">
          <button id="confirmGenerateBtn">Այո</button>
          <button id="cancelGenerateBtn">Չեղարկել</button>
        </div>
      `;
      
      // Նորից միացնում ենք նախկին իրադարձության մշակիչները
      document.getElementById('confirmGenerateBtn').addEventListener('click', 
        document.querySelector('script').confirmGenerateBtn_onClick);
      document.getElementById('cancelGenerateBtn').addEventListener('click', () => {
        popup.classList.add("hidden");
        overlay.classList.add("hidden");
      });
    }, 300);
  });
}

// Բեռնում ենք դասախոսների ցանկը
async function loadTeachers() {
  try {
    const response = await fetch('/api/teachers');
    if (!response.ok) throw new Error("Server Error: " + response.status);

    const teachers = await response.json();
    const teacherSelect = document.getElementById("teacherSelect");

    teacherSelect.innerHTML = '<option value="">Ընտրել դասախոս</option>';
    teachers.forEach(teacher => {
      const option = document.createElement("option");
      option.value = teacher.id;
      option.textContent = teacher.name;
      teacherSelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error loading teachers:", error);
  }
}

async function updateTeacherInfo(teacherId) {
  if (!teacherId) {
    document.getElementById("teacher-info").innerHTML = "Ընտրեք դասախոս";
    return;
  }

  try {
    const response = await fetch(`/api/schedule/teacher/${teacherId}`);

    if (!response.ok) {
      console.error(`Server Error: ${response.status}`);
      document.getElementById("teacher-info").innerHTML = "Տվյալներ չեն գտնվել";
      return;
    }

    const data = await response.json();
    document.getElementById("teacher-info").innerHTML = `
      <strong>${data.teacherName}</strong> ունի <strong>${data.subjectCount}</strong> դասաժամ:
    `;
  } catch (error) {
    console.error("Error fetching teacher schedule:", error);
    document.getElementById("teacher-info").innerHTML = "Տվյալներ չեն գտնվել";
  }
}

async function saveAvailability() {
  const teacherId = document.getElementById("teacherSelect").value;
  if (!teacherId) {
    alert(" Խնդրում ենք ընտրել դասախոս");
    return;
  }

  const primarySlots = Array.from(document.querySelectorAll("#primarySlotsContainer .time-slot-checkbox:checked"))
                            .map(checkbox => checkbox.value);
  const backupSlots = Array.from(document.querySelectorAll("#backupSlotsContainer .time-slot-checkbox:checked"))
                           .map(checkbox => checkbox.value);

  if (!primarySlots.length && !backupSlots.length) {
    alert(" Խնդրում ենք նշել առնվազն մեկ դասաժամ");
    return;
  }

  try {
    const response = await fetch('/api/schedule/save-availability', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        teacher_id: teacherId,
        primary_slots: primarySlots,
        backup_slots: backupSlots
      })
    });

    const data = await response.json();
    if (response.ok) {
      alert(" Ժամերը հաջողությամբ պահպանվեցին!");
    } else {
      alert(` Սխալ: ${data.error}`);
    }
  } catch (error) {
    console.error("Error saving availability:", error);
    alert("Սերվերի սխալ");
  }
}

// Ստեղծում ենք checkbox-ները
function generateTimeSlotCheckboxes(containerId) {
  const container = document.getElementById(containerId);
  
  // Ստուգում ենք, եթե վերնագիրը արդեն կա, չավելացնենք կրկնակի
  if (!container.previousElementSibling || container.previousElementSibling.tagName !== "H2") {
    const title = document.createElement("h2");
    title.textContent = containerId === "primarySlotsContainer" ? "Առաջնային դասաժամեր" : "Երկրորդային դասաժամեր";
    title.classList.add("schedule-title");
    container.parentNode.insertBefore(title, container);
  }

  // Ջնջում ենք միայն աղյուսակը, ոչ թե վերնագիրը
  container.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("schedule-table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th></th>" + timeSlots.map(slot => `<th>${slot}</th>`).join("");
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  daysOfWeek.forEach((day, dayIndex) => {
    const row = document.createElement("tr");

    const dayLabel = document.createElement("td");
    dayLabel.textContent = day;
    row.appendChild(dayLabel);

    timeSlots.forEach((_, slotIndex) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("time-slot-checkbox");
      checkbox.value = `${dayIndex + 1}-${slotIndex + 1}`;
      checkbox.disabled = true;

      const cell = document.createElement("td");
      cell.appendChild(checkbox);
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// Թույլատրում կամ անջատում ենք checkbox-ները
function toggleCheckboxes(enable) {
  document.querySelectorAll(".time-slot-checkbox").forEach(checkbox => {
    checkbox.disabled = !enable;
  });
}

// Թարմացնում ենք "Հաստատել ժամերը" կոճակը
function updateConfirmButton() {
  const anyChecked = document.querySelectorAll(".time-slot-checkbox:checked").length > 0;
  document.getElementById("confirmAvailability").disabled = !anyChecked; 
}

async function confirmAvailability() {
  const teacherId = document.getElementById("teacherSelect").value;
  if (!teacherId) {
    alert(" Խնդրում ենք ընտրել դասախոս");
    return;
  }

  const primarySlots = Array.from(document.querySelectorAll("#primarySlotsContainer .time-slot-checkbox:checked"))
                            .map(checkbox => checkbox.value);
  const backupSlots = Array.from(document.querySelectorAll("#backupSlotsContainer .time-slot-checkbox:checked"))
                           .map(checkbox => checkbox.value);

  if (!primarySlots.length && !backupSlots.length) {
    alert("Խնդրում ենք նշել առնվազն մեկ դասաժամ");
    return;
  }

  try {
    console.log(" Ուղարկում ենք API-ին՝ /api/schedule/save-availability");

    const response = await fetch('/api/schedule/save-availability', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        teacher_id: teacherId,
        primary_slots: primarySlots,
        backup_slots: backupSlots
      })
    });

    console.log(" Պատասխան ստացանք:", response);

    const data = await response.json();
    if (response.ok) {
      alert(" Ժամերը հաջողությամբ հաստատվեցին և պահվեցին բազայում!");
      isConfirmed = true; //  Ավելացվել է, որ հաստատումը ճանաչվի
      document.getElementById("generateSchedule").disabled = false; // Թույլատրում ենք հաջորդ քայլը
    } else {
      alert(` Սխալ: ${data.error}`);
    }
  } catch (error) {
    console.error(" Error saving availability:", error);
    alert(" Սերվերի սխալ");
  }
}

//  Ստեղծում ենք դասացուցակը
async function generateSchedule() {
  console.log("📌 generateSchedule() ԿԱՆՉՎԵՑ");  // 👈 Սա կօգնի տեսնել քանի անգամ է կկանչվում

  if (!isConfirmed) {
    alert(" Խնդրում ենք նախ հաստատել ժամերը:");
    return;
  }

  //  Ցույց ենք տալիս բեռնման նշանը
  document.getElementById("loadingSpinner").style.display = "block";

  try {
    //  Կանչում ենք backend-ի ալգորիթմը
    const response = await fetch("/api/generate-schedule", { method: "POST" });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log(" Սերվերի պատասխանը:", data);

    //  Եթե ամեն ինչ հաջող է, տեղափոխվում ենք `schedule-approval.html`
    alert(" Դասացուցակը կազմվել է հաջողությամբ!");
    window.location.href = "/schedule-approval?role=admin.html";

  } catch (error) {
    console.error(" Սխալ դասացուցակ կազմելիս:", error);
    alert(" Սխալ՝ դասացուցակը կազմելու ժամանակ");
  } finally {
    // Հանում ենք բեռնման նշանը, եթե ինչ-որ բան սխալ գնաց
    document.getElementById("loadingSpinner").style.display = "none";
  }
}

// Պահում ենք որպես հղում, որպեսզի կարողանանք այն վերականգնել
document.querySelector('script').confirmGenerateBtn_onClick = document.getElementById('confirmGenerateBtn').onclick;