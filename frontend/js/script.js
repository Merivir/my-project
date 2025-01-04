document.addEventListener('DOMContentLoaded', () => {
    loadFilters();
    loadSchedule();

    document.getElementById('filterBtn').addEventListener('click', () => {
        document.getElementById('filterModal').style.display = 'block';
    });

    document.getElementById('closeFilterBtn').addEventListener('click', () => {
        document.getElementById('filterModal').style.display = 'none';
    });

    document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);
});

async function loadSchedule() {
    try {
        const response = await fetch('/schedule');
        if (!response.ok) throw new Error('Ошибка загрузки расписания');
        const schedule = await response.json();
        console.log("Загруженное расписание:", schedule); // Отладочный вывод
        updateScheduleTable(schedule);
    } catch (err) {
        console.error('Ошибка загрузки расписания:', err);
    }
}


async function loadFilters() {
    try {
        const response = await fetch('/schedule/filters'); // Заменено с /api/schedule/filters
        const filters = await response.json();

        const fillSelect = (selectId, options) => {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">Բոլորը</option>';
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.id;
                opt.textContent = option.name;
                select.appendChild(opt);
            });
        };

        fillSelect('dayFilter', filters.days);
        fillSelect('weekFilter', filters.weeks);
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


async function applyFilters() {
    const params = new URLSearchParams();

    ['dayFilter', 'weekFilter', 'timeSlotFilter', 'roomFilter', 'subjectFilter', 'teacherFilter', 'groupFilter', 'typeFilter'].forEach(filterId => {
        const value = document.getElementById(filterId).value;
        if (value) params.append(filterId.replace('Filter', '_id'), value);
    });

    console.log('Параметры фильтров:', params.toString()); // Для отладки

    try {
        const response = await fetch(`/schedule?${params.toString()}`);
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const filteredSchedule = await response.json();
        console.log('Фильтрованные данные:', filteredSchedule); // Для отладки
        updateScheduleTable(filteredSchedule);
        document.getElementById('filterModal').style.display = 'none';
    } catch (err) {
        console.error('Ошибка применения фильтров:', err);
    }
}



function updateScheduleTable(schedule) {
    const tableBody = document.getElementById('scheduleBody');
    tableBody.innerHTML = ''; // Очистить таблицу
    console.log('Данные для таблицы:', schedule); // Отладочный вывод

    schedule.forEach(entry => {
        const details = entry.details ? JSON.parse(entry.details) : {};
        const row = `
            <tr>
                <td>${entry.day_name || 'N/A'}</td>
                <td>${entry.week_type || 'N/A'}</td>
                <td>${entry.time_slot || 'N/A'}</td>
                <td>${entry.room_number || 'N/A'}</td>
                <td>${entry.subject_name || 'N/A'}</td>
                <td>${entry.teacher_name || 'N/A'}</td>
                <td>${entry.group_name || 'N/A'}</td>
                <td>${entry.type_name || 'N/A'}</td>
                <td>${details.format || 'N/A'}</td>
                <td>${details.zoom_link ? `<a href="${details.zoom_link}" target="_blank">Հղում</a>` : 'N/A'}</td>
                <td>${details.notes || 'N/A'}</td>
            </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}
