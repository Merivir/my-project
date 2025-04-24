// reset-password.js
document.addEventListener("DOMContentLoaded", () => {
  // Հիմնական տարրերի ընտրություն
  const form = document.getElementById("resetPasswordForm");
  const sendCodeBtn = document.getElementById("sendCodeBtn");
  const loginInput = document.getElementById("login");
  const codeInput = document.getElementById("code");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const confirmBtn = document.getElementById("confirmBtn");
  const verifyCodeBtn = document.getElementById("verifyCodeBtn");
  const sendHint = document.getElementById("sendHint");
  const codeError = document.getElementById("codeError");
  const passwordError = document.getElementById("passwordError");
  const confirmError = document.getElementById("confirmError");
  const successMessage = document.getElementById("successMessage");
  
  // Քայլերի և բաժինների ընտրություն
  const steps = document.querySelectorAll('.step');
  const sections = document.querySelectorAll('.form-section');
  const backBtns = document.querySelectorAll('.back-btn');
  
  // URL-ից հանել role պարամետրը
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get("role") || "teacher"; // Default to teacher if no role is specified
  
  // Ցույց տալ համապատասխան բաժինը և թարմացնել քայլերը
  function showSection(sectionId) {
    // Թաքցնել բոլոր բաժինները
    sections.forEach(section => {
      section.classList.remove('active');
    });
    
    // Ցույց տալ թիրախային բաժինը
    document.getElementById(sectionId).classList.add('active');
    
    // Թարմացնել քայլերի կարգավիճակները
    let stepNumber = parseInt(sectionId.replace('section', ''));
    
    steps.forEach((step, index) => {
      if (index + 1 < stepNumber) {
        step.classList.remove('active');
        step.classList.add('completed');
      } else if (index + 1 === stepNumber) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }
  
  // Հետ կոճակների միջոցառումների մշակում
  backBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-goto');
      showSection(targetSection);
    });
  });
  
  // Գաղտնաբառի տեսանելիությունը փոխելու ֆունկցիոնալություն
  const toggleBtns = document.querySelectorAll('.toggle-password');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-for');
      const input = document.getElementById(targetId);
      
      if (input.type === 'password') {
        input.type = 'text';
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      } else {
        input.type = 'password';
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      }
    });
  });
  
  // Գաղտնաբառի ուժեղության ստուգում
  function checkPasswordStrength(password) {
    const passwordStrength = document.querySelector('.password-strength');
    passwordStrength.classList.remove('weak', 'medium', 'strong', 'very-strong');
    
    if (password.length === 0) return 0;
    
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength <= 1) {
      passwordStrength.classList.add('weak');
    } else if (strength <= 2) {
      passwordStrength.classList.add('medium');
    } else if (strength <= 3) {
      passwordStrength.classList.add('strong');
    } else {
      passwordStrength.classList.add('very-strong');
    }
    
    return strength;
  }
  
  // Գաղտնաբառի փոփոխման ժամանակ ստուգել ուժեղությունը
  newPasswordInput.addEventListener('input', function() {
    checkPasswordStrength(this.value);
  });
  
  // Սխալի հաղորդագրություն ավելացնելու ֆունկցիա
  function addNotification(message, type = "error") {
    // Հեռացնել նախկին հաղորդագրությունները
    const oldNotifications = document.querySelectorAll('.notification-error, .notification-success');
    oldNotifications.forEach(notification => notification.remove());
    
    // Ստեղծել նոր հաղորդագրություն
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    
    const iconType = type === "error" ? "⚠️" : "ℹ️";
    const bgColor = type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(76, 123, 218, 0.1)";
    const textColor = type === "error" ? "#ef4444" : "var(--primary)";
    
    notification.style.backgroundColor = bgColor;
    notification.innerHTML = `
      <div class="notification-icon" style="color: ${textColor}">${iconType}</div>
      <div class="notification-text" style="color: ${textColor}">${message}</div>
    `;
    
    // Ավելացնել ակտիվ բաժնում
    const activeSection = document.querySelector('.form-section.active');
    activeSection.prepend(notification);
    
    // Հեռացնել 5 վայրկյան հետո
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
  
  // Կոդը ուղարկելու կոճակի հանդեպ գործողություն
  sendCodeBtn.addEventListener("click", async () => {
    const login = loginInput.value.trim();
    if (!login) {
      addNotification("Խնդրում ենք լրացնել մուտքանունը:", "error");
      return;
    }
    
    // Ցույց տալ բեռնման ինդիկատոր
    const originalBtnText = sendCodeBtn.textContent;
    sendCodeBtn.textContent = "Խնդրում ենք սպասել...";
    sendCodeBtn.disabled = true;
    
    try {
      // Այստեղ կլինի իրական API հարցումը
      // Սիմուլյացիա ենք անում հարցման պատասխանը
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // API հարցման սիմուլյացիա
      
      const res = await fetch(`/api/reset/request-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, role })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Սխալ տեղի ունեցավ:");
      
      
      // Անցնել երկրորդ քայլին
      showSection('section2');
      
    } catch (err) {
      addNotification(err.message || "Սխալ տեղի ունեցավ:", "error");
    } finally {
      // Վերականգնել կոճակի տեքստը
      sendCodeBtn.textContent = originalBtnText;
      sendCodeBtn.disabled = false;
    }
  });
  
  // Հաստատման կոդի ստուգման կոճակ
  verifyCodeBtn.addEventListener("click", () => {
    const code = codeInput.value.trim();
    codeError.textContent = "";
    
    if (!/^[0-9]{6}$/.test(code)) {
      codeError.textContent = "Կոդը պետք է լինի 6 նիշ:";
      return;
    }
    
    // Այստեղ կարող է լինել API հարցում կոդը ստուգելու համար
    // Սիմուլյացիա ենք անում հարցման պատասխանը
    verifyCodeBtn.textContent = "Ստուգում...";
    verifyCodeBtn.disabled = true;
    
    setTimeout(() => {
      // Անցնել գաղտնաբառի փոփոխման քայլին
      verifyCodeBtn.textContent = "Հաստատել";
      verifyCodeBtn.disabled = false;
      showSection('section3');
    }, 1000);
  });
  
  // Ձևի ներկայացման հանդեպ գործողություն
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const login = loginInput.value.trim();
    const code = codeInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    
    // Մաքրել սխալի հաղորդագրությունները
    codeError.textContent = "";
    passwordError.textContent = "";
    confirmError.textContent = "";
    
    // Վավերացնել տվյալները
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
    
    // Ցույց տալ բեռնման ինդիկատոր
    confirmBtn.textContent = "Գործընթացի մեջ է...";
    confirmBtn.disabled = true;
    
    try {
      // Այստեղ կլինի իրական API հարցումը
      // Սիմուլյացիա ենք անում հարցման պատասխանը
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      
      const res = await fetch(`/api/reset/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ login, role, code, newPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Չհաջողվեց թարմացնել գաղտնաբառը:");
      
      
      // Ցույց տալ հաջողության հաղորդագրությունը
      form.style.display = "none";
      successMessage.classList.add("active");
      
    } catch (err) {
      addNotification(err.message || "Չհաջողվեց թարմացնել գաղտնաբառը:", "error");
      
      // Վերականգնել կոճակի տեքստը
      confirmBtn.textContent = "Փոխել գաղտնաբառը";
      confirmBtn.disabled = false;
    }
  });
});