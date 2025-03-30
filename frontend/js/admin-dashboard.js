document.addEventListener("DOMContentLoaded", async () => {
    // 1. Բեռնում ենք ուսուցիչի անձնական տվյալները
    try {
      const profileResponse = await fetch('/api/teacher/profile', {
        headers: {
          'Authorization': Bearer ${localStorage.getItem('teacherToken')}
        }
      });
      if (!profileResponse.ok) {
        throw new Error("Սխալ է բեռնելու ուսուցիչի տվյալները");
      }
      const profileData = await profileResponse.json();
      // Teacher-ի անունը դնում ենք HTML-ում, օրինակ՝ <span id="teacherName"></span>
      document.getElementById("teacherName").innerText = profileData.fullName;
    } catch (error) {
      console.error("Error loading teacher profile:", error);
    }
    
    // 2. Բեռնում ենք դասացուցակի տվյալները
    try {
      const response = await fetch('/api/teacher/schedule', {
        headers: {
          'Authorization': Bearer ${localStorage.getItem('teacherToken')}
        }
      });
      if (!response.ok) {
        throw new Error("Սխալ է բեռնելու իմ դասացուցակը");
      }
      const scheduleData = await response.json();
      renderSchedule(scheduleData);
    } catch (error) {
      console.error("Error loading schedule:", error);
      document.getElementById("scheduleContainer").innerHTML = "<p>Տվյալներ չեն հայտնաբերվել</p>";
    }
  });
  
  /**
   * Գեներացնում է աղյուսակ, որտեղ յուրաքանչյուր row – schedule_editable-ի գրառում
   */
  function renderSchedule(data) {
    const container = document.getElementById("scheduleContainer");
    container.innerHTML = "";
  
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>Դասացուցակն դեռ չի կազմվել</p>";
      return;
    }
  
    // Ստեղծում ենք աղյուսակ
    const table = document.createElement("table");
    table.classList.add("schedule-table");
  
    // Thead
    const thead = document.createElement("thead");
    thead.innerHTML = 
      <tr>
        <th>Օր</th>
        <th>Ժամ</th>
        <th>Առարկա</th>
        <th>Դասարան</th>
        <th>Հաճախականություն</th>
      </tr>
    ;
    table.appendChild(thead);
  
    // Tbody
    const tbody = document.createElement("tbody");
    data.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = 
        <td>${item.day || "-"}</td>
        <td>${item.time_slot || "-"}</td>
        <td>${item.subject || "-"}</td>
        <td>${item.room || "-"}</td>
        <td>${item.week_type || "-"}</td>
      ;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
  
    container.appendChild(table);
  }  