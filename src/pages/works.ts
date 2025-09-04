/// <reference types="@types/google.maps" />
import type { WorkPostFilterInput, WorkPostForCardRender } from "../types/Work";
import Litepicker from "litepicker";
import "litepicker/dist/css/litepicker.css";
import { createDialogClickHandler } from "../utils/dialog-utils.js";
import { API_BASE_URL } from "../utils/config.js";

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
      console.log("送出查詢的 query string", queryString);
    }
    const response = await fetch(`${API_BASE_URL}/api/works?${queryString}`);
    if (!response.ok) throw new Error("Failed to fetch work posts");
    const data = await response.json();
    workPostsData = data.formattedWorkPosts;
  }
  return workPostsData;
}

//根據貼文資料，渲染 CardList
async function renderWorkPosts(
  postsData: WorkPostForCardRender[],
  filter?: WorkPostFilterInput
) {
  const workPostSection = document.getElementById("posts") as HTMLElement;
  workPostSection.replaceChildren();
  if (postsData.length > 0) {
    const noPost = document.getElementById("no-post") as HTMLDivElement;
    noPost.style.display = "none";
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

      const postA = workPostTemplateClone.querySelector(
        "a"
      ) as HTMLAnchorElement;
      postA.href = `/workpost.html?id=${postData.id}`;
      postA.target = "_blank";

      const positionName = workPostTemplateClone.querySelector(
        ".position-name"
      ) as HTMLElement;
      if (positionName) {
        positionName.textContent = postData.positionName;
      } else {
        if (import.meta.env.VITE_MODE == "development") {
          console.warn("Missing .position-name element in template");
        }
      }
      const unitName = workPostTemplateClone.querySelector(
        ".unit-name"
      ) as HTMLElement;
      if (unitName) {
        unitName.textContent = postData.unit.unitName!;
      } else {
        if (import.meta.env.VITE_MODE == "development") {
          console.warn("Missing .unit-name element in template");
        }
      }

      const avgWorkHours = workPostTemplateClone.querySelector(
        ".avg-work-hours"
      ) as HTMLElement;
      if (avgWorkHours) {
        avgWorkHours.textContent = `平均每日工時 ${postData.averageWorkHours} 小時`;
      } else {
        if (import.meta.env.VITE_MODE == "development") {
          console.warn("Missing .avg-work-hours element in template");
        }
      }

      const minDuration = workPostTemplateClone.querySelector(
        ".min-stay-days"
      ) as HTMLElement;
      if (minDuration) {
        if (postData.minDuration == 0) {
          minDuration.textContent = "無限制最短停留時間";
        } else if (postData.minDuration == 7) {
          minDuration.textContent = "最短停留一週";
        } else if (postData.minDuration == 14) {
          minDuration.textContent = "最短停留兩週";
        } else if (postData.minDuration == 21) {
          minDuration.textContent = "最短停留三週";
        } else if (postData.minDuration == 28) {
          minDuration.textContent = "最短停留一個月";
        } else if (postData.minDuration == 60) {
          minDuration.textContent = "最短停留兩個月";
        } else if (postData.minDuration == 90) {
          minDuration.textContent = "最短停留兩個月以上";
        }
      } else {
        if (import.meta.env.VITE_MODE == "development") {
          console.warn("Missing .min-stay-days element in template");
        }
      }
      const filterTags = workPostTemplateClone.querySelector(
        ".filter-tags"
      ) as HTMLElement;
      if (filterTags && filter) {
        if (filter.positionCategories && filter.positionCategories.length > 0) {
          postData.positionCategories.forEach((positionCategoryOption) => {
            if (filter.positionCategories?.includes(positionCategoryOption)) {
              let divTag = document.createElement("div");
              divTag.textContent = positionCategoryOption;
              filterTags.appendChild(divTag);
            }
          });
        }
        if (filter.accommodations && filter.accommodations.length > 0) {
          postData.accommodations.forEach((accommodationsOption) => {
            if (filter.accommodations?.includes(accommodationsOption)) {
              let divTag = document.createElement("div");
              divTag.textContent = accommodationsOption;
              filterTags.appendChild(divTag);
            }
          });
        }

        if (filter.experiences && filter.experiences.length > 0) {
          postData.experiences.forEach((experiencesOption) => {
            if (filter.experiences?.includes(experiencesOption)) {
              let divTag = document.createElement("div");
              divTag.textContent = experiencesOption;
              filterTags.appendChild(divTag);
            }
          });
        }

        if (filter.environments && filter.environments.length > 0) {
          postData.environments.forEach((environmentsOption) => {
            if (filter.environments?.includes(environmentsOption)) {
              let divTag = document.createElement("div");
              divTag.textContent = environmentsOption;
              filterTags.appendChild(divTag);
            }
          });
        }

        if (filter.meals && filter.meals.length > 0) {
          postData.meals.forEach((mealsOption) => {
            if (filter.meals?.includes(mealsOption)) {
              let divTag = document.createElement("div");
              divTag.textContent = mealsOption;
              filterTags.appendChild(divTag);
            }
          });
        }
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
        if (import.meta.env.VITE_MODE == "development") {
          console.warn("Missing .work-post-images element in template");
        }
      }
      const images = imagesDiv.querySelectorAll("img");
      if (images && images.length > 0) {
        const prevBtn = workPostTemplateClone.querySelector(".right-arrow")!;
        const nextBtn = workPostTemplateClone.querySelector(".left-arrow")!;
        let currentIndex = 0;

        const getTranslateXValue = () => {
          let totalWidth = 0;
          for (let i = 0; i < currentIndex; i++) {
            // 使用 getBoundingClientRect() 獲取圖片的實際寬度
            totalWidth += images[i].getBoundingClientRect().width;
          }
          return totalWidth;
        };
        nextBtn.addEventListener("click", () => {
          if (currentIndex < images.length - 1) {
            currentIndex++;
            imagesDiv.style.transform = `translateX(-${getTranslateXValue()}px)`;
          }
        });

        prevBtn.addEventListener("click", () => {
          if (currentIndex > 0) {
            currentIndex--;
            imagesDiv.style.transform = `translateX(-${getTranslateXValue()}px)`;
          }
        });
        window.addEventListener("resize", () => {
          imagesDiv.style.transform = `translateX(-${getTranslateXValue()}px)`;
        });
      }

      workPostSection.appendChild(workPostTemplateClone);
    });
  } else {
    const noPost = document.getElementById("no-post") as HTMLDivElement;
    noPost.style.display = "flex";
    initSubscriptionBtn();
  }
}

//初始化（取貼文資料、渲染貼文、渲染圖片）
async function initWorkPosts(filter?: WorkPostFilterInput) {
  try {
    const postsData: WorkPostForCardRender[] = await getWorkPosts(filter);
    if (import.meta.env.VITE_MODE == "development") {
      console.log("當前頁面渲染的 posts", postsData);
    }
    await renderWorkPosts(postsData, filter);
    updateMarkers(postsData);
  } catch (error) {
    if (import.meta.env.VITE_MODE == "development") {
      console.error("works 頁面初始化失敗", error);
    }
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
    return data;
  } else {
    return null;
  }
}

//初始化訂閱按鈕渲染與否
const filterSubscriptionBtn = document.getElementById(
  "filter-subscription-btn"
) as HTMLButtonElement;
const filterSubscriptionCta = document.getElementById(
  "filter-subscription-cta"
) as HTMLButtonElement;

async function initSubscriptionBtn() {
  let token = localStorage.getItem("token");
  if (!token || token == "undefined") {
    filterSubscriptionBtn.style.display = "none";
    filterSubscriptionCta.style.display = "none";
  } else {
    const userData = await getCurrentUser();
    if (userData) {
      if (userData.user.userType == "HELPER") {
        filterSubscriptionBtn.style.display = "inline-block";
        filterSubscriptionCta.style.display = "block";
      } else {
        filterSubscriptionBtn.style.display = "none";
        filterSubscriptionCta.style.display = "none";
      }
    } else {
      filterSubscriptionBtn.style.display = "none";
      filterSubscriptionCta.style.display = "none";
    }
  }
}
initSubscriptionBtn();

//點擊訂閱後，跳出確認 dialog
let currentFilter: WorkPostFilterInput | null = null;
[filterSubscriptionCta, filterSubscriptionBtn].forEach((btn) => {
  btn.addEventListener("click", async () => {
    const responseMessage = document.querySelector(
      ".subscription-response-message"
    ) as HTMLDivElement;
    const errorMessage = document.querySelector(
      ".subscription-error-message"
    ) as HTMLDivElement;
    if (responseMessage) {
      responseMessage.textContent = "";
    }
    if (errorMessage) {
      errorMessage.textContent = "";
    }
    //關閉原本的 advanced-search dialog

    //取得訂閱輸入資料，渲染於 dialog
    const startDateStr = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDateStr = picker.getEndDate()?.format("YYYY-MM-DD");
    const city = getSelectedCity();
    const applicantCount = getSelectNumberValue("applicant-count");
    const positionCategories = getSelectedOptionValues(
      ".position-category-option-btn"
    );
    const averageWorkHours = getSelectNumberValue("average-work-hours");
    const minDuration = getSelectNumberValue("min-stay-days");
    const meals = getSelectedOptionValues(".meal-option-btn");
    const experiences = getSelectedOptionValues(".experience-option-btn");
    const accommodations = getSelectedOptionValues(".accommodation-option-btn");
    const environments = getSelectedOptionValues(".environment-option-btn");
    if (
      !(
        city ||
        startDateStr ||
        endDateStr ||
        applicantCount ||
        averageWorkHours ||
        minDuration ||
        positionCategories.length ||
        meals.length ||
        experiences.length ||
        accommodations.length ||
        environments.length
      )
    ) {
      errorMessage.textContent = "請先選擇至少一個條件";
      errorMessage.style.color = "red";
      errorMessage.style.margin = "10px 5px";
      errorMessage.style.fontSize = "14px";
      return;
    }

    currentFilter = {
      city: city,
      startDate: startDateStr,
      endDate: endDateStr,
      applicantCount,
      positionCategories,
      averageWorkHours,
      minDuration,
      accommodations,
      meals,
      experiences,
      environments,
    };
    if (import.meta.env.VITE_MODE == "development") {
      console.log("準備發送訂閱的 filter", currentFilter);
    }

    //打開訂閱 dialog
    const subscriptionDialog = document.getElementById(
      "subscription-dialog"
    ) as HTMLDialogElement;
    subscriptionDialog.showModal();
    subscriptionDialog.classList.add("show");
    subscriptionDialog.addEventListener(
      "click",
      createDialogClickHandler(subscriptionDialog)
    );
    renderFilterDtails(currentFilter);
  });
});

//點擊確認訂閱，取得訂閱輸入資料，連同 "filter-name" 存入後端
const confirmBtn = document.getElementById("filter-subscription-confirm-btn");
if (confirmBtn) {
  confirmBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const filterNameInput = document.getElementById(
      "filter-name-input"
    ) as HTMLInputElement;
    const filterName = filterNameInput.value;

    const responseMessage = document.querySelector(
      ".subscription-response-message"
    ) as HTMLDivElement;

    if (!filterName) {
      if (responseMessage) {
        responseMessage.textContent = "請輸入訂閱名稱";
        responseMessage.style.color = "red";
      }
      return;
    }
    if (currentFilter) {
      currentFilter.name = filterName;
    }

    try {
      //將資料存入後端
      let res = await fetch(`${API_BASE_URL}/api/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(currentFilter),
      });
      if (!res.ok) throw new Error("Failed to update subscriptions");
      const filterSubscribeResponseData = await res.json();

      if (import.meta.env.VITE_MODE == "development") {
        console.log("filter 訂閱 response", filterSubscribeResponseData);
      }

      if (responseMessage) {
        responseMessage.textContent = "訂閱成功";
        responseMessage.style.color = "green";
      }

      const subscriptionDialog = document.getElementById(
        "subscription-dialog"
      ) as HTMLDialogElement;
      setTimeout(() => {
        subscriptionDialog.close();
        subscriptionDialog.classList.remove("show");
        currentFilter = null; // 重置 currentFilter
        responseMessage.textContent = "";
        const filterDialog = document.getElementById(
          "filter-dialog"
        ) as HTMLDialogElement;
        filterDialog.close();
        filterDialog.classList.remove("show");
      }, 2000);
    } catch (error) {
      if (import.meta.env.VITE_MODE == "development") {
        console.error("訂閱失敗:", error);
      }

      const responseMessage = document.querySelector(
        ".subscription-response-message"
      );
      if (responseMessage) {
        responseMessage.textContent = "訂閱失敗，請稍後再試";
      }
    }
  });
}

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
      if (import.meta.env.VITE_MODE == "development") {
        console.error("Geocode error:", status);
      }
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
const main = document.querySelector("main")!;
const mapSection = document.querySelector("#google-map") as HTMLElement;
const workListSection = document.querySelector("#work-list") as HTMLElement;

// 搜尋欄 Toggle 展開與收合
searchSummary.addEventListener("click", (e) => {
  e.stopPropagation();
  searchBar.classList.add("active");
  searchOverlay.classList.remove("hidden");
  header.classList.add("active");
  searchSummary.style.display = "none";
  filterBtn.style.display = "none";
  main.style.height = "calc(100vh - 180px)";
  mapSection.style.height = "calc(100vh - 220px)";
  workListSection.style.height = "calc(100vh - 180px)";
});
// 點擊外部或搜尋按鈕，收合搜尋欄
searchBtn?.addEventListener("click", () => {
  searchBar.classList.remove("active");
  header.classList.remove("active");
  searchOverlay.classList.add("hidden");
  searchSummary.style.display = "flex";
  filterBtn.style.display = "block";
  main.style.height = "calc(100vh - 110px)";
  mapSection.style.height = "calc(100vh - 150px)";
  workListSection.style.height = "calc(100vh - 110px)";
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
    main.style.height = "calc(100vh - 110px)";
    mapSection.style.height = "calc(100vh - 150px)";
    workListSection.style.height = "calc(100vh - 110px)";
  }
});

function initSearchSummary() {
  const searchSummaryCity = document.getElementById("search-summary-city");
  if (searchSummaryCity) {
    const cityInput = document.getElementById(
      "search-area"
    ) as HTMLInputElement;
    if (cityInput.value) {
      searchSummaryCity.textContent = cityInput.value;
    } else {
      searchSummaryCity.textContent = "附近的去處";
    }
  }

  const searchSummaryDate = document.getElementById("search-summary-date");
  if (searchSummaryDate) {
    const dateInput = document.getElementById("date-range") as HTMLInputElement;
    if (dateInput.value) {
      searchSummaryDate.textContent = dateInput.value;
    } else {
      searchSummaryDate.textContent = "任何時間";
    }
  }

  const searchSummaryCount = document.getElementById(
    "search-summary-count"
  ) as HTMLDivElement;
  if (searchSummaryCount) {
    const countInput = document.getElementById(
      "applicant-count"
    ) as HTMLSelectElement;

    if (countInput.value) {
      searchSummaryCount.textContent = `${countInput.value} 人`;
    } else {
      searchSummaryCount.textContent = "新增人數";
    }
  }
}
initSearchSummary();

function renderFilterDtails(filter: WorkPostFilterInput) {
  const filterDetailArea = document.getElementById(
    "filter-detail-to-subscription"
  ) as HTMLElement;

  const endDate = filterDetailArea.querySelector(".filter-end-date");

  const startDate = filterDetailArea.querySelector(".filter-start-date");
  if (startDate && endDate) {
    if (filter.endDate || filter.startDate) {
      if (!filter.endDate) {
        startDate.textContent = `${filter.startDate} 之後的所有日期`;
      } else if (!filter.startDate) {
        endDate.textContent = `${filter.endDate} 以前的所有日期`;
      } else {
        startDate.textContent = `${filter.startDate}`;
        endDate.textContent = `至 ${filter.endDate} 之間`;
      }
    } else {
      startDate.textContent = ``;
      endDate.textContent = ``;
    }
  }

  const city = filterDetailArea.querySelector(".filter-city");
  if (city && filter.city) {
    if ((filter.endDate || filter.startDate) && filter.applicantCount) {
      city.textContent = `・位於${filter.city}・`;
    } else if (filter.endDate || filter.startDate) {
      city.textContent = `・位於${filter.city}`;
    } else if (filter.applicantCount) {
      city.textContent = `位於${filter.city}・`;
    } else {
      city.textContent = `位於${filter.city}`;
    }
  } else if (city && !filter.city) {
    city.textContent = ``;
  }

  const applicantCount = filterDetailArea.querySelector(
    ".filter-applicant-count"
  );
  if (applicantCount && filter.applicantCount) {
    if (!filter.city && (filter.endDate || filter.startDate)) {
      applicantCount.textContent = `・${filter.applicantCount} 人同行`;
    } else {
      applicantCount.textContent = `${filter.applicantCount} 人同行`;
    }
  } else if (applicantCount && !filter.applicantCount) {
    applicantCount.textContent = ``;
  }

  const averageWorkHours = filterDetailArea.querySelector(
    ".filter-average-work-hours"
  );
  if (averageWorkHours && filter.averageWorkHours) {
    if (filter.minDuration) {
      averageWorkHours.textContent = `每日工作 ${filter.averageWorkHours} 小時・`;
    } else {
      averageWorkHours.textContent = `每日工作 ${filter.averageWorkHours} 小時`;
    }
  } else if (averageWorkHours && !filter.averageWorkHours) {
    averageWorkHours.textContent = ``;
  }

  const minDuration = filterDetailArea.querySelector(".filter-min-duration");
  if (minDuration && filter.minDuration) {
    minDuration.textContent = `接受最短停留 ${filter.minDuration} 天`;
  } else if (minDuration && !filter.minDuration) {
    minDuration.textContent = ``;
  }

  const positionCategories = filterDetailArea.querySelector(
    ".filter-position-categories"
  );
  if (positionCategories && filter.positionCategories) {
    if (filter.positionCategories.length > 0) {
      positionCategories.textContent = `工作類別符合至少一項: ${filter.positionCategories}`;
    } else {
      positionCategories.textContent = ``;
    }
  }

  const accommodations = filterDetailArea.querySelector(
    ".filter-accommodations"
  );
  if (accommodations && filter.accommodations) {
    if (filter.accommodations.length > 0) {
      accommodations.textContent = `住宿選項包含至少一項: ${filter.accommodations}`;
    } else {
      accommodations.textContent = ``;
    }
  }

  const environments = filterDetailArea.querySelector(".filter-environments");
  if (environments && filter.environments) {
    if (filter.environments.length > 0) {
      environments.textContent = `環境選項包含至少一項: ${filter.environments}`;
    } else {
      environments.textContent = ``;
    }
  }
  const experiences = filterDetailArea.querySelector(".filter-experiences");
  if (experiences && filter.experiences) {
    if (filter.experiences.length > 0) {
      experiences.textContent = `體驗選項包含至少一項: ${filter.experiences}`;
    } else {
      experiences.textContent = ``;
    }
  }

  const meals = filterDetailArea.querySelector(".filter-meals");
  if (meals && filter.meals) {
    if (filter.meals.length > 0) {
      meals.textContent = `餐食選項包含至少一項: ${filter.meals}`;
    } else {
      meals.textContent = ``;
    }
  }
}
