const daysOfWeek = ["Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ"];
const timeSlots = ["I", "II", "III", "IV"];
let isConfirmed = false;

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("generatePopup");
  const overlay = document.getElementById("generatePopupOverlay");
  const openBtn = document.getElementById("openGeneratePopup");
  const confirmBtn = document.getElementById("confirmGenerateBtn");
  const cancelBtn = document.getElementById("cancelGenerateBtn");

  if (!popup || !overlay || !openBtn || !confirmBtn || !cancelBtn) {
    console.error("❌ Մեկ կամ մի քանի popup տարրեր չգտնվեցին HTML-ում");
    return;
  }

  });

//   confirmBtn.addEventListener("click", async () => {
//     // Ցուցադրում ենք բեռնման անիմացիան
//     showLoading();
    
//     try {
//       const res = await fetch("/api/generate-schedule", { method: "POST" });
//       const data = await res.json();

//       if (res.ok) {
//         // Ցուցադրում ենք հաջողության անիմացիան
//         setTimeout(() => {
//           showSuccess();
//         }, 1000);
        
//         // Ուղղորդում ենք դեպի հաստատման էջ 2 վայրկյան անց
//         setTimeout(() => {
//           window.location.href = "/schedule-approval?role=admin";
//         }, 3000);
//       } else {
//         // Ցուցադրում ենք սխալի անիմացիան
//         setTimeout(() => {
//           showError(data.error || "Դասացուցակի կառուցման ընթացքում առաջացել է սխալ");
//         }, 1000);
//       }
//     } catch (err) {
//       console.error("Սխալ ալգորիթմի ընթացքում:", err);
//       // Ցուցադրում ենք սխալի անիմացիան
//       setTimeout(() => {
//         showError("Սերվերի հետ կապ հաստատելու ընթացքում սխալ առաջացավ");
//       }, 1000);
//     }
//   });
// });

// confirmBtn.addEventListener("click", async () => {
//     popup.classList.add("hidden");
//     overlay.classList.add("hidden");
    
//     setTimeout(() => {
//       window.location.href = "/schedule-approval?role=admin";
//     }, 300); // Քիչ ժամանակ թողնում ես որ փակվի popup-ը
//   });
// });

// Բեռնման վիճակը փոփափի մեջ ցուցադրելու գործառույթ
// function showLoading() {
//   const popup = document.getElementById("generatePopup");
//   popup.innerHTML = `
//     <div class="loading-container">
//       <div class="loading-spinner"></div>
//       <div class="loading-text">Դասացուցակի կառուցում...</div>
//     </div>
//   `;
// }

// Հաջողության վիճակը ցուցադրելու գործառույթ
// function showSuccess() {
//   const popup = document.getElementById("generatePopup");
//   popup.innerHTML = `
//     <div class="result-container success">
//       <div class="result-icon">
//         <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
//           <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
//           <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
//         </svg>
//       </div>
//       <div class="result-text">Դասացուցակը բարեհաջող կառուցվել է</div>
//       <button class="close-popup">Փակել</button>
//     </div>
//   `;

// 

// //  Ստեղծում ենք դասացուցակը
// async function generateSchedule() {
//   console.log("📌 generateSchedule() ԿԱՆՉՎԵՑ");  // 👈 Սա կօգնի տեսնել քանի անգամ է կկանչվում

//   if (!isConfirmed) {
//     alert(" Խնդրում ենք նախ հաստատել ժամերը:");
//     return;
//   }

//   //  Ցույց ենք տալիս բեռնման նշանը
//   document.getElementById("loadingSpinner").style.display = "block";

//   try {
//     //  Կանչում ենք backend-ի ալգորիթմը
//     const response = await fetch("/api/generate-schedule", { method: "POST" });

//     if (!response.ok) {
//       throw new Error(`Server error: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log(" Սերվերի պատասխանը:", data);

//     //  Եթե ամեն ինչ հաջող է, տեղափոխվում ենք `schedule-approval.html`
//     alert(" Դասացուցակը կազմվել է հաջողությամբ!");
//     window.location.href = "/schedule-approval?role=admin.html";

//   } catch (error) {
//     console.error(" Սխալ դասացուցակ կազմելիս:", error);
//     alert(" Սխալ՝ դասացուցակը կազմելու ժամանակ");
//   } finally {
//     // Հանում ենք բեռնման նշանը, եթե ինչ-որ բան սխալ գնաց
//     document.getElementById("loadingSpinner").style.display = "none";
//   }
// }


// async function generateSchedule() {
//     console.log("📌 generateSchedule() ԿԱՆՉՎԵՑ");
  
//     // Անմիջապես գնում ենք `schedule-approval` էջ
//     window.location.href = "/schedule-approval?role=admin";
// }
  
// Պահում ենք որպես հղում, որպեսզի կարողանանք այն վերականգնել
document.querySelector('script').confirmGenerateBtn_onClick = document.getElementById('confirmGenerateBtn').onclick;