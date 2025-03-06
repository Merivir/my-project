document.addEventListener("DOMContentLoaded", function () {
    fetch("/schedule_approval") // ✅ Բերում ենք նոր API-ից
        .then(response => response.json())
        .then(data => {
            data.sort((a, b) => a.day_of_week - b.day_of_week || a.time_of_day - b.time_of_day);

            const tableBody = document.querySelector("#scheduleBody");
            tableBody.innerHTML = ""; // Մաքրում ենք հին տվյալները

            data.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.day_of_week}</td>  
                    <td>${item.time_of_day}</td>  
                    <td>${item.subject}</td>  
                    <td>${item.course}</td>  
                    <td>${item.mapped_type}</td>  
                    <td>${JSON.parse(item.teachers).join(", ")}</td>  
                    <td>${JSON.parse(item.rooms).join(", ")}</td>  
                    <td>${item.week_type}</td>  
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error("⚠️ Error fetching schedule approval data:", error));
});
