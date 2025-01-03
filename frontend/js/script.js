document.addEventListener('DOMContentLoaded', () => {
    loadFilters(); // Загрузить фильтры при открытии страницы
    loadSchedule(); // Загрузить расписание
});

// Функция загрузки фильтров
async function loadFilters() {
    try {
        const response = await fetch('/schedule/filters');
        const filters = await response.json();

        const fillSelect = (selectId, options) => {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">Բոլորը</option>'; // Сбросить текущие опции
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.id;
                opt.textContent = option.name;
                select.appendChild(opt);
            });
        };

        fillSelect('dayFilter', filters.days);
        fillSelect('timeSlotFilter', filters.timeSlots);
        fillSelect('roomFilter', filters.rooms);
        fillSelect('subjectFilter', filters.subjects);
        fillSelect('teacherFilter', filters.teachers);
        fillSelect('groupFilter', filters.groups);
        fillSelect('typeFilter', filters.types);
    } catch (err) {
        console.error('Ошибка загрузки фильтров:', err);
    }
}

// Функция загрузки расписания
async function loadSchedule() {
    try {
        const response = await fetch('/schedule');
        const schedule = await response.json();
        updateScheduleTable(schedule);
    } catch (err) {
        console.error('Ошибка загрузки расписания:', err);
    }
}

// Функция обновления таблицы расписания
function updateScheduleTable(schedule) {
    const tableBody = document.getElementById('scheduleBody');
    tableBody.innerHTML = ''; // Очистить перед добавлением данных

    schedule.forEach(entry => {
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
}

// Обработчик для кнопки фильтрации
document.getElementById('filterBtn').addEventListener('click', () => {
    document.getElementById('filterModal').style.display = 'block';
});

// Обработчик для закрытия модального окна
document.getElementById('closeFilterBtn').addEventListener('click', () => {
    document.getElementById('filterModal').style.display = 'none';
});

// Применение фильтров
async function applyFilters() {
    const params = new URLSearchParams(
        Array.from(document.querySelectorAll('select')).reduce((acc, select) => {
            if (select.value) acc[select.id.replace('Filter', '_id')] = select.value;
            return acc;
        }, {})
    );

    try {
        const response = await fetch(`/schedule?${params}`);
        const filteredSchedule = await response.json();
        updateScheduleTable(filteredSchedule);
        document.getElementById('filterModal').style.display = 'none'; // Закрыть модальное окно
    } catch (err) {
        console.error('Ошибка применения фильтров:', err);
    }
}

document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);
