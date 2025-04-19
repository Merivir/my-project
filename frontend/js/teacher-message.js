document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("messageForm");
  const teacherSelect = document.getElementById("teacherSelect");

  // 📡 Բեռնում ենք դասախոսների ցանկը
  try {
    const res = await fetch("/api/teachers");
    const teachers = await res.json();

    // Optional — Բոլորին տարբերակ
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "📢 Բոլոր դասախոսներին";
    teacherSelect.appendChild(allOption);

    teachers.forEach(t => {
      const option = document.createElement("option");
      option.value = t.id;  // ✅ ուղարկում ենք ID
      option.textContent = `${t.name} (${t.email})`;
      teacherSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Դասախոսների բեռնման սխալ:", err);
  }

  // 📤 Submit handler
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
        alert("✅ Հաղորդագրությունը հաջողությամբ ուղարկվեց");
        form.reset();
      } else {
        console.error("❌ Սխալ:", data);
        alert(data.error || "Սխալ է տեղի ունեցել");
      }
    } catch (err) {
      console.error("❌ Server error:", err);
      alert("Սերվերի սխալ");
    }

    console.log("📦 Ուղարկվող տվյալները:", { teacherId, message });
  });
});
