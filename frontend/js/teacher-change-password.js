// teacher-change-password.js

document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('sendCodeBtn');
  const sendHint = document.getElementById('sendHint');
  const retryLink = document.getElementById('retryLink');
  const codeHint = document.getElementById('codeHint');

  const codeInput = document.getElementById('verificationCode');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.querySelector('button[type="submit"]');

  const codeError = document.getElementById('codeError');
  const passwordError = document.getElementById('passwordError');
  const confirmError = document.getElementById('confirmError');
  const message = document.getElementById('changePasswordMessage');

  const tokenInput = document.getElementById('resetToken');

  // Disable inputs initially
  codeInput.disabled = true;
  newPasswordInput.disabled = true;
  confirmPasswordInput.disabled = true;
  submitBtn.disabled = true;

  async function requestCode() {
    try {
      const res = await fetch('/api/teacher/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Սխալ։ Կոդը չուղարկվեց։');

      // Enable code input, show hints
      codeInput.disabled = false;
      sendBtn.disabled = true;
      sendHint.style.display = 'block';
      codeHint.style.display = 'block';
      retryLink.style.display = 'inline';

      tokenInput.value = data.resetToken;
    } catch (err) {
      alert(err.message);
    }
  }

  sendBtn.addEventListener('click', requestCode);
  retryLink.addEventListener('click', requestCode);

  codeInput.addEventListener('input', () => {
    if (codeInput.value.trim().length === 6) {
      newPasswordInput.disabled = false;
      confirmPasswordInput.disabled = false;
      submitBtn.disabled = false;
    }
  });

  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = codeInput.value.trim();
    const password = newPasswordInput.value.trim();
    const confirm = confirmPasswordInput.value.trim();
    const resetToken = tokenInput.value;

    codeError.textContent = '';
    passwordError.textContent = '';
    confirmError.textContent = '';
    message.textContent = '';

    if (!/^\d{6}$/.test(code)) {
      codeError.textContent = 'Կոդը պետք է լինի 6 թվանշան';
      return;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/;
    if (!pwdRegex.test(password)) {
      passwordError.textContent = 'Գաղտնաբառը պետք է ≥8 նիշ, պարունակի մեծատառ, փոքրատառ, թիվ և հատուկ նշան';
      return;
    }

    if (password !== confirm) {
      confirmError.textContent = 'Գաղտնաբառերը չեն համընկնում';
      return;
    }

    try {
      const res = await fetch('/api/teacher/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          verificationCode: code,
          newPassword: password
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Չհաջողվեց թարմացնել գաղտնաբառը։');

      message.style.color = 'green';
      message.textContent = 'Գաղտնաբառը հաջողությամբ փոխվեց։';
      submitBtn.disabled = true;
    } catch (err) {
      message.style.color = 'red';
      message.textContent = err.message;
    }
  });
});
