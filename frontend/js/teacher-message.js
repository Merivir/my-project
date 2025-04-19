document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("messageForm");
  const teacherSelect = document.getElementById("teacherSelect");

  // Նախ մաքրում ենք բոլոր եղած option-ները (եթե call-վում է մի քանի անգամ)
  teacherSelect.innerHTML = "";

  // Ավելացնում ենք "Ընտրել դասախոսին..." default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Ընտրել դասախոսին...";
  teacherSelect.appendChild(defaultOption);

  // Ավելացնում ենք "Բոլոր դասախոսներին" տարբերակը
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "📢 Բոլոր դասախոսներին";
  teacherSelect.appendChild(allOption);

  // Բեռնում ենք դասախոսների ցանկը
  try {
    const res = await fetch("/api/teachers");
    const teachers = await res.json();

    teachers.forEach(t => {
      if (t.id && t.name) { // 🔐 Ստուգում ենք որ ID և անուն ունենա
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.name;
        teacherSelect.appendChild(option);
      }
    });
  } catch (err) {
    console.error("Դասախոսների բեռնման սխալ:", err);
  }

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const teacherId = teacherSelect.value;
    const message = document.getElementById("messageText").value.trim();

    if (!teacherId || !message) {
      return alert("Խնդրում ենք լրացնել բոլոր դաշտերը։");
    }

    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, message }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Հաղորդագրությունը հաջողությամբ ուղարկվել է");
        form.reset();
      } else {
        console.error("❌ Սխալ:", data);
        alert(data.error || "Սխալ է տեղի ունեցել");
      }
    } catch (err) {
      console.error("❌ Server error:", err);
      alert("Սերվերի սխալ");
    }
  });
});
