document.addEventListener("DOMContentLoaded", async () => {
    console.log("📌 DOM Loaded, trying to fetch /teacher-dashboard/settingsMenu...");
    
    try {
      const response = await fetch("/teacher-dashboard/settingsMenu");
      console.log("🔎 Fetch status:", response.status);
      
      const html = await response.text();
      console.log("📝 Got HTML:", html);
      
      if (!response.ok || !html) {
        throw new Error("❌ settingsMenu not found or empty");
      }
  
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
  
      const avatar = document.querySelector("#user-avatar");
      const dropdown = document.querySelector("#settings-dropdown");
      console.log("👀 avatar =", avatar, "| dropdown =", dropdown);
  
      if (!avatar || !dropdown) {
        console.error("⚠️ Avatar or dropdown not found!");
        return;
      }
  
      // click events
      avatar.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
      });
  
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
  