document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("adminRegisterForm");

    if (!registerForm) {
        console.error(" Error: Registration form not found!");
        return;
    }

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Կանխում ենք էջի refresh-ը

        const name = document.getElementById('name').value;
        const login = document.getElementById('login').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log(" Sending data:", { name, login, email, password });

        try {
            const response = await fetch('/api/register', {  
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, login, email, password }) 
            });

            const data = await response.json();

            console.log(" Server Response:", data);

            if (response.ok) {
                alert('Գրանցումը բարեհաջող ավարտվեց, կարող եք մուտք գործել');
                window.location.href = '/admin-login';
            } else {
                document.getElementById('registerErrorMessage').innerText = data.message;
            }
        } catch (err) {
            document.getElementById('registerErrorMessage').innerText = 'Սերվերի խնդիր';
            console.error(" Registration error:", err);
        }
    });
});
