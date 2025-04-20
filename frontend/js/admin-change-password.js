document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("sendCodeBtn");
    const sendHint = document.getElementById("sendHint");
    const codeError = document.getElementById("codeError");
    const passwordError = document.getElementById("passwordError");
    const confirmError = document.getElementById("confirmError");
    const resultMessage = document.getElementById("changePasswordMessage");
  
    // ✅ Կոդի ուղարկում
    sendBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/admin/request-reset-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("adminToken")}` // ✅ պարտադիր
          }
        });
  
        const data = await res.json();
        if (!res.ok) return alert(data.message || "Չհաջողվեց ուղարկել կոդը");
  
        document.getElementById("resetToken").value = data.resetToken;
        sendHint.style.display = "block";
      } catch (err) {
        console.error("❌ Կոդի ուղարկման սխալ:", err);
        alert("Սխալ: չհաջողվեց ուղարկել կոդը");
      }
    });
  
    // ✅ Գաղտնաբառի փոփոխում
    document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
      e.preventDefault();
  
      codeError.textContent = "";
      passwordError.textContent = "";
      confirmError.textContent = "";
      resultMessage.textContent = "";
  
      const code = document.getElementById("verificationCode").value.trim();
      const pwd = document.getElementById("newPassword").value;
      const confirm = document.getElementById("confirmPassword").value;
      const resetToken = document.getElementById("resetToken").value;
  
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
            "Authorization": `Bearer ${localStorage.getItem("adminToken")}` // ✅ պարտադիր երկրորդ անգամ էլ
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
  