document.addEventListener("DOMContentLoaded", async () => {
    if (window.location.pathname.includes("teacher-login")) return;
  
    try {
      const response = await fetch("/teacher-dashboard/settingsMenu");
      if (!response.ok) throw new Error("❌ settingsMenu not found");
  
      const html = await response.text();
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
  
      // 💤 Սպասում ենք DOM-ի render-ին
      await new Promise(resolve => setTimeout(resolve, 0));
  
      const avatar = document.querySelector("#user-avatar");
      const dropdown = document.querySelector("#settings-dropdown");
  
      if (!avatar || !dropdown) {
        console.error("⚠️ Avatar or dropdown not found!");
        return;
      }
  
      // ✅ Քլիք՝ toggle dropdown
      avatar.addEventListener("click", (e) => {
        e.stopPropagation(); // prevents closing immediately
        dropdown.classList.toggle("hidden");
      });
  
      // ✅ Սեղմում դրսից → փակում dropdown
      document.addEventListener("click", (e) => {
        if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add("hidden");
        }
      });
  
      console.log("✅ User avatar dropdown ready");
    } catch (err) {
      console.error("❌ settingsMenu.js error:", err);
    }
  });
  