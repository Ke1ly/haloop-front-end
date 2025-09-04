/// <reference types="@types/google.maps" />
import type { WorkPostForPageRender } from "../types/Work";
import { API_BASE_URL } from "../utils/config.js";
// import Litepicker from "litepicker";
// import "litepicker/dist/css/litepicker.css";
import { createDialogClickHandler } from "../utils/dialog-utils.js";

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAP_API_KEY
    }&libraries=marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps 載入失敗"));
    document.head.appendChild(script);
  });
}

loadGoogleMaps()
  .then(() => {
    initWorkPosts();
  })
  .catch(console.error);

//取得欲渲染的 workpostId
const urlParams = new URLSearchParams(window.location.search);
let workpostId = urlParams.get("id");

async function getWorkPost(): Promise<WorkPostForPageRender> {
  const response = await fetch(
    `${API_BASE_URL}/api/workpost?id=${workpostId}`,
    {
      method: "GET",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch work post");
  const data = await response.json();
  return data;
}
async function renderWorkPost(postData: WorkPostForPageRender) {
  if (postData.unit.latitude !== null && postData.unit.longitude !== null) {
    const position = {
      lat: postData.unit.latitude,
      lng: postData.unit.longitude,
    };
    const mapOptions: google.maps.MapOptions = {
      zoom: 13,
      disableDefaultUI: true,
      center: position,
      mapId: "17b3c4a84167ae626614a13a",
    };
    let map: google.maps.Map = new google.maps.Map(
      document.getElementById("google-map") as HTMLElement,
      mapOptions
    );
    new google.maps.marker.AdvancedMarkerElement({
      position: { lat: postData.unit.latitude, lng: postData.unit.longitude },
      map,
      title: postData.unit.unitName,
      // content: createDefaultMarkerElement(),
    });
  } else {
    const map = document.getElementById("google-map");
    if (map) {
      // map.style.border = "1px solid rgb(162, 139, 121)";
      map.style.background = " #ede8de";
      map.style.boxShadow = "0px 0px 5px rgba(0, 0 , 0 , 0.2)";
      map.style.fontWeight = "500";
      map.style.color = "rgb(162, 139, 121)";
      map.style.textAlign = "center";
      map.style.padding = "20px 0px";
      map.textContent =
        "Oops! 店家提供的地址可能有誤，或不完整，暫時無法解析地圖位置";
    }

    console.warn(
      `Skipping marker for unit ${postData.unit.id} due to missing coordinates`
    );
  }

  const positionName = document.querySelector(
    ".position-name"
  ) as HTMLDivElement;
  positionName.textContent = postData.positionName;

  const unitName = document.querySelector(".unit-name") as HTMLDivElement;
  unitName.textContent = postData.unit.unitName;

  const unitCity = document.querySelector(".unit-city") as HTMLDivElement;
  unitCity.textContent = postData.unit.city;

  const unitDistrict = document.querySelector(
    ".unit-district"
  ) as HTMLDivElement;
  if (postData.unit.district) {
    unitDistrict.textContent = postData.unit.district;
  }

  const summaryImg01 = document.querySelector(
    ".summary-img-01"
  ) as HTMLImageElement;
  summaryImg01.src = postData.images[0];

  const summaryImg02 = document.querySelector(
    ".summary-img-02"
  ) as HTMLImageElement;
  summaryImg02.src = postData.images[1];

  const positionDescription = document.querySelector(
    ".position-description"
  ) as HTMLDivElement;
  positionDescription.textContent = postData.positionDescription;

  const avgWorkHours = document.querySelector(
    ".avg-work-hours"
  ) as HTMLDivElement;
  avgWorkHours.textContent = `每日平均 ${postData.averageWorkHours} 小時`;

  const positionCategories = document.querySelector(
    ".position-categories"
  ) as HTMLDivElement;
  if (postData.positionCategories) {
    positionCategories.textContent = postData.positionCategories.join(" ・ ");
  }

  const positionRequirements = document.querySelector(
    ".position-requirements"
  ) as HTMLDivElement;
  if (postData.requirements) {
    positionRequirements.textContent = postData.requirements.join(" ・ ");
  }

  const benefitDescription = document.querySelector(
    ".benefit-description"
  ) as HTMLDivElement;
  benefitDescription.textContent = postData.benefitsDescription;

  const accommodations = document.querySelector(
    ".benefit-accommodations"
  ) as HTMLDivElement;
  if (postData.accommodations) {
    accommodations.textContent = postData.accommodations.join(" ・ ");
  }

  const meals = document.querySelector(".benefit-meals") as HTMLDivElement;
  if (postData.meals) {
    meals.textContent = postData.meals.join(" ・ ");
  }

  const experiences = document.querySelector(
    ".benefit-experiences"
  ) as HTMLDivElement;
  if (postData.experiences) {
    experiences.textContent = postData.experiences.join(" ・ ");
  }

  const minDuration = document.querySelector(".min-duration") as HTMLDivElement;
  minDuration.textContent = `最短需停留 ${postData.minDuration} 天`;

  const recruitCount = document.querySelector(
    ".recruit-count"
  ) as HTMLDivElement;
  recruitCount.textContent = `同時段招募 ${postData.recruitCount} 人`;

  const availableDates = document.querySelector(
    ".available-dates"
  ) as HTMLDivElement;
  let start = new Date(postData.startDate).toISOString().split("T")[0];
  let end = new Date(postData.endDate).toISOString().split("T")[0];
  availableDates.textContent = `開放於 ${start} 至  ${end}`;

  const unitAddress = document.querySelector(".unit-address") as HTMLDivElement;
  unitAddress.textContent = postData.unit.address;

  const unitDescription = document.querySelector(
    ".unit-description"
  ) as HTMLDivElement;
  if (postData.unit.unitDescription) {
    unitDescription.textContent = postData.unit.unitDescription;
  }

  const environments = document.querySelector(
    ".environments"
  ) as HTMLDivElement;
  if (postData.environments) {
    environments.textContent = postData.environments.join(" ・ ");
  }

  const profileUnitName = document.querySelector(
    ".profile-unit-name"
  ) as HTMLDivElement;
  profileUnitName.textContent = postData.unit.unitName;

  const joinedAt = document.querySelector(".joined-at") as HTMLDivElement;
  const joinDate = new Date(postData.unit.createdAt)
    .toISOString()
    .split("T")[0];
  joinedAt.textContent = `於 ${joinDate} 加入`;

  const lastLoginAt = document.querySelector(
    ".last-login-at"
  ) as HTMLDivElement;

  if (postData.unit.user.lastLoginAt) {
    const loginDate = new Date(
      postData.unit.user.lastLoginAt
    ).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    lastLoginAt.textContent = `上次登入於 ${loginDate}`;
  } else {
    lastLoginAt.textContent = ``;
  }

  const sendMessageBtn = document.querySelector(
    ".send-message-btn"
  ) as HTMLDivElement;
  const userData = await getCurrentUser();
  if (userData && userData.user.userType === "HOST") {
    sendMessageBtn.style.display = "none";
  }

  sendMessageBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      const signInDialog = document.getElementById(
        "sign-in-dialog"
      ) as HTMLDialogElement;
      signInDialog.showModal();
      signInDialog.classList.add("show");
      signInDialog.addEventListener(
        "click",
        createDialogClickHandler(signInDialog)
      );
      return;
    } else {
      const userData = await getCurrentUser();
      if (!userData) {
        const signInDialog = document.getElementById(
          "sign-in-dialog"
        ) as HTMLDialogElement;
        signInDialog.showModal();
        signInDialog.classList.add("show");
        signInDialog.addEventListener(
          "click",
          createDialogClickHandler(signInDialog)
        );
        return;
      }
    }

    let response = await fetch(`${API_BASE_URL}/api/chat/conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        targetUserId: postData.unit.userId,
      }),
    });
    let coversationData = await response.json();
    localStorage.setItem("activeConvId", coversationData.id);
    window.location.assign("/chat.html");
  });
}
async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!res.ok) {
    return null;
  }
  let data = await res.json();
  if (data.success) {
    return data;
  } else {
    return null;
  }
}

async function initWorkPosts() {
  try {
    const postData: WorkPostForPageRender = await getWorkPost();
    if (import.meta.env.VITE_MODE == "development") {
      console.log("當前頁面渲染 workpost 資料", postData);
    }
    renderWorkPost(postData);
  } catch (error) {
    if (import.meta.env.VITE_MODE == "development") {
      console.error("頁面初始化失敗", error);
    }
  }
}

//==================================================================

// const availabilityData: { [date: string]: number } = {
//   "2025-07-01": 2,
//   "2025-07-02": 0,
//   "2025-07-03": 3,
//   "2025-07-04": 0,
//   "2025-07-05": 1,
// }; //測試資料
// const response = await fetch(
//   `${API_BASE_URL}/api/workpost/availability/:workpostId?startDate=${startStr}&endDate=${endStr}`
// );
// const availabilityData = await response.json();

// new Litepicker({
//   element: document.getElementById("calendar")!,
//   inlineMode: true,
//   singleMode: false,
//   numberOfMonths: 1,
//   numberOfColumns: 1,
//   format: "YYYY-MM-DD",
//   firstDay: 0,
//   setup: (picker) => {
//     picker.on("render", () => {
//       const cells = document.querySelectorAll(".litepicker-day");

//       cells.forEach((cell) => {
//         const date = cell.getAttribute("data-time");
//         if (!date) return;

//         const day = new Date(Number(date));
//         const dateStr = day.toISOString().split("T")[0];

//         const remain = availabilityData[dateStr];

//         if (remain === 0) {
//           cell.classList.add("full");
//           cell.classList.add("is-disabled");
//         } else if (remain > 0) {
//           cell.classList.add("available");
//         } else {
//           cell.classList.add("unavailable");
//           cell.classList.add("is-disabled");
//         }
//       });
//     });

//     picker.on("selected", (start, end) => {
//       const selectedStart = start.format("YYYY-MM-DD");
//       const selectedEnd = end.format("YYYY-MM-DD");
//       const dateList = getDateRangeArray(selectedStart, selectedEnd);

//       const allAvailable = dateList.every((d) => availabilityData[d] > 0);

//       const statusBox = document.getElementById("calendar-status")!;
//       if (allAvailable) {
//         statusBox.innerText = `此區間可申請！`;
//         statusBox.style.color = "green";
//       } else {
//         statusBox.innerText = `選擇區間內有日期已滿或未開放`;
//         statusBox.style.color = "red";
//       }
//     });
//   },
// });

// // 建立區間內的日期陣列
// function getDateRangeArray(startStr: string, endStr: string) {
//   const list = [];
//   let cur = new Date(startStr);
//   const end = new Date(endStr);

//   while (cur <= end) {
//     list.push(cur.toISOString().split("T")[0]);
//     cur.setDate(cur.getDate() + 1);
//   }
//   return list;
// }
