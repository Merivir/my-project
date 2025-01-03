document.getElementById('adminLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const instituteId = document.getElementById('institute').value;

    // Запрашиваем данные для выбранного института
    const response = await fetch(`/admin?institute_id=${instituteId}`);
    if (response.ok) {
        const data = await response.json();
        loadAdminPanel(data);
    } else {
        alert('Տվյալների բեռման սխալ!');
    }
});
async function loadSchedule() {
    try {
        const response = await fetch('/schedule');
        const schedule = await response.json();

        const tableBody = document.getElementById('scheduleBody');
        tableBody.innerHTML = ''; // Очистить перед добавлением

        schedule.forEach(entry => {
            // Распарсить details
            const details = entry.details ? JSON.parse(entry.details) : {};

            const row = `
                <tr>
                    <td>${entry.day_name}</td>
                    <td>${entry.week_type}</td>
                    <td>${entry.time_slot}</td>
                    <td>${entry.room_number}</td>
                    <td>${entry.subject_name}</td>
                    <td>${entry.teacher_name}</td>
                    <td>${entry.group_name}</td>
                    <td>${entry.type_name}</td>
                    <td>${details.format || 'N/A'}</td>
                    <td>${details.zoom_link ? `<a href="${details.zoom_link}" target="_blank">Հղում</a>` : 'N/A'}</td>
                    <td>${details.notes || 'N/A'}</td>
                </tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (err) {
        console.error('Ошибка загрузки расписания:', err);
    }
}

loadSchedule();
