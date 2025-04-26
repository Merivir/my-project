// Ստանում ենք role-ը URL-ով կամ localStorage-ից
function getUserRoleFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("role") || localStorage.getItem("userRole") || "guest";
  }
  
  const userRole = getUserRoleFromURL();
  const isAdmin = userRole === "admin";
  
  // Դասերի տիպերի բախումների աղյուսակ
  const CONFLICTS = {
    "Դաս": ["Դաս", "Գործ", "Գործ1", "Գործ2", "Գործ3", "Լաբ1", "Լաբ2", "Լաբ3", "Լաբ4"],
    "Գործ": ["Դաս", "Գործ", "Գործ1", "Գործ2", "Գործ3", "Լաբ1", "Լաբ2", "Լաբ3", "Լաբ4"],
    "Գործ1": ["Գործ", "Գործ1", "Լաբ1", "Լաբ2", "Դաս"],
    "Գործ2": ["Գործ", "Գործ2", "Լաբ2", "Լաբ3", "Դաս"],
    "Գործ3": ["Գործ", "Գործ3", "Լաբ3", "Լաբ4", "Դաս"],
    "Լաբ1": ["Լաբ1", "Գործ", "Գործ1", "Դաս"],
    "Լաբ2": ["Լաբ2", "Գործ", "Գործ1", "Գործ2", "Դաս"],
    "Լաբ3": ["Լաբ3", "Գործ", "Գործ2", "Գործ3", "Դաս"],
    "Լաբ4": ["Լաբ4", "Գործ", "Գործ3", "Դաս"]
  };
  
  // Ամբողջ դասացուցակի տվյալները (կպահենք գլոբալ փոփոխականում)
  let scheduleData = [];
  
  // Toast ծանուցումներ
  function createToastContainer() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.classList.add('toast-container');
      document.body.appendChild(container);
    }
  }
  
  function showToast(type, title, message, duration = 5000) {
    createToastContainer();
    const toastContainer = document.querySelector('.toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === "success" ? "✓" : "✕";
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Հեռացնում ենք toast-ը որոշակի ժամանակ անց
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
  
  // Բեռնման անիմացիա
  function showLoading(container, message = 'Տվյալների բեռնում...') {
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
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
  // Ավելացրեք այս ֆունկցիաները showSuccess()-ից առաջ

// Բեռնման վիճակը փոփափի մեջ ցուցադրելու գործառույթ
function showLoadingPopup() {
    const popup = document.getElementById("generatePopup");
    popup.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Դասացուցակի կառուցում...</div>
      </div>
    `;
  }
  
  // Սխալի վիճակը ցուցադրելու գործառույթ
  function showErrorPopup(errorMessage = "Դասացուցակի կառուցման ընթացքում առաջացել է սխալ") {
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
    });
  }

  
  document.addEventListener("DOMContentLoaded", function () {
    const scheduleBody = document.querySelector("#scheduleBody");
    const scheduleContainer = document.getElementById("scheduleContainer");
    
    if (scheduleContainer) {
      showLoading(scheduleContainer, 'Դասացուցակի բեռնում...');
    }
    
    fetch("/schedule_approval")
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          if (scheduleBody) {
            scheduleBody.innerHTML = "<tr><td colspan='8' style='text-align:center;'>📢 Տվյալներ չկան</td></tr>";
          }
          if (scheduleContainer) {
            scheduleContainer.innerHTML = "<div style='text-align:center; padding: 2rem; color: #64748b;'>📢 Դասացուցակի տվյալներ չկան</div>";
          }
          return;
        }
  
  
        // Պահպանում ենք ամբողջ դասացուցակի տվյալները
        scheduleData = data;
        renderSchedule(data);
        showToast('success', 'Բեռնված է', 'Դասացուցակը հաջողությամբ բեռնվել է');
      })
      .catch(error => {
        console.error("Error fetching schedule approval data:", error);
        if (scheduleContainer) {
          scheduleContainer.innerHTML = `<div style='text-align:center; padding: 2rem; color: #ef4444;'>❌ Սխալ տվյալների բեռնման ժամանակ: ${error.message}</div>`;
        }
        showToast('error', 'Սխալ', 'Չհաջողվեց բեռնել դասացուցակի տվյալները');
      });
  
    if (isAdmin) {
      const confirmBtn = document.getElementById("confirmBtn");
      const rejectBtn = document.getElementById("rejectBtn");
      
      if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
          // Ցուցադրում ենք բեռնման անիմացիա
          const dashboardContainer = document.querySelector('.dashboard-container');
          if (dashboardContainer) {
            showLoading(dashboardContainer, 'Դասացուցակի հաստատում...');
          }
          
          // Ուղարկում ենք հարցում սերվերին
          fetch("/api/approve-schedule?role=admin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          })
          .then(response => {
            if (!response.ok) {
              throw new Error("Հաստատման սխալ");
            }
            return response.json();
          })
          .then(data => {
            showToast('success', 'Հաստատված է', 'Դասացուցակը հաջողությամբ հաստատվել է');
            setTimeout(() => {
              window.location.href = "/guest";
            }, 1500);
          })
          .catch(error => {
            console.error("Error approving schedule:", error);
            showToast('error', 'Սխալ', 'Չհաջողվեց հաստատել դասացուցակը');
            // Վերականգնում ենք նախկին տեսքը
            fetch("/schedule_approval")
              .then(response => response.json())
              .then(data => renderSchedule(data))
              .catch(error => console.error("Error refetching data:", error));
          });
        });
      }

      if (rejectBtn) {
        rejectBtn.addEventListener("click", function () {
          // Ստեղծում ենք մոդալ պատուհան
          const modal = document.createElement('div');
          modal.className = 'confirm-modal';
          modal.innerHTML = `
            <div class="confirm-modal-content">
              <h3>Հաստատել մերժումը</h3>
              <p>Ցանկանո՞ւմ եք վերաթողարկել ալգորիթմը</p>
              <p class="warning-text"><i class="fas fa-exclamation-triangle"></i> Հակառակ դեպքում դուք չեք կարողանա վերականգնել ներկայիս տարբերակը</p>
              <div class="confirm-modal-buttons">
                <button class="confirm-regen">Վերաթողարկել ալգորիթմը</button>
                <button class="confirm-cancel">Չեղարկել</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
          
          // Վերաթողարկել ալգորիթմը
            modal.querySelector('.confirm-regen').addEventListener('click', function() {
                document.body.removeChild(modal);
                
                // Ստեղծում ենք փոփապ և օվերլեյ եթե դրանք չկան
                if (!document.getElementById("generatePopupOverlay")) {
                const overlay = document.createElement('div');
                overlay.id = "generatePopupOverlay";
                overlay.className = "popup-overlay";
                document.body.appendChild(overlay);
                }
                
                if (!document.getElementById("generatePopup")) {
                const popup = document.createElement('div');
                popup.id = "generatePopup";
                popup.className = "popup-container";
                document.body.appendChild(popup);
                }
                
                // Ցուցադրում ենք օվերլեյը և փոփափը
                const overlay = document.getElementById("generatePopupOverlay");
                const popup = document.getElementById("generatePopup");
                overlay.classList.remove("hidden");
                popup.classList.remove("hidden");
                
                // Ցուցադրում ենք բեռնման փոփափը
                showLoadingPopup();
                
                // Ուղարկում ենք հարցում ալգորիթմի վերաթողարկման համար
                fetch("/api/generate-schedule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
                })
                .then(response => {
                if (!response.ok) {
                    throw new Error("Վերաթողարկման սխալ");
                }
                return response.json();
                })
                .then(data => {
                // Ցուցադրում ենք հաջողության փոփափը
                showSuccess();
                
                // Թարմացնում ենք էջի տվյալները
                const scheduleContainer = document.getElementById("scheduleContainer");
                if (scheduleContainer) {
                    showLoading(scheduleContainer, 'Դասացուցակի բեռնում...');
                }
                
                // Բեռնում ենք նոր դասացուցակը
                return fetch("/schedule_approval");
                })
                .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
                })
                .then(freshData => {
                scheduleData = freshData; // Թարմացնում ենք գլոբալ տվյալները
                renderSchedule(freshData);
                showToast('success', 'Հաջողություն', 'Ալգորիթմը հաջողությամբ վերաթողարկվել է');
                })
                .catch(error => {
                console.error("Error regenerating schedule:", error);
                showErrorPopup("Չհաջողվեց վերաթողարկել ալգորիթմը");
                showToast('error', 'Սխալ', 'Չհաջողվեց վերաթողարկել ալգորիթմը');
                });
            });
          // Չեղարկել
          modal.querySelector('.confirm-cancel').addEventListener('click', function() {
            document.body.removeChild(modal);
          });
          
          // Փակել մոդալը դրսից սեղմելով
          modal.addEventListener('click', function(e) {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          });
        });
      }
    } else {
      const confirmBtn = document.getElementById("confirmBtn");
      const rejectBtn = document.getElementById("rejectBtn");
      
      if (confirmBtn) confirmBtn.remove();
      if (rejectBtn) rejectBtn.remove();
    }
  });
  
  function renderSchedule(data) {
    const container = document.getElementById("scheduleContainer");
    if (!container) return console.error("📛 scheduleContainer not found");
    container.innerHTML = "";
  
    const grouped = {};
    const dualWeekLessons = new Map();
  
    data.forEach(item => {
      const course = item.course;
      const weekType = item.week_type;
      const targetWeekTypes = weekType === "երկուսն էլ" ? ["համարիչ", "հայտարար"] : [weekType];
  
      targetWeekTypes.forEach(type => {
        if (!grouped[course]) grouped[course] = {};
        if (!grouped[course][type]) grouped[course][type] = [];
        grouped[course][type].push({ ...item, originalWeekType: weekType });
      });
    });
  
    const days = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
    const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];
  
    for (const [course, weekTypes] of Object.entries(grouped)) {
      const courseTitle = document.createElement("h2");
      courseTitle.textContent = `📘 ${course}`;
      container.appendChild(courseTitle);
  
      for (const [weekType, lessons] of Object.entries(weekTypes)) {
        const weekTitle = document.createElement("h3");
        weekTitle.textContent = `🕓 Շաբաթվա տեսակ՝ ${weekType}`;
        container.appendChild(weekTitle);
  
        const table = document.createElement("table");
        table.classList.add("schedule-table");
  
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = "<th>Ժամ</th>" + days.map(day => `<th>${day}</th>`).join("");
        thead.appendChild(headerRow);
        table.appendChild(thead);
  
        const tbody = document.createElement("tbody");
        timeSlots.forEach(slot => {
          const row = document.createElement("tr");
          const timeCell = document.createElement("td");
          timeCell.textContent = slot;
          row.appendChild(timeCell);
  
          days.forEach(day => {
            const cell = document.createElement("td");
            cell.id = `cell-${day}-${slot}-${course}-${weekType}`;
            cell.classList.add("dropzone");
            cell.dataset.day = day;
            cell.dataset.slot = slot;
            cell.dataset.course = course;
            cell.dataset.weekType = weekType;
  
            if (isAdmin) {
              cell.addEventListener("dragover", e => e.preventDefault());
              cell.addEventListener("drop", handleDrop);
              
              // Ավելացնում ենք հատուկ դաս, երբ drag-ը տեղի է ունենում դաշտի վրա
              cell.addEventListener("dragenter", function() {
                this.style.backgroundColor = "rgba(61, 125, 217, 0.1)";
              });
              
              cell.addEventListener("dragleave", function() {
                this.style.backgroundColor = "";
              });
            }
  
            const matchingLessons = lessons.filter(l => l.day === day && l.time_slot === slot);
            matchingLessons.forEach(lesson => {
              const div = document.createElement("div");
              div.classList.add("class-block");
              div.draggable = isAdmin;
              div.innerHTML = `<strong>${lesson.subject}</strong><span>${lesson.class_type}, ${lesson.room}, ${lesson.teacher}</span>`;
              div.dataset.id = lesson.id;
              div.dataset.day = day;
              div.dataset.slot = slot;
              div.dataset.course = course;
              div.dataset.week = weekType;
              div.dataset.originalWeek = lesson.originalWeekType || weekType;
              div.dataset.classType = lesson.class_type;
              div.dataset.room = lesson.room;
              div.dataset.teacher = lesson.teacher;
  
              if (isAdmin) {
                div.addEventListener("dragstart", handleDragStart);
                
                // Ավելացնում ենք hover tooltip
                div.title = `Քաշեք այս դասը այլ դաշտ տեղափոխելու համար`;
              }
  
              cell.appendChild(div);
  
              if (lesson.originalWeekType === "երկուսն էլ") {
                if (!dualWeekLessons.has(lesson.id)) dualWeekLessons.set(lesson.id, []);
                dualWeekLessons.get(lesson.id).push(div);
              }
            });
  
            row.appendChild(cell);
          });
  
          tbody.appendChild(row);
        });
  
        table.appendChild(tbody);
        container.appendChild(table);
      }
    }
  
    window._dualWeekLessonsMap = dualWeekLessons;
  }
  
  let draggedElement = null;
  
  function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = "move";
    
    // Ավելացնում ենք դրագի էֆեկտ
    setTimeout(() => {
      this.classList.add('dragging');
    }, 0);
  }
  
  // Ստուգում ենք դասախոսի բախումը
  function checkTeacherConflict(teacher, day, timeSlot, weekType) {
    const conflictingLessons = scheduleData.filter(lesson => 
      lesson.teacher === teacher && 
      lesson.day === day && 
      lesson.time_slot === timeSlot &&
      (lesson.week_type === weekType || lesson.week_type === "երկուսն էլ" || weekType === "երկուսն էլ")
    );
    
    return conflictingLessons.length > 0;
  }
  
  // Ստուգում ենք լսարանի բախումը
  function checkRoomConflict(room, day, timeSlot, weekType) {
    const conflictingLessons = scheduleData.filter(lesson => 
      lesson.room === room && 
      lesson.day === day && 
      lesson.time_slot === timeSlot &&
      (lesson.week_type === weekType || lesson.week_type === "երկուսն էլ" || weekType === "երկուսն էլ")
    );
    
    return conflictingLessons.length > 0;
  }
  
  // Ստուգում ենք դասի տիպի բախումը
  function checkTypeConflict(classType, existingClassType) {
    if (!classType || !existingClassType) return false;
    
    return CONFLICTS[classType] && CONFLICTS[classType].includes(existingClassType);
  }
  
  async function handleDrop(e) {
    e.preventDefault();
    
    // Վերականգնում ենք նորմալ ոճը
    this.style.backgroundColor = "";
    
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
    }
  
    // Հեռացնում ենք «երկուսն էլ» սահմանափակումը
    // if (draggedElement?.dataset.originalWeek === "երկուսն էլ" && draggedElement.dataset.week !== "համարիչ") {
    //   showToast('error', 'Սխալ', '«Երկուսն էլ» դասերը կարող եք տեղափոխել միայն համարիչ աղյուսակից:');
    //   return;
    // }
  
    if (!draggedElement || this.contains(draggedElement)) return;
  
    const newDay = this.dataset.day;
    const newSlot = this.dataset.slot;
    const newWeekType = this.dataset.weekType;
    
    // Բախման ստուգումներ
    
    // 1. Ստուգում ենք դասախոսի բախումը
    const teacher = draggedElement.dataset.teacher;
    if (checkTeacherConflict(teacher, newDay, newSlot, newWeekType)) {
      showToast('error', 'Դասախոսի բախում', 'Դասախոսը արդեն այդ ժամին դաս ունի');
      return;
    }
    
    // 2. Ստուգում ենք լսարանի բախումը
    const room = draggedElement.dataset.room;
    if (checkRoomConflict(room, newDay, newSlot, newWeekType)) {
      showToast('error', 'Լսարանի բախում', 'Լսարանը զբաղված է տվյալ ժամին');
      return;
    }
    
    // 3. Ստուգում ենք դասի տիպերի բախումը
    const classType = draggedElement.dataset.classType;
    
    // Ստուգում ենք այն դասերը, որոնք արդեն կան այդ բջջում
    const existingClasses = Array.from(this.querySelectorAll('.class-block'));
    for (const existingClass of existingClasses) {
      const existingClassType = existingClass.dataset.classType;
      
      if (checkTypeConflict(classType, existingClassType)) {
        showToast('error', 'Խմբերի բախում', `Խմբերի բախում․ ${classType}-ն չի կարող համակցվել ${existingClassType}-ի հետ`);
        return;
      }
    }
  
    draggedElement.dataset.day = newDay;
    draggedElement.dataset.slot = newSlot;
    draggedElement.classList.add("modified");
    
    // Ավելացնում ենք անիմացիա
    draggedElement.style.animation = 'none';
    setTimeout(() => {
      draggedElement.style.animation = '';
    }, 10);
    
    this.appendChild(draggedElement);
  
    const id = draggedElement.dataset.id;
    if (window._dualWeekLessonsMap?.has(id)) {
      const related = window._dualWeekLessonsMap.get(id);
      related.forEach(copy => {
        copy.dataset.day = newDay;
        copy.dataset.slot = newSlot;
        copy.innerHTML = draggedElement.innerHTML;
        copy.classList.add("modified");
  
        const cellId = `cell-${newDay}-${newSlot}-${copy.dataset.course}-${copy.dataset.week}`;
        const cell = document.getElementById(cellId);
        if (cell && copy.parentNode !== cell) {
          copy.parentNode?.removeChild(copy);
          cell.appendChild(copy);
        }
      });
    }
  
    showToast('success', 'Թարմացվում է', 'Դասի դիրքը թարմացվում է...');
  
    const payload = {
      id,
      new_day: newDay,
      new_slot: newSlot,
      course: draggedElement.dataset.course,
      week_type: draggedElement.dataset.originalWeek || draggedElement.dataset.week
    };
  
    try {
      const res = await fetch("/api/schedule/update-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([payload])
      });
  
      const result = await res.json();
      if (!res.ok) {
        showToast('error', 'Սխալ', 'Չհաջողվեց պահպանել դիրքը');
        console.error(result);
      } else {
        showToast('success', 'Հաջողություն', 'Դասի դիրքը հաջողությամբ թարմացվել է');
        
        // Թարմացնում ենք ամբողջական դասացուցակը
        try {
          const fresh = await fetch("/schedule_approval");
          const updated = await fresh.json();
          scheduleData = updated; // Թարմացնում ենք գլոբալ տվյալները
          renderSchedule(updated);
        } catch (err) {
          console.error("Չհաջողվեց թարմացնել ամբողջ դասացուցակը", err);
        }
      }
    } catch (err) {
      console.error("❌ Error during auto-save:", err);
      showToast('error', 'Սխալ', 'Չհաջողվեց պահպանել փոփոխությունները');
    }
  }
  
  function collectModifiedLessons() {
    const modifiedLessons = Array.from(document.querySelectorAll(".class-block.modified")).map(el => ({
      id: el.dataset.id,
      new_day: el.dataset.day,
      new_slot: el.dataset.slot,
      course: el.dataset.course,
      week_type: el.dataset.originalWeek || el.dataset.week
    }));
    
    // Ցուցադրում ենք փոփոխված տարրերի քանակը
    if (modifiedLessons.length > 0) {
      showToast('success', 'Փոփոխված դասեր', `${modifiedLessons.length} դաս փոփոխվել է`);
    }
    
    return modifiedLessons;
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .dragging {
        opacity: 0.6;
        transform: scale(0.95);
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .class-block {
        animation: fadeIn 0.3s ease-out;
      }
      
      .modified {
        position: relative;
      }
      
      .modified::after {
        content: "✏️";
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 12px;
      }
      
      .confirm-modal {
        animation: fadeIn 0.3s ease-out;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .confirm-modal-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      }
      
      .confirm-modal h3 {
        margin-bottom: 1rem;
        color: var(--primary, #0a2a55);
      }
      
      .confirm-modal p {
        margin-bottom: 1.5rem;
      }
      
      .confirm-modal-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .confirm-modal button {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
      }
      
      .confirm-yes {
        background-color: var(--error, #ef4444);
        color: white;
      }
      
      .confirm-no {
        background-color: #e2e8f0;
        color: #1e293b;
      }
      
      .confirm-yes:hover {
        background-color: #e43c3c;
      }
      
      .confirm-no:hover {
        background-color: #d1d5db;
      }
      
      .confirm-regen {
        background-color: var(--accent, #3d7dd9);
        color: white;
      }
  
      .confirm-regen:hover {
        background-color: #346bc0;
      }
      
      .loading-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
      }
  
      .loading-modal-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 300px;
        width: 90%;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      }
  
      .loading-modal .loading-spinner {
        width: 60px;
        height: 60px;
        margin-bottom: 1.5rem;
      }
  
      .loading-modal p {
        font-size: 1.1rem;
        color: var(--primary, #0a2a55);
        font-weight: 500;
        text-align: center;
      }
        .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.7);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        }

        .popup-container {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        z-index: 2001;
        box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        }

        .popup-container.hidden,
        .popup-overlay.hidden {
        display: none;
        }

        .result-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 120px;
        }

        .result-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
        font-size: 28px;
        color: white;
        }
                
        .success .result-icon {
        background-color: var(--success, #10b981);
        }

        .error .result-icon {
        background-color: var(--error, #ef4444);
        }

        .result-text {
        font-size: 16px;
        font-weight: 500;
        }

        .success .result-text {
        color: var(--success, #10b981);
        }

        .error .result-text {
        color: var(--error, #ef4444);
        }

        /* Checkmark անիմացիա */
        .checkmark {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: block;
        stroke-width: 3;
        stroke: white;
        stroke-miterlimit: 10;
        box-shadow: inset 0px 0px 0px transparent;
        animation: fill 0.4s ease-in-out .4s forwards, scale 0.3s ease-in-out 0.9s both;
        }

        .checkmark-circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        stroke-width: 3;
        stroke-miterlimit: 10;
        stroke: white;
        fill: none;
        animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark-check {
        transform-origin: 50% 50%;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }

        @keyframes stroke {
        100% {
            stroke-dashoffset: 0;
        }
        }

        @keyframes scale {
        0%, 100% {
            transform: none;
        }
        50% {
            transform: scale3d(1.1, 1.1, 1);
        }
        }

        @keyframes fill {
        100% {
            box-shadow: inset 0px 0px 0px 30px transparent;
        }
        }
    `;
    document.head.appendChild(styleElement);
  });