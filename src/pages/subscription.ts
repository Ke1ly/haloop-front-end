//如果不是 helper 不准他進入
//渲染訂閱條件
//點擊訂閱條件，右側跳出訂閱條件的詳細內容，與符合條件的貼文

// import { title } from "process";
import { API_BASE_URL } from "../utils/config.js";
interface Subscription {
  id: string;
  name: string;
  filters: Filters;
}

interface Filters {
  city?: string;
  startDate?: string;
  endDate?: string;
  applicantCount?: number;
  averageWorkHours?: number;
  minDuration?: number;
  positionCategories?: string[];
  accommodations?: string[];
  meals?: string[];
  experiences?: string[];
  environments?: string[];
}
let subscriptionsData: Subscription[] | null = null;

async function getSubscriptions() {
  let response = await fetch(`${API_BASE_URL}/api/subscription`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch subscriptions");
  let data = await response.json();
  subscriptionsData = data.subscriptions;
}
function renderSubscriptionsName(subscriptionsData: Subscription[]) {
  const nav = document.querySelector("nav");
  const filterDetails = document.getElementById("filter-details");
  if (subscriptionsData && subscriptionsData.length > 0) {
    if (filterDetails) {
      filterDetails.replaceChildren();
    }
    console.log("subscriptionsData", subscriptionsData);
    subscriptionsData.forEach((subscriptionData) => {
      let div = document.createElement("div");
      div.textContent = subscriptionData.name;
      div.dataset.subscriptionId = subscriptionData.id;
      div.addEventListener("click", () => {
        console.log("點擊filterName，subscriptionData.id", subscriptionData.id);
        renderSubscriptionDetails(subscriptionData.id);
      });
      if (nav) {
        nav.appendChild(div);
      }
    });
  } else {
    let div1 = document.createElement("div");
    let div2 = document.createElement("div");
    div1.textContent = "目前還沒有任何訂閱項目。";
    div2.textContent =
      "開始訂閱，請前往 [探索頁面] 設定篩選條件，然後點選訂閱按鈕。";
    if (filterDetails) {
      filterDetails.style.display = "block";
      filterDetails.appendChild(div1);
      filterDetails.appendChild(div2);
    }
  }
}

async function renderSubscriptionDetails(subscriptionId: string) {
  const detailsContainer = document.getElementById("filter-details");

  if (!subscriptionsData) {
    if (detailsContainer) {
      detailsContainer.replaceChildren();
    }
    return;
  }

  const subscription = subscriptionsData.find(
    (sub) => sub.id === subscriptionId
  );
  if (!subscription) {
    console.error("找不到對應的訂閱資料");
    if (detailsContainer) {
      detailsContainer.replaceChildren();
    }
    return;
  } else {
    console.log("成功找到對應subscription", subscription);
  }
  if (detailsContainer) {
    detailsContainer.style.display = "block";
    // 清空現有內容
    // detailsContainer.replaceChildren();
    const filter = subscription.filters;
    console.log("取filter", filter);
    console.log("filter.endDate", filter.endDate);
    console.log(" filter.city", filter.city);
    console.log("filter.positionCategories", filter.positionCategories);
    console.log("filter.applicantCount", filter.applicantCount);
    // 創建並顯示 filters 詳情

    const endDate = document.querySelector(".filter-end-date");
    const startDate = document.querySelector(".filter-start-date");
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

    const city = document.querySelector(".filter-city");
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

    const applicantCount = document.querySelector(".filter-applicant-count");
    if (applicantCount && filter.applicantCount) {
      if (!filter.city && (filter.endDate || filter.startDate)) {
        applicantCount.textContent = `・${filter.applicantCount} 人同行`;
      } else {
        applicantCount.textContent = `${filter.applicantCount} 人同行`;
      }
    } else if (applicantCount && !filter.applicantCount) {
      applicantCount.textContent = ``;
    }

    const averageWorkHours = document.querySelector(
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

    const minDuration = document.querySelector(".filter-min-duration");
    if (minDuration && filter.minDuration) {
      minDuration.textContent = `接受最短停留 ${filter.minDuration} 天`;
    } else if (minDuration && !filter.minDuration) {
      minDuration.textContent = ``;
    }

    const positionCategories = document.querySelector(
      ".filter-position-categories"
    );
    if (positionCategories && filter.positionCategories) {
      if (filter.positionCategories.length > 0) {
        positionCategories.textContent = `工作類別符合至少一項: ${filter.positionCategories}`;
      } else {
        positionCategories.textContent = ``;
      }
    }

    const accommodations = document.querySelector(".filter-accommodations");
    if (accommodations && filter.accommodations) {
      if (filter.accommodations.length > 0) {
        accommodations.textContent = `住宿選項包含至少一項: ${filter.accommodations}`;
      } else {
        accommodations.textContent = ``;
      }
    }

    const environments = document.querySelector(".filter-environments");
    if (environments && filter.environments) {
      if (filter.environments.length > 0) {
        environments.textContent = `環境選項包含至少一項: ${filter.environments}`;
      } else {
        environments.textContent = ``;
      }
    }
    const experiences = document.querySelector(".filter-experiences");
    if (experiences && filter.experiences) {
      if (filter.experiences.length > 0) {
        experiences.textContent = `體驗選項包含至少一項: ${filter.experiences}`;
      } else {
        experiences.textContent = ``;
      }
    }

    const meals = document.querySelector(".filter-meals");
    if (meals && filter.meals) {
      if (filter.meals.length > 0) {
        meals.textContent = `餐食選項包含至少一項: ${filter.meals}`;
      } else {
        meals.textContent = ``;
      }
    }
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/subscription/${subscriptionId}/matched-posts`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!response.ok) throw new Error("無法取得匹配貼文");
    const data = await response.json();
    const matchedPosts = data.matchedPosts;
    console.log("matchedPosts", matchedPosts);

    // 渲染貼文列表
    const postsList = document.getElementById("matched-posts-list");

    if (postsList) {
      postsList.replaceChildren();
      if (matchedPosts.length === 0) {
        postsList.textContent = "目前無符合的貼文";
      } else {
        matchedPosts.forEach((postData: any) => {
          const matchedPostTemplate = document.getElementById(
            "matched-post-template"
          ) as HTMLTemplateElement;
          const matchedPostTemplateClone =
            matchedPostTemplate.content.cloneNode(true) as DocumentFragment;
          const postSection = matchedPostTemplateClone.querySelector(
            ".matched-post"
          ) as HTMLElement;
          postSection.dataset.unitId = postData.unit.id;

          const postA = matchedPostTemplateClone.querySelector(
            "a"
          ) as HTMLAnchorElement;
          postA.href = `/workpost/${postData.id}`;
          postA.target = "_blank";

          const positionName = matchedPostTemplateClone.querySelector(
            ".position-name"
          ) as HTMLElement;
          if (positionName) {
            positionName.textContent = postData.positionName;
          } else {
            console.warn("Missing .position-name element in template");
          }

          const unitName = matchedPostTemplateClone.querySelector(
            ".unit-name"
          ) as HTMLElement;
          if (unitName) {
            unitName.textContent = `@ ${postData.unit.unitName!}`;
          } else {
            console.warn("Missing .unit-name element in template");
          }

          const avgWorkHours = matchedPostTemplateClone.querySelector(
            ".avg-work-hours"
          ) as HTMLElement;
          if (avgWorkHours) {
            avgWorkHours.textContent = `平均每日工時 ${postData.averageWorkHours} 小時｜`;
          } else {
            console.warn("Missing .avg-work-hours element in template");
          }

          const minDuration = matchedPostTemplateClone.querySelector(
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
            console.warn("Missing .min-stay-days element in template");
          }

          const positionCategories = matchedPostTemplateClone.querySelector(
            ".position-categories"
          ) as HTMLElement;
          if (positionCategories && postData.positionCategories.length > 0) {
            let title = document.createElement("h5");
            title.textContent = "工作類型：";
            positionCategories.appendChild(title);
            postData.positionCategories.forEach(
              (positionCategoryOption: { name: string }) => {
                let divTag = document.createElement("div");
                divTag.textContent = positionCategoryOption.name;
                positionCategories.appendChild(divTag);
              }
            );
          }

          const accommodations = matchedPostTemplateClone.querySelector(
            ".accommodations"
          ) as HTMLElement;
          if (accommodations && postData.accommodations.length > 0) {
            let title = document.createElement("h5");
            title.textContent = "住宿類型：";
            accommodations.appendChild(title);
            postData.accommodations.forEach(
              (accommodationsOption: { name: string }) => {
                let divTag = document.createElement("div");
                divTag.textContent = accommodationsOption.name;
                accommodations.appendChild(divTag);
              }
            );
          }

          const experiences = matchedPostTemplateClone.querySelector(
            ".experiences"
          ) as HTMLElement;
          if (experiences && postData.experiences.length > 0) {
            let title = document.createElement("h5");
            title.textContent = "體驗類型：";
            experiences.appendChild(title);
            postData.experiences.forEach(
              (experiencesOption: { name: string }) => {
                let divTag = document.createElement("div");
                divTag.textContent = experiencesOption.name;
                experiences.appendChild(divTag);
              }
            );
          }

          const environments = matchedPostTemplateClone.querySelector(
            ".environments"
          ) as HTMLElement;
          if (environments && postData.environments.length > 0) {
            let title = document.createElement("h5");
            title.textContent = "環境類型：";
            environments.appendChild(title);
            postData.environments.forEach(
              (environmentsOption: { name: string }) => {
                let divTag = document.createElement("div");
                divTag.textContent = environmentsOption.name;
                environments.appendChild(divTag);
              }
            );
          }

          const meals = matchedPostTemplateClone.querySelector(
            ".meals"
          ) as HTMLElement;
          if (meals && postData.meals.length > 0) {
            let title = document.createElement("h5");
            title.textContent = "餐食類型：";
            meals.appendChild(title);
            postData.meals.forEach((mealsOption: { name: string }) => {
              let divTag = document.createElement("div");
              divTag.textContent = mealsOption.name;
              meals.appendChild(divTag);
            });
          }

          const imagesDiv = matchedPostTemplateClone.querySelector(
            ".matched-post-image"
          ) as HTMLElement;
          if (imagesDiv && postData.images.length > 0) {
            let imgTag = document.createElement("img");
            imgTag.src = postData.images[0].imageUrl;
            imagesDiv.appendChild(imgTag);
          } else {
            console.warn("Missing .work-post-images element in template");
          }

          postsList.appendChild(matchedPostTemplateClone);
        });
      }
    }
  } catch (error) {
    console.error("取得匹配貼文失敗", error);
    const postsList = document.getElementById("matched-posts-list");
    if (postsList) postsList.textContent = "目前無符合的貼文";
  }
}

async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!res.ok) {
    if (import.meta.env.VITE_MODE == "development") {
      console.error("Response not OK:", res.status);
    }
    return null;
  }
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

async function initSubscription() {
  try {
    const userData = await getCurrentUser();
    if (userData) {
      await getSubscriptions();
      if (subscriptionsData) {
        renderSubscriptionsName(subscriptionsData);
      }
    } else {
      location.replace("/");
    }
  } catch (error) {
    console.error("初始化失敗", error);
  }
}
initSubscription();
