import type { WorkPost } from "../types/Work.js";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";
console.log("Current Mode:", import.meta.env.VITE_API_URL);

//用 token 取得當前使用者資訊
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

// 根據角色渲染 profile
async function initProfileByRole() {
  const userData = await getCurrentUser();
  const helperProfileBtn = document.getElementById(
    "helper-profile-btn"
  ) as HTMLElement;
  const hostProfileBtn = document.getElementById(
    "host-profile-btn"
  ) as HTMLElement;
  const userProfileBtn = document.getElementById(
    "user-profile-btn"
  ) as HTMLElement;
  const helperProfileSection = document.getElementById(
    "helper-profile-section"
  ) as HTMLElement;
  const hostProfileSection = document.getElementById(
    "host-profile-section"
  ) as HTMLElement;
  const userProfileSection = document.getElementById(
    "user-profile-section"
  ) as HTMLElement;
  [helperProfileBtn, hostProfileBtn, userProfileBtn].forEach((button) => {
    button.addEventListener("click", () => {
      [helperProfileBtn, hostProfileBtn, userProfileBtn].forEach((btn) => {
        btn.classList.remove("selected");
      });
      button.classList.add("selected");
    });
  });
  if (userData) {
    // initUserProfile(userData);
    userProfileBtn.addEventListener("click", () => {
      userProfileSection.style.display = "flex";
      hostProfileSection.style.display = "none";
      helperProfileSection.style.display = "none";
    });
    if (userData.user.userType == "HELPER") {
      helperProfileBtn.style.display = "block";
      hostProfileBtn.style.display = "none";
      helperProfileBtn.addEventListener("click", () => {
        userProfileSection.style.display = "none";
        hostProfileSection.style.display = "none";
        helperProfileSection.style.display = "block";
      });
    } else if (userData.user.userType == "HOST") {
      initUserProfile(userData);
      initHostProfile();
      hostProfileBtn.style.display = "block";
      helperProfileBtn.style.display = "none";
      hostProfileBtn.addEventListener("click", () => {
        userProfileSection.style.display = "none";
        hostProfileSection.style.display = "flex";
        helperProfileSection.style.display = "none";
      });
    } else {
      location.replace("/");
    }
  } else {
    location.replace("/");
  }
}
initProfileByRole();

function initHostProfile() {
  // workpost 多選按鈕樣式
  document
    .querySelectorAll<HTMLButtonElement>(".toggle-option")
    .forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("selected");
      });
    });

  // workpost 驗證時間先後
  const endInput = document.getElementById("work-end-date") as HTMLInputElement;
  endInput.addEventListener("change", () => {
    const startDate = document.getElementById(
      "work-start-date"
    ) as HTMLInputElement;
    const start = new Date(startDate.value);
    const end = new Date(endInput.value);
    if (end <= start) {
      alert("結束時間必須大於起始時間！");
    }
  });

  // workpost 取值函式
  function getInputValue(id: string): string {
    const el = document.getElementById(id) as HTMLInputElement | null;
    return el?.value.trim() || "";
  }

  // workpost 取值函式
  function getTextareaValue(id: string): string {
    const el = document.getElementById(id) as HTMLTextAreaElement | null;
    return el?.value.trim() || "";
  }

  // workpost 取值函式
  function getSelectNumberValue(id: string): number {
    const el = document.getElementById(id);
    if (el && el instanceof HTMLSelectElement) {
      const value = el.value;
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        return num;
      }
    }
    return 0;
  }

  // workpost 取值函式
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

  // 點擊按鈕，上傳貼文
  const postWorkBtn = document.getElementById(
    "post-work-btn"
  ) as HTMLButtonElement;
  postWorkBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const imageInput = document.getElementById(
      "host-img-file"
    ) as HTMLInputElement;

    // 將圖片上傳至 S3
    const imageFiles = imageInput.files;
    const imageUrls: string[] = [];
    if (imageFiles && imageFiles.length > 0) {
      const uploadData = new FormData();
      Array.from(imageFiles).forEach((imageFile) => {
        uploadData.append("images", imageFile);
      });
      if (import.meta.env.VITE_MODE == "development") {
        console.log("前端準備上傳的img檔案", uploadData.getAll("images"));
      }

      const uploadResponse = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        body: uploadData,
      });
      const { urls } = await uploadResponse.json();
      imageUrls.push(...urls);
      if (import.meta.env.VITE_MODE == "development") {
        console.log("前端收到 imageUrls string list", imageUrls);
      }
    }

    // 整理 WorkPost 資料
    let postData: WorkPost = {
      startDate: getInputValue("work-start-date"),
      endDate: getInputValue("work-end-date"),
      recruitCount: getSelectNumberValue("recruit-count"),
      images: imageUrls,
      positionName: getInputValue("position-name"),
      positionCategories: getSelectedOptionValues(
        ".position-category-option-btn"
      ),
      averageWorkHours: getSelectNumberValue("average-work-hours"),
      minDuration: getSelectNumberValue("min-stay-days"),
      requirements: getSelectedOptionValues(".required-option-btn"),
      positionDescription: getTextareaValue("position-description"),
      accommodations: getSelectedOptionValues(".accommodation-option-btn"),
      meals: getSelectedOptionValues(".meal-option-btn"),
      experiences: getSelectedOptionValues(".experience-option-btn"),
      environments: getSelectedOptionValues(".environment-option-btn"),
      benefitsDescription: getTextareaValue("benefits-description"),
    };
    if (import.meta.env.VITE_MODE == "development") {
      console.log("前端準備上傳的 postData", postData);
    }

    // 將 WorkPost 資料存至資料庫
    let WorkPostResponse = await fetch(`${API_BASE_URL}/api/works`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(postData),
    });
    const WorkPostResponseData: WorkPost = await WorkPostResponse.json();
    if (import.meta.env.VITE_MODE == "development") {
      console.log("前端收到 WorkPost 上傳 response", WorkPostResponseData);
    }
  });
}

async function initUserProfile(userData: any) {
  //渲染基本資料
  const username = document.getElementById("username") as HTMLInputElement;
  const realname = document.getElementById("realname") as HTMLInputElement;
  const email = document.getElementById("email-address") as HTMLInputElement;
  username.value = userData.user.username;
  realname.value = userData.user.realname;
  email.value = userData.user.email;
  const response = await fetch(`${API_BASE_URL}/api/profile/host`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch work posts");
  const data = await response.json();
  if (data.profileData) {
    const unitName = document.getElementById("unit-name") as HTMLInputElement;
    unitName.value = data.profileData.unitName;
    const unitAddress = document.getElementById(
      "unit-address"
    ) as HTMLInputElement;
    unitAddress.value = data.profileData.address;
    const city = document.getElementById("unit-city") as HTMLInputElement;
    city.value = data.profileData.city;
    const unitDescription = document.getElementById(
      "unit-description"
    ) as HTMLInputElement;
    unitDescription.value = data.profileData.unitDescription;
  }

  //上傳附加資料
  const submitBtn = document.getElementById("save-userform-data-btn")!;
  submitBtn.addEventListener("click", async () => {
    const unitName = document.getElementById("unit-name") as HTMLInputElement;
    const unitAddress = document.getElementById(
      "unit-address"
    ) as HTMLInputElement;
    //取值城市 datalist
    function getSelectedCity(): string | undefined {
      const cityInput = document.getElementById(
        "unit-city"
      ) as HTMLInputElement;
      const cityDataList = document.getElementById(
        "city-list"
      ) as HTMLDataListElement;

      const inputValue = cityInput.value;
      const options = cityDataList.options;

      for (let i = 0; i < options.length; i++) {
        if (options[i].value === inputValue) {
          return inputValue;
        }
      }
      return undefined;
    }
    const unitDescription = document.getElementById(
      "unit-description"
    ) as HTMLInputElement;

    let data = {
      unitName: unitName.value,
      address: unitAddress.value,
      unitDescription: unitDescription.value,
      city: getSelectedCity(),
    };
    if (import.meta.env.VITE_MODE == "development") {
      console.log("前端送出Data", data);
    }
    const profileResponse = await fetch(`${API_BASE_URL}/api/profile/host`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });
    const profileResponseData = await profileResponse.json();
    if (import.meta.env.VITE_MODE == "development") {
      console.log("前端獲得 profileResponseData", profileResponseData);
    }
  });
}
