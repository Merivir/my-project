// reset-password-before-login.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
    const sendCodeBtn = document.getElementById("sendCodeBtn");
    const loginInput = document.getElementById("login");
    const codeInput = document.getElementById("code");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const confirmBtn = document.getElementById("confirmBtn");
    const sendHint = document.getElementById("sendHint");
    const codeError = document.getElementById("codeError");
    const passwordError = document.getElementById("passwordError");
    const confirmError = document.getElementById("confirmError");
    const message = document.getElementById("changePasswordMessage");
  
    const role = new URLSearchParams(window.location.search).get("role");
  
    sendCodeBtn.addEventListener("click", async () => {
      const login = loginInput.value.trim();
      if (!login || !role) return alert("Լրացրեք մուտքանունը:");
  
      try {
        const res = await fetch(`/api/reset/request-reset-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ login, role })
        });
  
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Սխալ տեղի ունեցավ:");
  
        codeInput.disabled = false;
        sendHint.style.display = "block";
        loginInput.disabled = true;
        sendCodeBtn.disabled = true;
      } catch (err) {
        alert(err.message);
      }
    });
  
    codeInput.addEventListener("input", () => {
      if (codeInput.value.trim().length === 6) {
        newPasswordInput.disabled = false;
        confirmPasswordInput.disabled = false;
        confirmBtn.disabled = false;
      }
    });
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const login = loginInput.value.trim();
      const code = codeInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();
  
      codeError.textContent = "";
      passwordError.textContent = "";
      confirmError.textContent = "";
      message.textContent = "";
  
      if (!/^[0-9]{6}$/.test(code)) {
        codeError.textContent = "Կոդը պետք է լինի 6 նիշ:";
        return;
      }
  
      if (newPassword.length < 6) {
        passwordError.textContent = "Գաղտնաբառը պետք է պարունակի նվազագույնը 6 նիշ:";
        return;
      }
  
      if (newPassword !== confirmPassword) {
        confirmError.textContent = "Գաղտնաբառերը չեն համընկնում:";
        return;
      }
  
      try {
        const res = await fetch(`/api/reset/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ login, role, code, newPassword })
        });
  
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Չհաջողվեց թարմացնել գաղտնաբառը:");
  
        message.style.color = "green";
        message.textContent = "Գաղտնաբառը հաջողությամբ փոխվեց";
        confirmBtn.disabled = true;
      } catch (err) {
        message.style.color = "red";
        message.textContent = err.message;
      }
    });
  });
  