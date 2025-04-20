document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminLoginForm");
    const errorEl = document.getElementById("loginErrorMessage");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
  
      const login = document.getElementById("login").value.trim();
      const password = document.getElementById("password").value;
  
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login, password }),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          errorEl.style.color = "red";
          errorEl.textContent = data.message || "Մուտքի սխալ։";
          return;
        }
  
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/admin-dashboard";
      } catch (err) {
        console.error("❌ Սերվերի սխալ:", err);
        errorEl.style.color = "red";
        errorEl.textContent = "Սերվերի սխալ։";
      }
    });
  });
  