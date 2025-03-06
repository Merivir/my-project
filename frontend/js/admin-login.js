function submitAdminLoginForm(event) {
    event.preventDefault(); // Կանխում ենք refresh-ը

    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;

    fetch('/api/login', {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Մուտքը հաջողվեց!") {
            alert('Բարի գալուստ!');
            window.location.href = '/admin-dashboard';
        } else {
            document.getElementById('loginErrorMessage').innerText = data.message;
        }
    })
    .catch(err => {
        document.getElementById('loginErrorMessage').innerText = 'Սերվերի խնդիր';
        console.error("⛔ Error:", err);
    });
}
