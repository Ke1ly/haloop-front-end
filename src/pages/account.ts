import type { WorkPost } from "../types/Work.js";
import { createDialogClickHandler } from "../utils/dialog-utils.js";
import { API_BASE_URL } from "../utils/config.js";
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
  const hostProfileBtn = document.getElementById(
    "host-profile-btn"
  ) as HTMLElement;
  const basicProfileBtn = document.getElementById(
    "basic-profile-btn"
  ) as HTMLElement;
  const hostProfileSection = document.getElementById(
    "host-profile-section"
  ) as HTMLElement;
  const hostBasicSection = document.getElementById(
    "host-basic-section"
  ) as HTMLElement;
  const helperBasicSection = document.getElementById(
    "helper-basic-section"
  ) as HTMLElement;
  [hostProfileBtn, basicProfileBtn].forEach((button) => {
    button.addEventListener("click", () => {
      [hostProfileBtn, basicProfileBtn].forEach((btn) => {
        btn.classList.remove("selected");
      });
      button.classList.add("selected");
    });
  });
  if (userData) {
    console.log("有讀到userData");
    if (userData.user.userType == "HELPER") {
      console.log("有讀到HELPER");
      helperBasicSection.style.display = "flex";
      initBasicHelperProfile();
    } else if (userData.user.userType == "HOST") {
      console.log("有讀到HOST");
      initBasicHostProfile();
      initHostProfile();
      hostProfileBtn.style.display = "block";
      hostBasicSection.style.display = "flex";
      hostProfileBtn.addEventListener("click", () => {
        hostBasicSection.style.display = "none";
        helperBasicSection.style.display = "none";
        hostProfileSection.style.display = "flex";
      });
      basicProfileBtn.addEventListener("click", () => {
        hostBasicSection.style.display = "flex";
        hostProfileSection.style.display = "none";
        helperBasicSection.style.display = "none";
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
  // workpost 圖片預覽
  const fileInput = document.getElementById(
    "host-img-input"
  ) as HTMLInputElement;
  const previewArea = document.getElementById("img-preview") as HTMLElement;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  fileInput.addEventListener("change", function () {
    if (!fileInput.files) return;
    const files = Array.from(fileInput.files);
    previewArea.replaceChildren();
    if (files.length > 0) {
      files.forEach((file) => {
        if (!allowedTypes.includes(file.type)) {
          const errorDialog = document.getElementById(
            "error-dialog"
          ) as HTMLDialogElement;
          const errorMessage = document.querySelector(
            ".error-message"
          ) as HTMLDivElement;
          errorMessage.textContent = "僅支援 JPG、PNG、WEBP 圖片";
          errorDialog.showModal();
          errorDialog.classList.add("show");
          errorDialog.addEventListener(
            "click",
            createDialogClickHandler(errorDialog)
          );
          return;
        }

        if (files.length < 3 || files.length > 8) {
          const errorDialog = document.getElementById(
            "error-dialog"
          ) as HTMLDialogElement;
          const errorMessage = document.querySelector(
            ".error-message"
          ) as HTMLDivElement;
          errorMessage.textContent = "請選擇至少 3 張，至多 8 張照片";
          errorDialog.showModal();
          errorDialog.classList.add("show");
          errorDialog.addEventListener(
            "click",
            createDialogClickHandler(errorDialog)
          );
          fileInput.replaceChildren();
          return;
        } else {
          const reader = new FileReader();
          reader.onload = function (e) {
            if (typeof e.target?.result === "string") {
              const img = document.createElement("img") as HTMLImageElement;
              img.src = e.target.result;
              previewArea.appendChild(img);
            }
          };
          reader.readAsDataURL(file);
        }
      });
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

    //先檢查是否有填完基本資料
    const response = await fetch(`${API_BASE_URL}/api/profile/host`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch work posts");
    const data = await response.json();
    if (
      !(
        data.hostProfile.unitName &&
        data.hostProfile.address &&
        data.hostProfile.city &&
        data.hostProfile.unitDescription &&
        data.user.username &&
        data.user.realname &&
        data.user.email
      )
    ) {
      const errorDialog = document.getElementById(
        "error-dialog"
      ) as HTMLDialogElement;
      const errorMessage = document.querySelector(
        ".error-message"
      ) as HTMLDivElement;
      errorMessage.textContent =
        "請先至「編輯基本資料」填寫完整資料，包含：單位名稱、聯絡電話、地址等";
      errorDialog.showModal();
      errorDialog.classList.add("show");
      errorDialog.addEventListener(
        "click",
        createDialogClickHandler(errorDialog)
      );
      return;
    }

    const imageInput = document.getElementById(
      "host-img-input"
    ) as HTMLInputElement;
    const imageFiles = imageInput.files;
    let startDate = getInputValue("work-start-date");
    let endDate = getInputValue("work-end-date");
    let recruitCount = getSelectNumberValue("recruit-count");
    let positionName = getInputValue("position-name");
    let positionCategories = getSelectedOptionValues(
      ".position-category-option-btn"
    );
    let averageWorkHours = getSelectNumberValue("average-work-hours");
    let minDuration = getSelectNumberValue("min-stay-days");
    let accommodations = getSelectedOptionValues(".accommodation-option-btn");
    if (
      !(
        startDate &&
        endDate &&
        recruitCount &&
        positionName &&
        positionCategories &&
        averageWorkHours &&
        minDuration &&
        accommodations
      )
    ) {
      const errorDialog = document.getElementById(
        "error-dialog"
      ) as HTMLDialogElement;
      const errorMessage = document.querySelector(
        ".error-message"
      ) as HTMLDivElement;
      errorMessage.textContent = "請輸入所有必填資訊";
      errorDialog.showModal();
      errorDialog.classList.add("show");
      errorDialog.addEventListener(
        "click",
        createDialogClickHandler(errorDialog)
      );
      return;
    }

    // 將圖片上傳至 S3
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
async function initBasicHelperProfile() {
  const originalProfileData: Record<string, string> = {};
  //渲染資料，並存入snapshot
  const response = await fetch(`${API_BASE_URL}/api/profile/helper`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch helper profile");
  const data = await response.json();
  if (data.helperProfile && data.user) {
    const fields = [
      { key: "helper-username", value: data.user.username },
      { key: "helper-realname", value: data.user.realname },
      { key: "helper-email-address", value: data.user.email },
      { key: "self-description", value: data.helperProfile.bio },
    ];
    fields.forEach(({ key, value }) => {
      if (value !== undefined) {
        const input = document.getElementById(key) as HTMLInputElement;
        input.value = value;
        originalProfileData[key] = input.value;
      }
    });
  }

  //比對變更資料
  const form = document.getElementById(
    "helper-basic-profile-form"
  ) as HTMLFormElement;
  form.addEventListener("input", checkFormChanges);

  const submitBtn = document.getElementById(
    "save-helper-basic-btn"
  ) as HTMLButtonElement;
  submitBtn.disabled = true;

  function checkFormChanges() {
    const hasChanged = Object.entries(originalProfileData).some(
      ([id, originalValue]) => {
        const input = document.getElementById(id) as HTMLInputElement;
        return input && input.value.trim() !== originalValue;
      }
    );
    submitBtn.disabled = !hasChanged; // 如果有任何一欄變更(hasChanged)，就啟用 submit
  }

  //上傳資料
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const validation = validateHelperProfile();
    if (!validation.isValid) {
      showErrors("helper-basic-response-message", validation.errors);
      return;
    }

    const changedData: Record<string, string> = {};

    Object.entries(originalProfileData).forEach(([id, originalValue]) => {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input && input.value !== originalValue) {
        changedData[id] = input.value.trim();
      }
    });

    if (Object.keys(changedData).length === 0) {
      console.log("沒有欄位變更");
      return;
    }
    // 對應後端資料欄位命名
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(changedData)) {
      switch (key) {
        case "helper-username":
          payload.username = value;
          break;
        case "helper-realname":
          payload.realname = value;
          break;
        case "helper-email-address":
          payload.email = value;
          break;
        case "self-description":
          payload.bio = value;
          break;
        default:
          break;
      }
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/helper`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (import.meta.env.VITE_MODE == "development") {
        console.log("前端送出更改 profile 的資料", payload);
      }

      const data = await response.json();
      if (response.ok && data.success) {
        showResponse("helper-basic-response-message", "帳號資料更改成功！");
        setTimeout(() => {
          const container = document.getElementById(
            "helper-basic-response-message"
          );
          if (container) {
            container.replaceChildren();
          }
          window.location.reload();
        }, 2000);
      } else {
        let errorMessages = [];
        if (data.message) {
          errorMessages = [data.message];
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessages = data.errors;
        } else {
          errorMessages = ["帳號資料更改失敗，請檢查輸入或稍後再試"];
        }

        console.error("帳號資料更改回應錯誤", {
          status: response.status,
          data: data,
        });

        showErrors("helper-basic-response-message", errorMessages);
      }

      if (import.meta.env.VITE_MODE == "development") {
        console.log("前端獲得 profileResponseData", data);
      }
    } catch (err) {
      console.error(err);
      showErrors("helper-basic-response-message", ["伺服器錯誤，請稍後再試"]);
    }
  });
}

async function initBasicHostProfile() {
  const originalProfileData: Record<string, string> = {};

  //渲染資料，並存入snapshot
  const response = await fetch(`${API_BASE_URL}/api/profile/host`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch host profile");
  const data = await response.json();
  console.log("應該要渲染的店家資料", data);
  if (data.hostProfile) {
    const fields = [
      { key: "unit-name", value: data.hostProfile.unitName },
      { key: "unit-address", value: data.hostProfile.address },
      { key: "unit-city", value: data.hostProfile.city },
      { key: "unit-description", value: data.hostProfile.unitDescription },
    ];
    fields.forEach(({ key, value }) => {
      if (value !== undefined) {
        const input = document.getElementById(key) as HTMLInputElement;
        input.value = value;
        originalProfileData[key] = input.value;
      }
    });
  } else {
    const fields = [
      { key: "unit-name", value: "" },
      { key: "unit-address", value: "" },
      { key: "unit-city", value: "" },
      { key: "unit-description", value: "" },
    ];
    fields.forEach(({ key, value }) => {
      if (value !== undefined) {
        const input = document.getElementById(key) as HTMLInputElement;
        input.value = value;
        originalProfileData[key] = input.value;
      }
    });
  }
  if (data.user) {
    const fields = [
      { key: "host-username", value: data.user.username },
      { key: "host-realname", value: data.user.realname },
      { key: "host-email-address", value: data.user.email },
    ];
    fields.forEach(({ key, value }) => {
      if (value !== undefined) {
        const input = document.getElementById(key) as HTMLInputElement;
        input.value = value;
        originalProfileData[key] = input.value;
      }
    });
  }

  //比對變更資料
  const topForm = document.getElementById(
    "host-basic-profile-top-form"
  ) as HTMLFormElement;
  const bottomForm = document.getElementById(
    "host-basic-profile-bottom-form"
  ) as HTMLFormElement;
  [topForm, bottomForm].forEach((form) => {
    form.addEventListener("input", checkFormChanges);
  });

  const submitBtn = document.getElementById(
    "save-host-basic-btn"
  ) as HTMLButtonElement;
  submitBtn.disabled = true;

  function checkFormChanges() {
    const hasChanged = Object.entries(originalProfileData).some(
      ([id, originalValue]) => {
        const input = document.getElementById(id) as HTMLInputElement;
        return input && input.value.trim() !== originalValue;
      }
    );
    submitBtn.disabled = !hasChanged; // 如果有任何一欄變更(hasChanged)，就啟用 submit
  }

  //上傳資料
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const changedData: Record<string, string> = {};

    Object.entries(originalProfileData).forEach(([id, originalValue]) => {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input && input.value !== originalValue) {
        changedData[id] = input.value.trim();
      }
    });

    if (Object.keys(changedData).length === 0) {
      console.log("沒有欄位變更");
      return;
    }

    const validation = validateHostProfile();
    if (!validation.isValid) {
      showErrors("host-basic-response-message", validation.errors);
      return;
    }

    // 對應後端資料欄位命名
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(changedData)) {
      switch (key) {
        case "host-username":
          payload.username = value;
          break;
        case "host-realname":
          payload.realname = value;
          break;
        case "host-email-address":
          payload.email = value;
          break;
        case "unit-name":
          payload.unitName = value;
          break;
        case "unit-address":
          payload.address = value;
          break;
        case "unit-city":
          payload.city = value;
          break;
        case "unit-description":
          payload.unitDescription = value;
          break;
        default:
          break;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/host`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (import.meta.env.VITE_MODE == "development") {
        console.log("前端送出更改 profile 的資料", payload);
      }

      const data = await response.json();
      if (response.ok && data.success) {
        showResponse("host-basic-response-message", "帳號資料更改成功！");
        setTimeout(() => {
          const container = document.getElementById(
            "host-basic-response-message"
          );
          if (container) {
            container.replaceChildren();
          }
          window.location.reload();
        }, 2000);
      } else {
        let errorMessages = [];
        if (data.message) {
          errorMessages = [data.message];
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessages = data.errors;
        } else {
          errorMessages = ["帳號資料更改失敗，請檢查輸入或稍後再試"];
        }

        console.error("帳號資料更改回應錯誤", {
          status: response.status,
          data: data,
        });

        showErrors("host-basic-response-message", errorMessages);
      }

      if (import.meta.env.VITE_MODE == "development") {
        console.log("前端獲得 profileResponseData", data);
      }
    } catch (err) {
      console.error(err);
      showErrors("host-basic-response-message", ["伺服器錯誤，請稍後再試"]);
    }
  });
}
function validateHelperProfile() {
  const errors: string[] = [];

  const email = getInputValue("helper-email-address");
  const username = getInputValue("helper-username");
  // const password = getInputValue("host-password");
  const realname = getInputValue("helper-realname");
  const bio = getInputValue("self-description");

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("請輸入有效的電子郵件");
  }
  if (
    !username ||
    username.length < 3 ||
    username.length > 20 ||
    !username.match(/^[a-zA-Z0-9_]+$/)
  ) {
    errors.push("用戶名稱必須為 3-20 個字符，只能包含字母、數字和下底線");
  }
  if (
    !realname ||
    realname.length < 2 ||
    realname.length > 15 ||
    /[\d!@#$%^&*(),.?":{}|<>]/.test(realname)
  ) {
    console.log("realname", realname);
    errors.push("真實姓名長度必須在 2-15 字之間，不應包含數字或特殊符號");
  }
  if (!bio || bio.length < 20) errors.push("自我介紹為必填，且至少 20 字");

  console.log("errors 內容物", errors);
  return { isValid: errors.length === 0, errors };
}

function validateHostProfile() {
  const errors: string[] = [];

  const email = getInputValue("host-email-address");
  const username = getInputValue("host-username");
  // const password = getInputValue("host-password");
  const realname = getInputValue("host-realname");

  const unitName = getInputValue("unit-name");
  const address = getInputValue("unit-address");
  let city = getSelectedCity();
  const unitDescription = getInputValue("unit-description");

  console.log("city", city);

  if (!unitName) errors.push("單位名稱為必填");
  if (!address) errors.push("地址為必填");
  if (!city) errors.push("縣市為必填，且必須符合清單選項");
  if (!unitDescription) errors.push("單位介紹為必填");

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("請輸入有效的電子郵件");
  }
  if (
    !username ||
    username.length < 3 ||
    username.length > 20 ||
    !username.match(/^[a-zA-Z0-9_]+$/)
  ) {
    errors.push("用戶名稱必須為 3-20 個字符，只能包含字母、數字和下底線");
  }
  // if (
  //   !password ||
  //   password.length < 6 ||
  //   !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  // ) {
  //   errors.push(
  //     "密碼至少需要 6 個字符，必須包含至少一個大寫字母、一個小寫字母和一個數字"
  //   );
  // }
  if (
    !realname ||
    realname.length < 2 ||
    realname.length > 15 ||
    /[\d!@#$%^&*(),.?":{}|<>]/.test(realname)
  ) {
    console.log("realname", realname);
    errors.push("真實姓名長度必須在 2-15 字之間，不應包含數字或特殊符號");
  }

  console.log("errors 內容物", errors);
  return { isValid: errors.length === 0, errors };
}

function getInputValue(id: string) {
  const element = document.getElementById(id);
  if (element) {
    let e = element as HTMLInputElement;
    return e.value.trim();
  } else {
    return "";
  }
}

function getSelectedCity(): string | undefined {
  const cityInput = document.getElementById("unit-city") as HTMLInputElement;
  const cityDataList = document.getElementById(
    "city-list"
  ) as HTMLDataListElement;

  const inputValue = cityInput.value;
  console.log("inputValue", inputValue);
  const options = cityDataList.options;
  console.log("options", options);
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === inputValue) {
      return inputValue;
    }
  }
  return undefined;
}

function showErrors(containerId: string, errors: string[]) {
  const container = document.getElementById(containerId);
  if (container) {
    container.replaceChildren();
    if (errors.length > 0) {
      errors.forEach((error) => {
        const p = document.createElement("p");
        p.style.color = "rgb(200, 70, 40)";
        p.style.fontSize = "11px";
        p.style.marginBottom = "5px";
        p.textContent = error;
        container.appendChild(p);
      });
    }
  }
}

function showResponse(containerId: string, response: string) {
  const container = document.getElementById(containerId);
  if (container) {
    container.replaceChildren();
    const p = document.createElement("p");
    p.style.color = "rgb(120, 180, 130)";
    p.style.fontSize = "11px";
    p.style.marginBottom = "5px";
    p.textContent = response;
    container.appendChild(p);
  }
}
