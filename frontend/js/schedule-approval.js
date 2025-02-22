document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.querySelector("#scheduleTable tbody");

    // API-ից բերում ենք դասացուցակը
    fetch("/api/schedule")
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ""; // Մաքրում ենք հին տվյալները
            data.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.day_name}</td>
                    <td>${item.time_slot}</td>
                    <td>${item.subject_name}</td>
                    <td>${item.teacher_name}</td>
                    <td>${item.room_number}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error("⚠️ Error fetching schedule:", error));

    // Հաստատման կոճակ
    document.getElementById("confirmBtn").addEventListener("click", function () {
        alert("✅ Դասացուցակը հաստատված է");
    });

    // Հրաժարվելու կոճակ
    document.getElementById("rejectBtn").addEventListener("click", function () {
        alert("❌ Դասացուցակը մերժվել է");
    });
});
