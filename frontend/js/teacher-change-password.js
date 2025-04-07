document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  document.getElementById('resetToken').value = params.get('token') || '';
  
  const sendBtn = document.getElementById('sendCodeBtn');
  const sendHint = document.getElementById('sendHint');
  const retryLink = document.getElementById('retryLink');
  const codeHint = document.getElementById('codeHint');

  // Send or retry code
  async function requestCode() {
    try {
      const response = await fetch('/api/teacher/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Գոյացավ սխալ');
        return;
      }
      // Եթե backend-ը վերադարձնում է { resetToken }, ապա
      document.getElementById('resetToken').value = data.resetToken; // <-- ԱՅՍՏԵՂ
      sendHint.style.display = 'block';
      codeHint.style.display = 'block';
      retryLink.style.display = 'inline';
    } catch (err) {
      console.error(err);
      alert('Սխալ՝ չի հաջողվեց ուղարկել կոդը');
    }
  }
  

  sendBtn.addEventListener('click', requestCode);
  retryLink.addEventListener('click', requestCode);

  // Form submission
  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Clear previous errors
    document.getElementById('codeError').innerText = '';
    document.getElementById('passwordError').innerText = '';
    document.getElementById('confirmError').innerText = '';
    document.getElementById('changePasswordMessage').innerText = '';

    const code = document.getElementById('verificationCode').value.trim();
    const pwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    let valid = true;
    // code validation
    if (!/^\d{6}$/.test(code)) {
      document.getElementById('codeError').innerText = 'Կոդը պետք է լինի 6 թվանշան';
      valid = false;
    }
    // password complexity
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/;
    if (!pwdRegex.test(pwd)) {
      document.getElementById('passwordError').innerText = 
        'Գաղտնաբառը պետք է ≥8 նիշ, պարունակի մեծատառ, փոքրատառ, թիվ և հատուկ նշան';
      valid = false;
    }
    if (pwd !== confirm) {
      document.getElementById('confirmError').innerText = 'Գաղտնաբառերը չեն համընկնում';
      valid = false;
    }
    if (!valid) return;

    // submit change
    try {
      const resetToken = document.getElementById('resetToken').value;  // from hidden input

      const res = await fetch('/api/teacher/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,                  // ← add this
          verificationCode: code,
          newPassword: pwd
        })
      });

      const data = await res.json();
      if (!res.ok) {
        document.getElementById('changePasswordMessage').style.color = 'red';
        document.getElementById('changePasswordMessage').innerText = data.message || 'Սխալ';
      } else {
        document.getElementById('changePasswordMessage').style.color = 'green';
        document.getElementById('changePasswordMessage').innerText = 'Գաղտնաբառը փոխվեց հաջողությամբ';
      }
    } catch (err) {
      console.error(err);
      document.getElementById('changePasswordMessage').style.color = 'red';
      document.getElementById('changePasswordMessage').innerText = 'Սերվերի սխալ';
    }
  });
});
