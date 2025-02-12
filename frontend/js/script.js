// Ֆունկցիա՝ API-ից ստացված տվյալները ձևաչափելու համար
function normalizeScheduleData(schedule) {
    console.log("🔎 Նորմալիզացիա:", schedule);
    return schedule.map(entry => {
      return {
        day_name: entry.day_name,            // Օր, օրինակ "Երկուշաբթի"
        week_type: entry.week_type,          // 1՝ համարիչ, 2՝ հայտարար
        time_slot: entry.time_slot,          // Օրինակ՝ "09:30-10:50"
        subject_name: entry.subject_name || "Առարկա չի նշված",
        teacher_name: entry.teacher_name || "Դասախոս չի նշված",
        room_number: entry.room_number || "Լսարան չկա",
        type_name: entry.type_name || "Տիպ չկա",
        course_id: entry.course_id,
        week_id: entry.week_id               // կարելի է օգտագործել որպես ավելորդ ֆիլտր
      };
    });
  }
  
  // Ստեղծում ենք աղյուսակի HTML-ի կառուցվածքը՝ տրված օրերի և ժամային սլոտներով
  function generateTableHTML() {
    let html = '<table class="schedule-table"><thead><tr><th>Ժամ</th>';
    const days = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
    days.forEach(day => {
      html += `<th data-day="${day}">${day}</th>`;
    });
    html += '</tr></thead><tbody>';
    const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];
    timeSlots.forEach(slot => {
      html += `<tr><td data-slot="${slot}">${slot}</td>`;
      days.forEach(day => {
        html += `<td class="schedule-cell" data-day="${day}" data-slot="${slot}">-</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }
  
  // Թարմացնում ենք աղյուսակի cell–ները՝ ձևաչափավորված տվյալներով
  function updateTableCells(schedule, containerId) {
    schedule.forEach(entry => {
      let cell = document.querySelector(`#${containerId} .schedule-cell[data-day="${entry.day_name}"][data-slot="${entry.time_slot}"]`);
      if (cell) {
        // Նախորդ կոդում ընտրում ենք լոգոս ըստ դասի տիպի, օրինակ՝
        let logo = "";
        switch (entry.type_name.toLowerCase()) {
          case "լեկցիա":
            logo = "📖";
            break;
          case "գործնական":
            logo = "🛠";
            break;
          case "լաբ":
          case "լաբորատոր":
            logo = "🧪";
            break;
          default:
            logo = "";
        }
        let entryHTML = `<div class="entry">
                             <span class="entry-logo">${logo}</span>
                             <span class="entry-text"><b>${entry.subject_name}</b><br>${entry.teacher_name}</span>
                         </div>`;
        if (cell.innerHTML === "-" || cell.innerHTML.trim() === "") {
          cell.innerHTML = entryHTML;
        } else {
          cell.innerHTML += entryHTML;
        }
        // Վերցնում ենք նաև տվյալները որպես data-ատրիբուտներ՝ պոպափի համար
        cell.dataset.subject = entry.subject_name;
        cell.dataset.teacher = entry.teacher_name;
        cell.dataset.room = entry.room_number;
        cell.dataset.type = entry.type_name;
      }
    });
  }
  
  // Կատարում ենք աղյուսակի կառուցումը՝ ընտրված կուրսի և շաբաթի տեսակի ֆիլտրերով
  async function buildScheduleTable(selectedCourseId, selectedWeekType) {
    try {
      console.log("🔍 Բեռնվում են տվյալները...");
      const response = await fetch('/schedule');
      if (!response.ok) throw new Error('❌ Backend-ից սխալ պատասխան');
      const scheduleData = await response.json();
      // Ֆիլտրում ենք ըստ ընտրած կուրսի
      let courseSchedule = scheduleData.filter(entry => entry.course_id == selectedCourseId);
  
      // Ֆիլտրում ենք ըստ շաբաթի տեսակի, եթե ընտրված է որևէ կոնկրետ տեսակ
      if (selectedWeekType === 1 || selectedWeekType === 2) {
        courseSchedule = courseSchedule.filter(entry => entry.week_type == selectedWeekType);
      }
      const formattedSchedule = normalizeScheduleData(courseSchedule);
  
      // Ստեղծում ենք աղյուսակի HTML-ը
      const tableHTML = generateTableHTML();
      // Թարմացնում ենք մեր բջջում ընդգրկված կոնտեյներին
      // Դուք կարող եք ունենալ մեկ տարբեր բաժին՝ եթե ցուցադրվում է միայն մեկ տիպ,
      // կամ երկու՝ եթե "բոլորը" եք ընտրում:
      let container = document.getElementById('scheduleContainer');
      if (selectedWeekType === "all") {
        // Եթե "բոլորը" է ընտրված, մենք կարող ենք բաժանել երկու հատված – համարյա նույնում, օրինակ՝
        container.innerHTML = `
          <h2>Համարիչ</h2>
          <div id="scheduleNumerator">${tableHTML}</div>
          <h2>Հայտարար</h2>
          <div id="scheduleDenominator">${tableHTML}</div>
        `;
        // Թարմացնում ենք համապատասխան աղյուսակները
        const numeratorData = formattedSchedule.filter(entry => entry.week_type == 1);
        const denominatorData = formattedSchedule.filter(entry => entry.week_type == 2);
        updateTableCells(numeratorData, 'scheduleNumerator');
        updateTableCells(denominatorData, 'scheduleDenominator');
      } else {
        // Եթե ընտրված է որևէ կոնկրետ տեսակը, մենք ցույց տալիս ենք միայն մեկ աղյուսակ
        const title = selectedWeekType == 1 ? "Համարիչ" : "Հայտարար";
        container.innerHTML = `<h2>${selectedCourseId} - ${title}</h2><div id="scheduleSingle">${tableHTML}</div>`;
        updateTableCells(formattedSchedule, 'scheduleSingle');
      }
      console.log("✅ Դասացուցակը թարմացվեց");
    } catch (err) {
      console.error("❌ Աղյուսակի կառուցման սխալ:", err);
    }
  }
  
  // Սահմանում ենք նախնական ընտրված արժեքները՝ կուրս և շաբաթի տեսակը
  let selectedCourseId = 1;
  let selectedWeekType = "all"; // "all" կամ 1 (համարիչ) կամ 2 (հայտարար)
  
  // Կուրսի կոճակների վրա ավելացնում ենք event listener-ներ
  document.querySelectorAll(".course-btn").forEach(button => {
    button.addEventListener("click", () => {
      selectedCourseId = button.dataset.course;
      buildScheduleTable(selectedCourseId, selectedWeekType);
    });
  });
  
  // Շաբաթի տեսակի (համարիչ, հայտարար, կամ բոլորը) կոճակները
  document.getElementById("numeratorBtn").addEventListener("click", () => {
    selectedWeekType = 1;
    buildScheduleTable(selectedCourseId, selectedWeekType);
  });
  document.getElementById("denominatorBtn").addEventListener("click", () => {
    selectedWeekType = 2;
    buildScheduleTable(selectedCourseId, selectedWeekType);
  });
  document.getElementById("allWeeksBtn").addEventListener("click", () => {
    selectedWeekType = "all";
    buildScheduleTable(selectedCourseId, selectedWeekType);
  });
  
  // Պոպափի կառավարում
  document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById("classPopup");
  
    function closePopup() {
      if (!popup) return;
      popup.classList.add("hidden");
      popup.style.display = "none";
      popup.style.visibility = "hidden";
      popup.style.opacity = "0";
      console.log("✔️ Պոպափը փակվեց");
    }
  
    function openPopup(cell) {
      console.log("📌 Բացել ենք պոպափը, տվյալները:", cell.dataset);
      document.getElementById('popupSubject').textContent = cell.dataset.subject || 'N/A';
      document.getElementById('popupTeacher').textContent = cell.dataset.teacher || 'N/A';
      document.getElementById('popupRoom').textContent = cell.dataset.room || 'N/A';
      document.getElementById('popupType').textContent = cell.dataset.type || 'N/A';
  
      const link = document.getElementById('popupLink');
      link.href = cell.dataset.link || '#';
      link.textContent = cell.dataset.link ? 'Zoom' : 'N/A';
  
      popup.classList.remove("hidden");
      popup.style.display = "block";
      popup.style.visibility = "visible";
      popup.style.opacity = "1";
  
      console.log("🎉 Պոպափը բացվեց");
    }
  
    document.querySelectorAll(".close-popup").forEach(button => {
      button.addEventListener("click", (event) => {
        event.stopImmediatePropagation();
        closePopup();
      });
    });
  
    document.addEventListener("mousedown", function (event) {
      if (!popup.contains(event.target) && !event.target.classList.contains("schedule-cell")) {
        closePopup();
      }
    });
  
    document.addEventListener("click", function (event) {
      if (event.target.classList.contains("schedule-cell")) {
        openPopup(event.target);
      }
    });
  });
  
  // Հիմնական՝ պահում ենք, որ էջի բեռնման ժամանակ պետք է ստեղծվի աղյուսակը
  document.addEventListener("DOMContentLoaded", () => {
    buildScheduleTable(selectedCourseId, selectedWeekType);
  });
  