// Global փոփոխականներ
let scheduleData = []; // Ամեն դասացուցակի տվյալները
let currentCourse = "1"; // Սկզբում ընտրում ենք առաջին կուրսը

// Mapping՝ կոճակի համար՝ համարի համար
const courseMap = {
  "1": "ՄԹ440",
  "2": "ՄԹ448",
  "3": "Մ426",
  "4": "ՄԹ459"
};


// Օրերի և ժամային սլոտների ցուցակը (ստանդարտ)
const days = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];

// Եթե API-ի պատասխաններում թվային օրերի կամ ժամային սլոտների դաշտեր չկան,
// մենք կստեղծենք՝ օգտագործելով արդեն տեքստային արժեքները "day_name" և "time_slot"
// (հետևյալ mapping-ը օգտագործվում է նախորդ կոդում, բայց այստեղ մենք դրանք անմիջապես համեմատում ենք)

document.addEventListener("DOMContentLoaded", () => {
  console.log("📌 Script loaded: initializing schedule display...");

  // Կապում ենք կուրսի ընտրության կոճակների իրադարձությունները
  document.querySelectorAll(".course-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      currentCourse = this.dataset.course;
      // 'active' դասը ավելացնում ենք ընտրված կոճակի համար
      document.querySelectorAll(".course-btn").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      filterScheduleByCourse(currentCourse);
    });
  });

  // Բեռնում ենք ամբողջ դասացուցակի տվյալները API-ից
  loadSchedule().then(() => {
    // Սկզբում ֆիլտրում ենք տվյալները՝ ընտրված կուրսի համար (հիմա "ՄԹ440")
    filterScheduleByCourse(currentCourse);
  });

  // Թարմացնում ենք տվյալները ամեն 10 վայրկյան
  setInterval(() => {
    loadSchedule().then(() => {
      filterScheduleByCourse(currentCourse);
    });
  }, 10000);

  // Պոպափ պատուհանի փակման համար, եթե կլիկվում ենք արտօրինակ տարածքում
  document.addEventListener("click", function (event) {
    const popup = document.getElementById("classPopup");
    if (popup && !popup.contains(event.target)) {
      closePopup();
    }
  });
});


//
// 1. Ֆունկցիա՝ ամբողջ դասացուցակի տվյալների բեռնում API-ից
//
async function loadSchedule(courseCode) {
    try {
      console.log("🔍Fetching schedule data for", courseCode);
      const response = await fetch(`/schedule?course=${courseCode}`);
      if (!response.ok) throw new Error('❌ Backend error');
      scheduleData = await response.json();
      console.log("📌 Schedule data loaded:", scheduleData.slice(0, 5)); 
    } catch (err) {
      console.error("❌ Error loading schedule:", err);
    }
  }
  

//
// 2. Ֆունկցիա՝ ընտրված կուրսի գրառումների ֆիլտրում
//
function filterScheduleByCourse(courseNumber) {
  // Ստանում ենք ընտրված կուրսի կոդը, օրինակ "ՄԹ440"
  const selectedCourseCode = courseMap[courseNumber];
  console.log("Ընտրված կուրսի կոդ:", selectedCourseCode);

  // Եթե API-ի պատասխաններում գրառումներում չունենք "course" կամ "course_code" դաշտ,
  // ապա ցույց կտանք բոլոր գրառումները (կամ կարող եք փոփոխել՝ միայն մի կուրսի համար)
  const filteredEntries = scheduleData.filter(entry => {
    if (!entry.course && !entry.course_code) {
      return true;
    }
    const entryCourse = (entry.course || entry.course_code || "").trim();
    return entryCourse === selectedCourseCode.trim();
  });

  // Բաժանում ենք գրառումները՝ ըստ week_type-ի
  // Համարիչ՝ եթե week_type-ը պարունակում է "համար" (case-insensitive)
  // Հայտարար՝ եթե week_type-ը պարունակում է "հայտարար"
  const numeratorEntries = filteredEntries.filter(entry => {
    return entry.week_type.toLowerCase().includes("համար");
  });
  const denominatorEntries = filteredEntries.filter(entry => {
    return entry.week_type.toLowerCase().includes("հայտարար");
  });

  // Ստեղծում ենք աղյուսակները համապատասխան կոնտեյների մեջ
  buildScheduleTable("scheduleNumerator", numeratorEntries);
  buildScheduleTable("scheduleDenominator", denominatorEntries);
}

//
// 3. Ֆունկցիա՝ HTML աղյուսակի կառուցում տվյալ գրառումների հիման վրա
//
function buildScheduleTable(containerId, entries) {
  // Ստեղծում ենք table-ի կառուցվածքը
  const table = document.createElement("table");
  table.className = "schedule-table";

  // Հեդեր
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const thTime = document.createElement("th");
  thTime.textContent = "Ժամ";
  headerRow.appendChild(thTime);
  days.forEach(day => {
    const th = document.createElement("th");
    th.textContent = day;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Թbody՝ ժամային սլոտներով
  const tbody = document.createElement("tbody");
  timeSlots.forEach(slot => {
    const row = document.createElement("tr");
    // Ժամային սլոտի սյուն
    const tdSlot = document.createElement("td");
    tdSlot.textContent = slot;
    row.appendChild(tdSlot);

    // Ամեն օրվա համար բջիջ
    days.forEach(day => {
      const cell = document.createElement("td");
      cell.className = "schedule-cell";
      cell.dataset.day = day;
      cell.dataset.slot = slot;

      // Հիմա ֆիլտրում ենք API-ից ստացված գրառումները՝ օգտագործելով դաշտերը՝
      // entry.day_name և entry.time_slot, որոնք արդեն տեքստային են:
      const cellEntries = entries.filter(entry => {
        return entry.day_name === day && entry.time_slot === slot;
      });

      // Եթե բջիջում կան գրառումներ, դրանք ցուցադրում ենք
      cellEntries.forEach(entry => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "entry";

        // Ըստ entry.type_name ընտրում ենք emoji
        let logo = "";
        const typeText = entry.type_name ? entry.type_name.toLowerCase() : "";
        if (typeText.includes("գործ")) {
          logo = "📝";
        } else if (typeText.includes("դաս")) {
          logo = "📚";
        } else if (typeText.includes("լաբ")) {
          logo = "🔬";
        } else {
          logo = "❓";
        }

        entryDiv.innerHTML = `<span class="entry-logo">${logo}</span>
                              <span class="entry-text">
                                <strong>${entry.subject_name}</strong><br>
                                ${entry.teacher_name}<br>
                                ${entry.room_number}
                              </span>`;

        // Պահպանում ենք տվյալները, որպեսզի փոփափ բացելիս օգտագործենք
        entryDiv.dataset.subject = entry.subject_name;
        entryDiv.dataset.teacher = entry.teacher_name;
        entryDiv.dataset.room = entry.room_number;
        entryDiv.dataset.type = entry.type_name;

        // Ավելացնում ենք կլիկի իրադարձություն՝ փոփափ բացելու համար
        entryDiv.addEventListener("click", function (e) {
          e.stopPropagation();
          openPopup(entryDiv);
        });

        cell.appendChild(entryDiv);
      });

      // Եթե բջիջը դատարկ է, ցուցադրում ենք "-"
      if (cell.innerHTML.trim() === "") {
        cell.textContent = "-";
      }
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // Ավելացնում ենք աղյուսակը համապատասխան կոնտեյնரில்
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  container.appendChild(table);
}


//
// 4. Փոփափ պատուհանի բացման ֆունկցիա
//
function openPopup(element) {
  const popup = document.getElementById("classPopup");
  if (!popup) return;
  document.getElementById("popupSubject").textContent = element.dataset.subject || "Առարկա չստացվեց";
  document.getElementById("popupTeacher").textContent = element.dataset.teacher || "Դասախոս չստացվեց";
  document.getElementById("popupRoom").textContent = element.dataset.room || "Լսարան չստացվեց";
  document.getElementById("popupType").textContent = element.dataset.type || "Տիպ չստացվեց";

  // Օրինակ՝ եթե կա լրացուցիչ հղում, ավելացնել կարելի է, հիմա սահմանվում է որպես "Zoom"
  const link = document.getElementById("popupLink");
  link.href = "#";
  link.textContent = "Zoom";

  popup.classList.remove("hidden");
  popup.style.display = "block";
  popup.style.visibility = "visible";
  popup.style.opacity = "1";
}

//
// 5. Փոփափ պատուհանի փակման ֆունկցիա
//
function closePopup() {
  const popup = document.getElementById("classPopup");
  if (!popup) return;
  popup.classList.add("hidden");
  popup.style.display = "none";
  popup.style.visibility = "hidden";
  popup.style.opacity = "0";
}
