const daysOfWeek = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
const timeSlots = ["I", "II", "III", "IV"];
let isConfirmed = false;
let teacherId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("teacherToken");
  if (!token) {
    alert("Դուրս եք մնացել համակարգից");
    return;
  }

  await fetchProfile(token);
  generateTimeSlotCheckboxes("primarySlotsContainer");
  generateTimeSlotCheckboxes("backupSlotsContainer");

  await loadAvailability(token);

  document.getElementById("confirmAvailability").addEventListener("click", async () => {
    if (isConfirmed) {
      toggleCheckboxes(true);
      document.getElementById("confirmAvailability").textContent = "✅ Հաստատել ժամերը";
      isConfirmed = false;
    } else {
        await saveAvailability();
    }
  });
});

async function fetchProfile(token) {
  try {
    const res = await fetch("/api/teacher/profile", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    teacherId = data.id;
    document.getElementById("teacherName").textContent = data.fullName;
  } catch (err) {
    console.error("❌ Cannot load profile:", err.message);
  }
}

function generateTimeSlotCheckboxes(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("schedule-table");

  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th></th>" + timeSlots.map(t => `<th>${t}</th>`).join("") + "</tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  daysOfWeek.forEach((day, dIndex) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${day}</td>` + timeSlots.map((_, tIndex) => {
      const id = `${containerId}-${dIndex + 1}-${tIndex + 1}`;
      return `<td><input type="checkbox" class="time-slot-checkbox" id="${id}" value="${dIndex + 1}-${tIndex + 1}"></td>`;
    }).join("");
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}


async function saveAvailability() {
    const primary_slots = Array.from(document.querySelectorAll("#primarySlotsContainer .time-slot-checkbox:checked"))
      .map(cb => cb.value);
    const backup_slots = Array.from(document.querySelectorAll("#backupSlotsContainer .time-slot-checkbox:checked"))
      .map(cb => cb.value);
  
      console.log("🧩 Primary:", primary_slots);
      console.log("🧩 Backup:", backup_slots);

    if (!primary_slots.length && !backup_slots.length) {
      alert("Սխալ՝ անհրաժեշտ է նշել առնվազն մեկ ժամ");
      return;
    }
  
    try {
      const response = await fetch("/api/teacher/save-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("teacherToken")
        },
        body: JSON.stringify({ primary_slots, backup_slots })
      });
  
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        alert("Սերվերի սխալ կամ դատարկ պատասխան");
        return;
      }
  
      if (response.ok) {
        alert("✅ Ժամերը հաջողությամբ պահպանվեցին");
  
        // ✅ update UI after save
        toggleCheckboxes(false);
        isConfirmed = true;
        document.getElementById("confirmAvailability").textContent = "✏️ Փոփոխել ժամերը";
  
      } else {
        console.error("❌ Server responded with error:", data);
        alert("❌ Պահպանման սխալ: " + (data?.error || "Անհայտ սխալ"));
      }
  
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("Սերվերի սխալ");
    }
  }
  

function getSelected(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} .time-slot-checkbox:checked`))
    .map(cb => cb.value);
}

function toggleCheckboxes(enable) {
  document.querySelectorAll(".time-slot-checkbox").forEach(cb => cb.disabled = !enable);
}

async function loadAvailability(token) {
  try {
    const res = await fetch("/api/teacher/availability", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) return;

    const data = await res.json();
    data.primary.forEach(slot => {
      const cb = document.querySelector(`#primarySlotsContainer input[value="${slot}"]`);
      if (cb) cb.checked = true;
    });

    data.backup.forEach(slot => {
      const cb = document.querySelector(`#backupSlotsContainer input[value="${slot}"]`);
      if (cb) cb.checked = true;
    });

    toggleCheckboxes(false);
    isConfirmed = true;
    document.getElementById("confirmAvailability").textContent = "✏️ Փոփոխել ժամերը";

    // ✅ Եթե ոչինչ չկա պահված, միացրու նշելու հնարավորությունը
    if (!data.primary.length && !data.backup.length) {
    toggleCheckboxes(true);
    isConfirmed = false;
    document.getElementById("confirmAvailability").textContent = "✅ Հաստատել ժամերը";
    }

  } catch (err) {
    console.error("❌ Load availability error:", err.message);
  }
}
