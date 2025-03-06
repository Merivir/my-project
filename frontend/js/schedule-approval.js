document.addEventListener("DOMContentLoaded", function () {
    fetch("/schedule_approval")  // ✅ Ստուգել, որ API-ի ուղղությունը ճիշտ է
        .then(response => response.json())
        .then(data => {
            console.log("📌 API-ից ստացված տվյալները:", data); // ✅ Debugging համար
            
            if (!Array.isArray(data) || data.length === 0) {
                console.warn("⚠️ API-ից տվյալներ չկան կամ սխալ ֆորմատ է");
                document.querySelector("#scheduleBody").innerHTML = "<tr><td colspan='8' style='text-align:center;'>📢 Տվյալներ չկան</td></tr>";
                return;
            }

            renderSchedule(data);
        })
        .catch(error => console.error("⚠️ Error fetching schedule approval data:", error));

    // ✅ Հաստատելու կոճակը սեղմելիս տանում է դեպի guest.html
    document.getElementById("confirmBtn").addEventListener("click", function () {
        alert("✅ Դասացուցակը հաստատված է!");
        window.location.href = "/guest";
    });

    // ❌ Հրաժարվելու կոճակը սեղմելիս վերադարձնում է admin-dashboard.html
    document.getElementById("rejectBtn").addEventListener("click", function () {
        const confirmReject = confirm("Համոզվա՞ծ եք, որ ցանկանում եք հրաժարվել։");
        if (confirmReject) {
            window.location.href = "/admin-dashboard";
        }
    });
});

function renderSchedule(data) {
    const tableBody = document.querySelector("#scheduleBody");
    tableBody.innerHTML = ""; // ✅ Մաքրում ենք հին տվյալները

    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.day || "❌"}</td>  
            <td>${item.time_slot || "❌"}</td>  
            <td>${item.subject || "❌"}</td>  
            <td>${item.course || "❌"}</td>  
            <td>${item.class_type || "❌"}</td>  
            <td>${item.teacher || "❌"}</td>  
            <td>${item.room || "❌"}</td>  
            <td>${item.week_type || "❌"}</td>  
        `;
        tableBody.appendChild(row);
    });

    console.log("✅ Աղյուսակը հաջողությամբ լցվեց");
}
