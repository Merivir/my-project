document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("messageForm");
  const teacherSelect = document.getElementById("teacherSelect");
  const messageText = document.getElementById("messageText");
  const submitButton = document.querySelector("button[type='submit']");
  const currentCount = document.getElementById("currentCount");
  const maxCount = document.getElementById("maxCount");
  
  // Character counter
  messageText.addEventListener("input", function() {
    const length = this.value.length;
    const maxLength = this.getAttribute("maxlength");
    currentCount.textContent = length;
    
    const charCounter = this.closest(".form-group").querySelector(".character-count");
    if (length > maxLength * 0.8) {
      charCounter.classList.add("warning");
    } else {
      charCounter.classList.remove("warning");
    }
    
    if (length > maxLength * 0.95) {
      charCounter.classList.add("error");
    } else {
      charCounter.classList.remove("error");
    }
  });
  
  // Focus effect for form groups
  const formGroups = document.querySelectorAll(".form-group");
  formGroups.forEach(group => {
    const input = group.querySelector("select, textarea");
    
    input.addEventListener("focus", () => {
      group.classList.add("focus");
    });
    
    input.addEventListener("blur", () => {
      group.classList.remove("focus");
    });
  });

  // Show toast notification
  function showToast(type, title, message, duration = 5000) {
    const toastContainer = document.getElementById("toastContainer");
    
    if (!toastContainer) {
      const newToastContainer = document.createElement("div");
      newToastContainer.id = "toastContainer";
      newToastContainer.className = "toast-container";
      document.body.appendChild(newToastContainer);
      toastContainer = newToastContainer;
    }
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icon = type === "success" ? "✓" : "✕";
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">×</button>
      <div class="toast-progress"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    toast.classList.add("show");
    
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    });
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  // Նախ մաքրում ենք բոլոր եղած option-ները (եթե call-վում է մի քանի անգամ)
  teacherSelect.innerHTML = "";

  // Ավելացնում ենք "Ընտրել դասախոսին..." default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Ընտրել դասախոսին...";
  teacherSelect.appendChild(defaultOption);

  // Ավելացնում ենք "Բոլոր դասախոսներին" տարբերակը
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "📢 Բոլոր դասախոսներին";
  teacherSelect.appendChild(allOption);

  // Բեռնում ենք դասախոսների ցանկը
  try {
    const res = await fetch("/api/teachers");
    const teachers = await res.json();

    teachers.forEach(t => {
      if (t.id && t.name) { // 🔐 Ստուգում ենք որ ID և անուն ունենա
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.name;
        teacherSelect.appendChild(option);
      }
    });
  } catch (err) {
    console.error("Դասախոսների բեռնման սխալ:", err);
    showToast("error", "Սխալ", "Դասախոսների ցանկի բեռնման ժամանակ տեղի է ունեցել սխալ");
  }

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const teacherId = teacherSelect.value;
    const message = messageText.value.trim();
    let hasError = false;
    
    // Validate fields
    if (!teacherId) {
      teacherSelect.classList.add("error-shake");
      setTimeout(() => teacherSelect.classList.remove("error-shake"), 500);
      hasError = true;
    }
    
    if (!message) {
      messageText.classList.add("error-shake");
      setTimeout(() => messageText.classList.remove("error-shake"), 500);
      hasError = true;
    }
    
    if (hasError) {
      showToast("error", "Լրացրեք բոլոր դաշտերը", "Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը");
      return;
    }
    
    // Set loading state
    submitButton.classList.add("loading");
    
    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, message }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Success state
        submitButton.classList.remove("loading");
        submitButton.classList.add("success");
        submitButton.innerHTML = `
          <span class="success-icon">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </span>
          Հաղորդագրությունն ուղարկված է
        `;
        
        showToast("success", "Հաջողություն", "Հաղորդագրությունը հաջողությամբ ուղարկվել է");
        
        // Reset form after a delay
        setTimeout(() => {
          form.reset();
          submitButton.classList.remove("success");
          submitButton.innerHTML = `
            <span class="button-text">
              <span>📩 Ուղարկել</span>
              <span class="arrow">→</span>
            </span>
            <span class="loading-spinner"></span>
          `;
          currentCount.textContent = "0";
        }, 3000);
      } else {
        submitButton.classList.remove("loading");
        showToast("error", "Սխալ", data.error || "Սխալ է տեղի ունեցել հաղորդագրությունն ուղարկելիս");
        console.error("❌ Սխալ:", data);
      }
    } catch (err) {
      submitButton.classList.remove("loading");
      showToast("error", "Սերվերի սխալ", "Սերվերի հետ կապ հաստատելու ընթացքում տեղի է ունեցել սխալ");
      console.error("❌ Server error:", err);
    }
  });
});