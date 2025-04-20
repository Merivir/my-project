// admin-change-password.js

document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("sendCodeBtn");
    const sendHint = document.getElementById("sendHint");
    const codeError = document.getElementById("codeError");
    const passwordError = document.getElementById("passwordError");
    const confirmError = document.getElementById("confirmError");
    const resultMessage = document.getElementById("changePasswordMessage");
  
    const codeInput = document.getElementById("verificationCode");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const submitBtn = document.querySelector("button[type='submit']");
    const tokenInput = document.getElementById("resetToken");
  
    // 📴 Disable initially
    codeInput.disabled = true;
    newPasswordInput.disabled = true;
    confirmPasswordInput.disabled = true;
    submitBtn.disabled = true;
  
    // ✅ Send verification code
    sendBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/admin/request-reset-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
          }
        });
  
        const data = await res.json();
        if (!res.ok) return alert(data.message || "Չհաջողվեց ուղարկել կոդը");
  
        tokenInput.value = data.resetToken;
        sendHint.style.display = "block";
        codeInput.disabled = false;
        sendBtn.disabled = true;
      } catch (err) {
        console.error("❌ Կոդի ուղարկման սխալ:", err);
        alert("Սխալ: չհաջողվեց ուղարկել կոդը");
      }
    });
  
    // Enable fields once 6-digit code is entered
    codeInput.addEventListener("input", () => {
      if (/^\d{6}$/.test(codeInput.value.trim())) {
        newPasswordInput.disabled = false;
        confirmPasswordInput.disabled = false;
        submitBtn.disabled = false;
      }
    });
  
    // ✅ Change password form submission
    document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
      e.preventDefault();
  
      codeError.textContent = "";
      passwordError.textContent = "";
      confirmError.textContent = "";
      resultMessage.textContent = "";
  
      const code = codeInput.value.trim();
      const pwd = newPasswordInput.value;
      const confirm = confirmPasswordInput.value;
      const resetToken = tokenInput.value;
  
      let valid = true;
  
      if (!/^\d{6}$/.test(code)) {
        codeError.textContent = "Կոդը պետք է լինի 6 թվանշան։";
        valid = false;
      }
  
      const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPwd.test(pwd)) {
        passwordError.textContent = "Պահանջվում է ≥8 նիշ, մեծատառ, փոքրատառ, թիվ և հատուկ նշան։";
        valid = false;
      }
  
      if (pwd !== confirm) {
        confirmError.textContent = "Գաղտնաբառերը չեն համընկնում։";
        valid = false;
      }
  
      if (!valid) return;
  
      try {
        const res = await fetch("/api/admin/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
          },
          body: JSON.stringify({
            resetToken,
            verificationCode: code,
            newPassword: pwd
          })
        });
  
        const data = await res.json();
        if (res.ok) {
          resultMessage.style.color = "green";
          resultMessage.textContent = "Գաղտնաբառը հաջողությամբ փոխվեց։";
          submitBtn.disabled = true;
        } else {
          resultMessage.style.color = "red";
          resultMessage.textContent = data.message || "Սխալ։";
        }
      } catch (err) {
        console.error("❌ Սերվերի սխալ:", err);
        resultMessage.style.color = "red";
        resultMessage.textContent = "Սերվերի սխալ։";
      }
    });
  });
  