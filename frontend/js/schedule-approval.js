document.addEventListener("DOMContentLoaded", function () {
    fetch("/schedule_approval")
        .then(response => response.json())
        .then(data => {
            // Եթե անհրաժեշտ է, կարող եք այստեղ նաև sort անել, բայց եթե API-ն արդեն վերցնում է ճիշտ վերանվանված դաշտեր,
            // ապա այս սորտավորումը կարելի է չհանել:
            // data.sort((a, b) => a.day.localeCompare(b.day) || a.time_slot.localeCompare(b.time_slot));

            const tableBody = document.querySelector("#scheduleBody");
            tableBody.innerHTML = ""; // Մաքրում ենք հին տվյալները

            data.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.day}</td>  
                    <td>${item.time_slot}</td>  
                    <td>${item.subject}</td>  
                    <td>${item.course}</td>  
                    <td>${item.class_type}</td>  
                    <td>${item.teacher}</td>  
                    <td>${item.room}</td>  
                    <td>${item.week_type}</td>  
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error("⚠️ Error fetching schedule approval data:", error));
});
