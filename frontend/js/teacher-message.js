document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("messageForm");
    const teacherSelect = document.getElementById("teacherSelect");
  
    // Բեռնում ենք դասախոսների ցանկը
    try {
      const res = await fetch("/api/teachers");
      const teachers = await res.json();
  
      teachers.forEach(t => {
        const option = document.createElement("option");
        option.value = t.email;
        option.textContent = t.name;
        teacherSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Դասախոսների բեռնման սխալ:", err);
    }
  
    // Submit handler
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = teacherSelect.value;
      const message = document.getElementById("messageText").value.trim();
  
      if (!message) return alert("Խնդրում ենք գրել հաղորդագրությունը");
  
      try {
        const res = await fetch("/api/admin/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, message }),
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
  