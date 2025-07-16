/// <reference types="@types/google.maps" />
import type { WorkPostFilterInput, WorkPostForCardRender } from "../types/Work";
import Litepicker from "litepicker";
import "litepicker/dist/css/litepicker.css";
import { createDialogClickHandler } from "../utils/dialog-utils.js";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

//獲得要呈現在頁面上的所有貼文資料
async function getWorkPosts(
  filter?: WorkPostFilterInput
): Promise<WorkPostForCardRender[]> {
  let workPostsData: WorkPostForCardRender[];
  if (!filter) {
    const response = await fetch(`${API_BASE_URL}/api/works`, {
      method: "GET",
    });
    if (!response.ok) throw new Error("Failed to fetch work posts");
    const data = await response.json();
    workPostsData = data.formattedWorkPosts;
  } else {
    const queryString = toQueryString(filter);
    if (import.meta.env.VITE_MODE == "development") {
      console.log(queryString);
    }
    const response = await fetch(`${API_BASE_URL}/api/works?${queryString}`);
    if (!response.ok) throw new Error("Failed to fetch work posts");
    const data = await response.json();
    workPostsData = data.formattedWorkPosts;
  }
  return workPostsData;
}

//根據貼文資料，渲染 CardList
async function renderWorkPosts(postsData: WorkPostForCardRender[]) {
  const workListSection = document.getElementById("work-list") as HTMLElement;
  workListSection.replaceChildren();
  postsData.forEach((postData) => {
    const workPostTemplate = document.getElementById(
      "work-post-template"
    ) as HTMLTemplateElement;
    const workPostTemplateClone = workPostTemplate.content.cloneNode(
      true
    ) as DocumentFragment;
    const postSection = workPostTemplateClone.querySelector(
      ".work-post"
    ) as HTMLElement;
    postSection.dataset.unitId = postData.unit.id;
    postSection.addEventListener("mouseenter", () => {
      highlightMarker(postData.unit.id);
      postSection.classList.add("highlight");
    });
    postSection.addEventListener("mouseleave", () => {
      postSection.classList.remove("highlight");
    });

    const postA = workPostTemplateClone.querySelector("a") as HTMLAnchorElement;
    postA.href = `/workpost/${postData.id}`;
    postA.target = "_blank";

    const positionName = workPostTemplateClone.querySelector(
      ".position-name"
    ) as HTMLElement;
    if (positionName) {
      positionName.textContent = postData.positionName;
    } else {
      console.warn("Missing .position-name element in template");
    }

    const positionCategories = workPostTemplateClone.querySelector(
      ".position-categories"
    ) as HTMLElement;
    if (positionCategories) {
      postData.positionCategories.forEach((positionCategoryOption) => {
        let divTag = document.createElement("div");
        divTag.textContent = positionCategoryOption;
        positionCategories.appendChild(divTag);
      });
    } else {
      console.warn("Missing .position-categories element in template");
    }

    const unitName = workPostTemplateClone.querySelector(
      ".unit-name"
    ) as HTMLElement;
    if (unitName) {
      unitName.textContent = postData.unit.unitName!;
    } else {
      console.warn("Missing .unit-name element in template");
    }

    const avgWorkHours = workPostTemplateClone.querySelector(
      ".avg-work-hours"
    ) as HTMLElement;
    if (avgWorkHours) {
      avgWorkHours.textContent = `${postData.averageWorkHours}`;
    } else {
      console.warn("Missing .avg-work-hours element in template");
    }

    const minDuration = workPostTemplateClone.querySelector(
      ".min-stay-days"
    ) as HTMLElement;
    if (minDuration) {
      if (postData.minDuration == 0) {
        minDuration.textContent = "無限制";
      } else if (postData.minDuration == 7) {
        minDuration.textContent = "一週";
      } else if (postData.minDuration == 14) {
        minDuration.textContent = "兩週";
      } else if (postData.minDuration == 21) {
        minDuration.textContent = "三週";
      } else if (postData.minDuration == 28) {
        minDuration.textContent = "一個月";
      } else if (postData.minDuration == 60) {
        minDuration.textContent = "兩個月";
      } else if (postData.minDuration == 90) {
        minDuration.textContent = "兩個月以上";
      }
    } else {
      console.warn("Missing .min-stay-days element in template");
    }

    const accommodations = workPostTemplateClone.querySelector(
      ".accommodations"
    ) as HTMLElement;
    if (accommodations) {
      postData.accommodations.forEach((accommodationOption) => {
        let divTag = document.createElement("div");
        divTag.textContent = accommodationOption;
        accommodations.appendChild(divTag);
      });
    } else {
      console.warn("Missing .accommodations element in template");
    }
    const experiences = workPostTemplateClone.querySelector(
      ".experiences"
    ) as HTMLElement;
    if (experiences) {
      postData.experiences.forEach((experienceOption) => {
        let divTag = document.createElement("div");
        divTag.textContent = experienceOption;
        experiences.appendChild(divTag);
      });
    } else {
      console.warn("Missing .experiences element in template");
    }

    const environments = workPostTemplateClone.querySelector(
      ".environments"
    ) as HTMLElement;
    if (environments) {
      postData.environments.forEach((experienceOption) => {
        let divTag = document.createElement("div");
        divTag.textContent = experienceOption;
        environments.appendChild(divTag);
      });
    } else {
      console.warn("Missing .environments element in template");
    }
    const meals = workPostTemplateClone.querySelector(".meals") as HTMLElement;
    if (meals) {
      postData.meals.forEach((experienceOption) => {
        let divTag = document.createElement("div");
        divTag.textContent = experienceOption;
        meals.appendChild(divTag);
      });
    } else {
      console.warn("Missing .meals element in template");
    }
    const imagesDiv = workPostTemplateClone.querySelector(
      ".work-post-images"
    ) as HTMLElement;
    if (imagesDiv) {
      postData.images.forEach((image) => {
        let imgTag = document.createElement("img");
        imgTag.src = image;
        imagesDiv.appendChild(imgTag);
      });
    } else {
      console.warn("Missing .work-post-images element in template");
    }
    const images = imagesDiv.querySelectorAll("img");
    if (images && images.length > 0) {
      const imageWidth = 240;
      const prevBtn = workPostTemplateClone.querySelector(".right-arrow")!;
      const nextBtn = workPostTemplateClone.querySelector(".left-arrow")!;
      let currentIndex = 0;
      nextBtn.addEventListener("click", () => {
        if (currentIndex < images.length - 1) {
          currentIndex++;
          imagesDiv.style.transform = `translateX(-${
            currentIndex * imageWidth
          }px)`;
        }
      });

      prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          imagesDiv.style.transform = `translateX(-${
            currentIndex * imageWidth
          }px)`;
        }
      });
    }
    workListSection.appendChild(workPostTemplateClone);
  });
}

//初始化（取貼文資料、渲染貼文、渲染圖片）
async function initWorkPosts(filter?: WorkPostFilterInput) {
  try {
    const postsData: WorkPostForCardRender[] = await getWorkPosts(filter);
    console.log(postsData);
    await renderWorkPosts(postsData);
    updateMarkers(postsData);
  } catch (error) {
    console.error("初始化失敗", error);
  }
}

//初始化搜尋
function initFilter() {
  // 點擊篩選條件，跳出篩選視窗
  const filterBtn = document.getElementById("filter-search-btn") as HTMLElement;
  const filterDialog = document.getElementById(
    "filter-dialog"
  ) as HTMLDialogElement;
  filterBtn.addEventListener("click", () => {
    filterDialog.showModal();
    filterDialog.classList.add("show");
  });
  filterDialog.addEventListener(
    "click",
    createDialogClickHandler(filterDialog)
  );

  // 多選按鈕的選取特效
  document
    .querySelectorAll<HTMLButtonElement>(".toggle-option")
    .forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("selected");
      });
    });

  // ＝＝＝＝＝＝＝＝＝＝＝＝點擊送出篩選＝＝＝＝＝＝＝＝＝＝＝＝
  const filterSearchBtn = document.getElementById(
    "start-filter-search-btn"
  ) as HTMLButtonElement;
  filterSearchBtn.addEventListener("click", async () => {
    //取得並整理輸入資料
    const startDateStr = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDateStr = picker.getEndDate()?.format("YYYY-MM-DD");
    let filter: WorkPostFilterInput = {
      applicantCount: getSelectNumberValue("applicant-count"),
      city: getSelectedCity(),
      startDate: startDateStr,
      endDate: endDateStr,
      positionCategories: getSelectedOptionValues(
        ".position-category-option-btn"
      ),
      averageWorkHours: getSelectNumberValue("average-work-hours"),
      minDuration: getSelectNumberValue("min-stay-days"),
      accommodations: getSelectedOptionValues(".accommodation-option-btn"),
      meals: getSelectedOptionValues(".meal-option-btn"),
      experiences: getSelectedOptionValues(".experience-option-btn"),
      environments: getSelectedOptionValues(".environment-option-btn"),
    };

    initWorkPosts(filter); // 將 filter 轉為 QueryString 重新發送 Get 貼文資料、根據取得的結果，重新渲染頁面
    if (filter.city) {
      zoomToCity(map, filter.city);
    }
    filterDialog.close();
    filterDialog.classList.remove("show");
    initSearchSummary();
  });

  // ＝＝＝＝＝＝＝＝＝＝＝＝點擊送出搜尋＝＝＝＝＝＝＝＝＝＝＝＝
  const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;
  searchBtn.addEventListener("click", async () => {
    //取得並整理輸入資料
    const startDateStr = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDateStr = picker.getEndDate()?.format("YYYY-MM-DD");

    let filter: WorkPostFilterInput = {
      applicantCount: getSelectNumberValue("applicant-count"),
      city: getSelectedCity(),
      startDate: startDateStr,
      endDate: endDateStr,
    };

    initWorkPosts(filter); // filter 轉為 QueryString 重新發送 Get 貼文資料、根據取得的結果，重新渲染頁面
    if (filter.city) {
      zoomToCity(map, filter.city);
    }
    initSearchSummary();
  });
}
initFilter();

async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  let data = await res.json();
  if (data.success) {
    if (import.meta.env.VITE_MODE == "development") {
      console.log("userData", data);
    }
    return data;
  } else {
    if (import.meta.env.VITE_MODE == "development") {
      console.log("userData", data);
    }
    return null;
  }
}
//初始化訂閱
async function initSubscription() {
  const filterSubscriptionBtn = document.getElementById(
    "filter-subscription-btn"
  ) as HTMLButtonElement;
  let token = localStorage.getItem("token");
  if (!token || token == "undefined") {
    filterSubscriptionBtn.style.display = "none";
  } else {
    const userData = await getCurrentUser();
    if (userData) {
      if (userData.user.userType == "HELPER") {
        filterSubscriptionBtn.style.display = "inline-block";
      } else {
        filterSubscriptionBtn.style.display = "none";
      }
    } else {
      filterSubscriptionBtn.style.display = "none";
    }
  }

  //點擊訂閱
  filterSubscriptionBtn.addEventListener("click", async () => {
    //取得訂閱輸入資料
    const startDateStr = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDateStr = picker.getEndDate()?.format("YYYY-MM-DD");
    let filter: WorkPostFilterInput = {
      city: getSelectedCity(),
      startDate: startDateStr,
      endDate: endDateStr,
      applicantCount: getSelectNumberValue("applicant-count"),
      positionCategories: getSelectedOptionValues(
        ".position-category-option-btn"
      ),
      averageWorkHours: getSelectNumberValue("average-work-hours"),
      minDuration: getSelectNumberValue("min-stay-days"),
      accommodations: getSelectedOptionValues(".accommodation-option-btn"),
      meals: getSelectedOptionValues(".meal-option-btn"),
      experiences: getSelectedOptionValues(".experience-option-btn"),
      environments: getSelectedOptionValues(".environment-option-btn"),
    };

    //將資料存入後端
    let filterSubscribeResponse = await fetch(
      `${API_BASE_URL}/api/subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(filter),
      }
    );
    const filterSubscribeResponseData = await filterSubscribeResponse.json();
    if (import.meta.env.VITE_MODE == "development") {
      console.log("filterSubscribeResponseData", filterSubscribeResponseData);
    }
  });
}
initSubscription();

function toQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();

  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else {
      query.append(key, value);
    }
  }

  return query.toString();
}

//取值 select 轉數字
function getSelectNumberValue(id: string): number {
  const el = document.getElementById(id);
  if (el && el instanceof HTMLSelectElement) {
    const value = el.value;
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      return num;
    }
  }
  return 0; // 預設值
}

//取值多選
function getSelectedOptionValues(selector: string): string[] {
  const result: string[] = [];
  const selectedButtons = document.querySelectorAll(`${selector}.selected`);

  selectedButtons.forEach((btn) => {
    const element = btn as HTMLElement;
    const name = element.dataset.value;
    if (name) {
      result.push(name);
    }
  });
  return result;
}

//取值城市 datalist
function getSelectedCity(): string | undefined {
  const input = document.getElementById("search-area") as HTMLInputElement;
  const dataList = document.getElementById(
    "search-area-list"
  ) as HTMLDataListElement;

  const inputValue = input.value;
  const options = dataList.options;

  for (let i = 0; i < options.length; i++) {
    if (options[i].value === inputValue) {
      return inputValue;
    }
  }

  return undefined;
}

//月曆設定
const picker = new Litepicker({
  element: document.getElementById("date-range") as HTMLInputElement,
  singleMode: false, // 用 range 模式
  numberOfMonths: 2,
  numberOfColumns: 2,
  format: "YYYY-MM-DD",
  minDate: new Date(), // 禁用過去
  autoApply: true, // 自動關閉
});

let map: google.maps.Map;
const markerMap = new Map<string, google.maps.marker.AdvancedMarkerElement>();
const position = { lat: 23.8, lng: 121 };

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

function initMap() {
  const mapOptions: google.maps.MapOptions = {
    zoom: 8,
    disableDefaultUI: true,
    center: position,
    mapId: "17b3c4a84167ae626614a13a",
  };

  map = new google.maps.Map(
    document.getElementById("google-map") as HTMLElement,
    mapOptions
  );
}

loadGoogleMaps()
  .then(() => {
    initMap();
    initWorkPosts();
  })
  .catch(console.error);

function updateMarkers(postsData: WorkPostForCardRender[]) {
  const newIds = new Set(postsData.map((post) => post.unit.id));

  // 刪除不需要的 marker
  for (const [id, marker] of markerMap) {
    console.log("markerMap", markerMap);
    if (!newIds.has(id)) {
      marker.map = null;
      markerMap.delete(id);
    }
  }

  // 新增新的 marker
  postsData.forEach((post) => {
    if (!markerMap.has(post.unit.id)) {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: post.unit.latitude, lng: post.unit.longitude },
        map,
        title: post.unit.unitName,
        content: createDefaultMarkerElement(),
      });

      marker.addListener("gmp-click", () => {
        highlightCard(post.unit.id);
        markerMap.forEach((m) => (m.content = createDefaultMarkerElement()));
        marker.content = createClickedMarkerElement();
      });
      markerMap.set(post.unit.id, marker);
    }
  });
}

function highlightCard(unitId: string) {
  document.querySelectorAll(".work-post").forEach((post) => {
    const card = post as HTMLElement;
    card.classList.toggle("highlight", card.dataset.unitId === unitId);
    if (card.dataset.unitId === unitId) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

function highlightMarker(unitId: string) {
  const marker = markerMap.get(unitId);
  if (marker) {
    markerMap.forEach((m) => (m.content = createDefaultMarkerElement()));
    marker.content = createClickedMarkerElement();
  }
}
function createDefaultMarkerElement(): HTMLElement {
  let i = document.createElement("i");
  i.className = "fa-solid fa-location-dot";
  i.style.fontSize = "24px";
  i.style.color = "white";
  i.style.filter = "drop-shadow(0 0 3px rgba(0, 0, 0, 0.4))";
  return i;
}
function createClickedMarkerElement(): HTMLElement {
  const i = document.createElement("i");
  i.className = "fa-solid fa-location-dot";
  i.style.fontSize = "30px";
  i.style.color = "black";
  i.style.filter = "drop-shadow(0 0 3px rgba(0, 0, 0, 0.4))";
  return i;
}

function zoomToCity(map: google.maps.Map, city: string) {
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: city }, (results, status) => {
    if (status === "OK" && results && results[0]) {
      const result = results[0];

      // 調整地圖視野到城市的邊界範圍
      const viewport = result.geometry.viewport;
      if (viewport) {
        map.fitBounds(viewport); // 自動調整 zoom 與 center
      } else {
        map.setCenter({ lat: 23.8, lng: 121 });
        map.setZoom(10);
      }
    } else {
      console.error("Geocode error:", status);
    }
  });
}

//================================================
const searchSection = document.getElementById("search-section")!;
const searchSummary = document.getElementById("search-summary")!;
const searchBar = document.getElementById("search-bar")!;
const filterBtn = document.getElementById("filter-search-btn")!;
const searchOverlay = document.getElementById("search-overlay")!;
const header = document.getElementById("header")!;
const calendar = document.querySelector(".litepicker")!;
const searchBtn = document.getElementById("search-btn");

// 搜尋欄 Toggle 展開與收合
searchSummary.addEventListener("click", (e) => {
  e.stopPropagation();
  searchBar.classList.add("active");
  searchOverlay.classList.remove("hidden");
  header.classList.add("active");
  searchSummary.style.display = "none";
  filterBtn.style.display = "none";
});
// 點擊外部或搜尋按鈕，收合搜尋欄
searchBtn?.addEventListener("click", () => {
  searchBar.classList.remove("active");
  header.classList.remove("active");
  searchOverlay.classList.add("hidden");
  searchSummary.style.display = "flex";
  filterBtn.style.display = "block";
});
document.addEventListener("mousedown", (e) => {
  if (
    !searchSection.contains(e.target as Node) &&
    !calendar.contains(e.target as Node)
  ) {
    searchBar.classList.remove("active");
    header.classList.remove("active");
    searchOverlay.classList.add("hidden");
    searchSummary.style.display = "flex";
    filterBtn.style.display = "block";
  }
});

function initSearchSummary() {
  const searchSummaryCity = document.getElementById(
    "search-summary-city"
  ) as HTMLDivElement;
  const cityInput = document.getElementById("search-area") as HTMLInputElement;
  if (cityInput.value) {
    console.log("cityInput.textContent", cityInput.textContent);
    searchSummaryCity.textContent = cityInput.value;
  } else searchSummaryCity.textContent = "附近的去處";

  const searchSummaryDate = document.getElementById(
    "search-summary-date"
  ) as HTMLDivElement;
  const dateInput = document.getElementById("date-range") as HTMLInputElement;
  if (dateInput.value) {
    console.log("dateInput.textContent", dateInput.textContent);
    searchSummaryDate.textContent = dateInput.value;
  } else {
    searchSummaryDate.textContent = "任何時間";
  }

  const searchSummaryCount = document.getElementById(
    "search-summary-count"
  ) as HTMLDivElement;
  const countInput = document.getElementById(
    "applicant-count"
  ) as HTMLSelectElement;

  if (countInput.value) {
    searchSummaryCount.textContent = `${countInput.value} 人`;
  } else {
    searchSummaryCount.textContent = "新增人數";
  }
}
initSearchSummary();
