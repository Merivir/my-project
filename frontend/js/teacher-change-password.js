function submitChangePassword(event) {
    event.preventDefault();
  
    const verificationCode = document.getElementById("verificationCode").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
  
    if (newPassword !== confirmPassword) {
      document.getElementById("changePasswordMessage").innerText = "Գաղտնաբառերը չեն համընկնում";
      return;
    }
    if (verificationCode.length !== 6) {
      document.getElementById("changePasswordMessage").innerText = "Խնդրում ենք մուտքագրել 6 նիշ հաստատման կոդ";
      return;
    }
  
    // Կատարում ենք հարցում back-end-ի՝ /api/teacher/change-password endpoint-ին
    fetch("/api/teacher/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Հավաքած token-ը (եթե օգտագործում եք token-authentication)
        "Authorization": `Bearer ${localStorage.getItem("teacherToken")}`
      },
      body: JSON.stringify({
        verificationCode,
        newPassword
      })
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        document.getElementById("changePasswordMessage").innerText = data.message || "Սխալ տեղի ունեցավ";
      } else {
        document.getElementById("changePasswordMessage").style.color = "green";
        document.getElementById("changePasswordMessage").innerText = "Գաղտնաբառը հաջողությամբ փոխվեց";
      }
    })
    .catch((error) => {
      console.error("Error changing password:", error);
      document.getElementById("changePasswordMessage").innerText = "Սերվերի սխալ";
    });
  }
  