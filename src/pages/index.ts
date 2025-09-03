import type { WorkPostForCardRender } from "../types/Work";
import { API_BASE_URL } from "../utils/config.js";

// 取得並渲染推薦貼文
async function getRecommWorkPosts(): Promise<WorkPostForCardRender[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/subscription/recommendations`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch work posts");
  const data = await response.json();
  if (import.meta.env.VITE_MODE == "development") {
    console.log("推薦貼文資料", data);
  }
  return data.formattedWorkPosts;
}

async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  let data = await res.json();
  if (data.success) {
    return data.user;
  } else {
    return null;
  }
}

function renderRecommWorkPosts(recommendationData: WorkPostForCardRender[]) {
  const recommendationSection = document.getElementById(
    "recommendation-posts"
  )!;
  recommendationSection.replaceChildren();

  recommendationData.forEach((postData) => {
    const recommendationTemplate = document.getElementById(
      "recommendation-work-template"
    ) as HTMLTemplateElement;
    const recommendation = recommendationTemplate.content.cloneNode(
      true
    ) as DocumentFragment;

    const A = recommendation.querySelector("a") as HTMLAnchorElement;
    A.href = `/workpost.html?id=${postData.id}`;
    A.target = "_blank";

    const positionName = recommendation.querySelector(".position-name");
    if (positionName) {
      positionName.textContent = postData.positionName;
    } else {
      console.warn("Missing .position-name element in template");
    }

    const city = recommendation.querySelector(".unit-city");
    if (city) {
      city.textContent = `位於${postData.unit.city}`;
    } else {
      console.warn("Missing .unit-city element in template");
    }

    const unitName = recommendation.querySelector(".unit-name");
    if (unitName) {
      unitName.textContent = postData.unit.unitName;
    } else {
      console.warn("Missing .unit-name element in template");
    }

    const avgWorkHours = recommendation.querySelector(".avg-work-hours");
    if (avgWorkHours) {
      avgWorkHours.textContent = `${postData.averageWorkHours}`;
    } else {
      console.warn("Missing .avg-work-hours element in template");
    }

    const minDuration = recommendation.querySelector(".min-stay-days");
    if (minDuration) {
      if (postData.minDuration == 0) {
        minDuration.textContent = "無限制";
      } else if (postData.minDuration == 7) {
        minDuration.textContent = "一週";
      } else if (postData.minDuration == 14) {
        minDuration.textContent = "兩週";
      } else if (postData.minDuration == 21) {
        minDuration.textContent = "三週";
      } else if (postData.minDuration == 28 || 30) {
        minDuration.textContent = "一個月";
      } else if (postData.minDuration == 60) {
        minDuration.textContent = "兩個月";
      } else if (postData.minDuration == 90) {
        minDuration.textContent = "兩個月以上";
      }
    } else {
      console.warn("Missing .min-stay-days element in template");
    }

    const imagesDiv = recommendation.querySelector(".images-container");
    if (imagesDiv) {
      postData.images.forEach((image: string) => {
        let imgTag = document.createElement("img");
        imgTag.src = image;
        imagesDiv.appendChild(imgTag);
      });
    } else {
      console.warn("Missing .work-post-images element in template");
    }

    recommendationSection.appendChild(recommendation);
  });
}
async function initRecommendationSection() {
  const token = localStorage.getItem("token");
  if (token && token != "undefined") {
    let userData = await getCurrentUser();
    if (userData.userType == "HELPER") {
      initRecommendation();

      const helperName = document.querySelector(
        ".helper-name"
      ) as HTMLParagraphElement;
      helperName.textContent = `Hello, ${userData.username}!`;
    }
  } else {
    //放熱門貼文
  }
}
initRecommendationSection();

async function initRecommendation() {
  const recommendationData = await getRecommWorkPosts();
  if (recommendationData && recommendationData.length > 0) {
    renderRecommWorkPosts(recommendationData);
    const greetingDiv = document.getElementById("greetings") as HTMLDivElement;
    greetingDiv.style.display = "block";
  } else {
    console.log("目前沒有更新的貼文可推薦");
  }
}

// 按鈕導向至探索頁面
const toWorkPostBtn = document.getElementById("to-work-post-btn");
toWorkPostBtn?.addEventListener("click", () => {
  location.replace("/works.html");
});

// NavBar 滾動樣式變化
const header = document.querySelector("header")!;
function updateStickyElementColor() {
  const scrollPosition =
    window.pageYOffset || document.documentElement.scrollTop;

  if (scrollPosition >= 40) {
    header.style.boxShadow = "0px 3px 3px rgba(0, 0, 0, 0.05)";
  } else {
    header.style.boxShadow = "none";
  }
}
window.addEventListener("scroll", updateStickyElementColor);

const container = document.getElementById(
  "recommendation-posts"
) as HTMLElement;
let scrollSpeed = 30; // 每幀滾動像素數，調整速度
let animationFrame: any;

function autoScroll() {
  container.scrollLeft += scrollSpeed; // 每次向右滾動指定像素

  // 如果滾動到末尾，重置到開頭（無縫滾動）
  if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
    container.scrollLeft = 0;
  }

  animationFrame = requestAnimationFrame(autoScroll); // 持續執行動畫
}

// 啟動滾動
autoScroll();

// 可選：滑鼠懸停時暫停滾動
container.addEventListener("mouseenter", () => {
  cancelAnimationFrame(animationFrame);
});
container.addEventListener("mouseleave", () => {
  autoScroll();
});
