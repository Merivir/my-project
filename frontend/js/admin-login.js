document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("adminLoginForm");

    if (!loginForm) {
        console.error("⛔ Error: Login form not found!");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Կանխում ենք էջի refresh-ը

        const login = document.getElementById("login").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch('/api/login', {  // ✅ Պետք է լինի `/api/login`
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Բարի գալուստ!');
                window.location.href = '/admin-dashboard';
            } else {
                document.getElementById('loginErrorMessage').innerText = data.message;
            }
        } catch (err) {
            document.getElementById('loginErrorMessage').innerText = 'Սերվերի խնդիր';
        }
    });
});
