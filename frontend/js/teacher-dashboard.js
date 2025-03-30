document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("teacherToken");

  if (!token) {
    console.warn("❌ Token չկա։");
    return;
  }

  // Բեռնում ենք ուսուցչի անունը
  fetch("/api/teacher/profile", {
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error("Ուսուցչի անունը ստանալ չհաջողվեց");
      return res.json();
    })
    .then((data) => {
      document.getElementById("teacherName").textContent = data.fullName;
    })
    .catch((err) => {
      console.error("❌ Անունը չստացվեց:", err.message);
    });

  // Բեռնում ենք դասացուցակը
  fetch("/api/teacher/schedule", {
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error("Դասացուցակը ստանալ չհաջողվեց");
      return res.json();
    })
    .then((schedule) => {
      // Քո աղյուսակի ֆունկցիան
      renderTeacherSchedule(schedule);

      // Debug
      console.log("➡️ Ստացված token:", token);
    })
    .catch((err) => {
      console.error("❌ Դասացուցակ error:", err.message);
    });
});


// ✅ Այստեղ week_type = "երկուսն էլ" դասերը կրկնօրինակվում են
function renderTeacherSchedule(scheduleData) {
  const container = document.getElementById("scheduleContainer");
  if (!container) {
    console.error("scheduleContainer տարրը չի գտնվել!");
    return;
  }

  // Մաքրում ենք հին բովանդակությունը
  container.innerHTML = "";

  // 1️⃣ week_type = "երկուսն էլ" դասերը կրկնօրինակում ենք
  const expanded = [];
  scheduleData.forEach(item => {
    if (item.week_type === "երկուսն էլ") {
      expanded.push({ ...item, week_type: "համարիչ" });
      expanded.push({ ...item, week_type: "հայտարար" });
    } else {
      expanded.push(item);
    }
  });

  // 2️⃣ Ֆիլտրում ենք ըստ "համարիչ" և "հայտարար"
  const weeklyData = expanded.filter(e => e.week_type === "համարիչ");
  const biweeklyData = expanded.filter(e => e.week_type === "հայտարար");

  // 3️⃣ Կառուցում ենք աղյուսակ(ներ)
  if (weeklyData.length > 0) {
    container.appendChild(buildScheduleTable(weeklyData, "Համարիչ"));
  }
  if (biweeklyData.length > 0) {
    container.appendChild(buildScheduleTable(biweeklyData, "Հայտարար"));
  }

  // Եթե ընդհանրապես ոչինչ չկա
  if (weeklyData.length === 0 && biweeklyData.length === 0) {
    container.innerHTML = "<p>📢 Դասացուցակ չկա:</p>";
  }
}

function buildScheduleTable(data, label) {
  const wrapper = document.createElement("div");

  // Վերնագիր
  const title = document.createElement("h2");
  title.textContent = `Դասացուցակ - ${label} շաբաթ`;
  wrapper.appendChild(title);

  const days = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
  const timeSlots = ["09:30-10:50", "11:00-12:20", "12:50-14:10", "14:20-15:40"];

  // Կառուցում ենք դատարկ grid
  const grid = Array.from({ length: timeSlots.length }, () => Array(days.length).fill(""));

  // Լցնում ենք grid-ը
  data.forEach(item => {
    const dayIndex = days.indexOf(item.day_name);
    const timeIndex = timeSlots.indexOf(item.time_slot);

    if (dayIndex !== -1 && timeIndex !== -1) {
      const subject = item.subject_name || "N/A";
      const courseCode = item.course_code || "N/A";
      const type = item.type_name || "N/A";
      const room = item.room_number || "N/A";

      // Բջիջի info
      const lessonInfo = `
        <div><strong>${subject}</strong></div>
        <div>(${courseCode})</div>
        <div>${type} (${room})</div>
      `;
      grid[timeIndex][dayIndex] = lessonInfo;
    }
  });

  // Ստեղծում ենք աղյուսակ
  const table = document.createElement("table");
  table.classList.add("schedule-table");

  // thead
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Ժամ</th>` + days.map(d => `<th>${d}</th>`).join("");
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // tbody
  const tbody = document.createElement("tbody");
  timeSlots.forEach((slot, i) => {
    const row = document.createElement("tr");
    // Ժամի սյունակ
    const timeCell = document.createElement("td");
    timeCell.textContent = slot;
    row.appendChild(timeCell);

    // Օրերի բջիջներ
    days.forEach((day, j) => {
      const cell = document.createElement("td");
      // ❗ Շրջանցում ենք textContent, քցում ենք innerHTML
      cell.innerHTML = grid[i][j] || "-";
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  wrapper.appendChild(table);
  return wrapper;
}
