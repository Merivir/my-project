// teacher-login.js

/**
 * Teacher login form submit handler
 * @param {Event} event
 */
function submitTeacherLoginForm(event) {
  event.preventDefault();

  const login = document.getElementById("login").value.trim();
  const password = document.getElementById("password").value.trim();

  fetch("/api/teacher/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password })
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        document.getElementById("loginErrorMessage").innerText =
          data.message || "Սխալ մուտքանուն կամ գաղտնաբառ";
      } else {
        // Հաջող login
        alert("Մուտքը հաջողվեց!");
        if (data.token) {
          // Պահպանում ենք token-ը
          localStorage.setItem("teacherToken", data.token);
        }
        window.location.href = "/teacher-dashboard";
      }
    })
    .catch((error) => {
      console.error("Teacher login error:", error);
      document.getElementById("loginErrorMessage").innerText = "Սերվերի սխալ";
    });
}
