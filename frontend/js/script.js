document.getElementById('adminLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const instituteId = document.getElementById('institute').value;

    // Запрашиваем данные для выбранного института
    const response = await fetch(`/admin?institute_id=${instituteId}`);
    if (response.ok) {
        const data = await response.json();
        loadAdminPanel(data);
    } else {
        alert('Ошибка загрузки данных!');
    }
});

function loadAdminPanel(data) {
    const adminPanel = document.getElementById('adminPanel');
    adminPanel.style.display = 'block';
    // Здесь можно обновить интерфейс с данными
    console.log('Данные:', data);
}
