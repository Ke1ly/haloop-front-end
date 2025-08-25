import { API_BASE_URL } from "../utils/config.js";

type RegisterFormData =
  | {
      email: string;
      username: string;
      password: string;
      realname: string;
      userType: "HOST";
      unitName: string;
      address: string;
      city: string;
      unitDescription: string;
    }
  | {
      email: string;
      username: string;
      password: string;
      realname: string;
      userType: "HELPER";
      bio: string;
    };

let selectedIdentity = "";

//上下頁按鈕切換
function initPagesSwitching() {
  const page1NextPage = document.querySelector(".page-1-next-page");
  const page2NextPage = document.querySelector(".page-2-next-page");
  const page2PrevPage = document.querySelector(".page-2-prev-page");
  const page3PrevPage = document.querySelector(".page-3-prev-page");

  const page1Content = document.getElementById("identity-selection");
  const page2Content = document.getElementById("basic-form-container");
  const page3Content = document.getElementById("profile-form-container");

  const indicator1 = document.getElementById("indicator-step01");
  const indicator2 = document.getElementById("indicator-step02");
  const indicator3 = document.getElementById("indicator-step03");

  if (
    page1NextPage &&
    page3PrevPage &&
    page2NextPage &&
    page2PrevPage &&
    page2Content &&
    page3Content &&
    page1Content &&
    indicator1 &&
    indicator2 &&
    indicator3
  ) {
    //點選第 1 頁下一頁，紀錄 selectedIdentity
    page1NextPage.addEventListener("click", () => {
      if (!selectedIdentity) {
        showErrors("page-1-response-message", ["請選擇身份"]);
        return;
      }
      page1Content.style.display = "none";
      page2Content.style.display = "flex";
      indicator2.classList.add("current-step");
      indicator1.classList.remove("current-step");
    });
    //點選第 2 頁下一頁，驗證輸入內容
    //若沒過，跳訊息，過了，到第 3 頁
    page2NextPage.addEventListener("click", () => {
      const page2Validation = validatePage2();
      if (!page2Validation.isValid) {
        showErrors("page-2-response-message", page2Validation.errors);
        return;
      }
      page2Content.style.display = "none";
      page3Content.style.display = "flex";
      indicator3.classList.add("current-step");
      indicator2.classList.remove("current-step");
    });
    //點選第 2 頁上一頁，沒事發生
    page2PrevPage.addEventListener("click", () => {
      const container = document.getElementById("page-1-response-message");
      if (container) {
        container.replaceChildren();
      }
      page2Content.style.display = "none";
      page1Content.style.display = "flex";
      indicator1.classList.add("current-step");
      indicator2.classList.remove("current-step");
    });
    //點選第 3 頁上一頁，沒事發生
    page3PrevPage.addEventListener("click", () => {
      const container = document.getElementById("page-2-response-message");
      if (container) {
        container.replaceChildren();
      }
      page3Content.style.display = "none";
      page2Content.style.display = "flex";
      indicator2.classList.add("current-step");
      indicator3.classList.remove("current-step");
    });
  }

  const submitBtn = document.querySelector(".sign-up-submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      submitRegistration(selectedIdentity);
    });
  }
}

function initSignup() {
  initRoleSelection();
  initPagesSwitching();
}

initSignup();

// //====================================================================//
// 初始化角色按鈕與身份選擇
function initRoleSelection() {
  const signUpRoleButtons = document.querySelectorAll(
    ".sign-up-role"
  ) as NodeListOf<HTMLElement>;
  signUpRoleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 角色按鈕樣式切換
      signUpRoleButtons.forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");

      // 儲存身份
      selectedIdentity = button.dataset.identity || "";

      // 動態渲染頁3
      renderPage3Fields(selectedIdentity);
    });
  });
}
function renderPage3Fields(identity: string) {
  const hostProfileForm = document.getElementById("host-profile-form");
  const helperProfileForm = document.getElementById("helper-profile-form");
  if (hostProfileForm && helperProfileForm) {
    if (identity === "HOST") {
      hostProfileForm.style.display = "flex";
      helperProfileForm.style.display = "none";
    } else if (identity === "HELPER") {
      helperProfileForm.style.display = "flex";
      hostProfileForm.style.display = "none";
    }
  }
}

//==============================================================
//檢查第 2 頁輸入內容
function validatePage2() {
  const errors: string[] = [];

  const email = getInputValue("sign-up-email");
  const username = getInputValue("sign-up-username");
  const password = getInputValue("sign-up-password");
  const realname = getInputValue("sign-up-realname");

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
    !password ||
    password.length < 6 ||
    !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  ) {
    errors.push(
      "密碼至少需要 6 個字符，必須包含至少一個大寫字母、一個小寫字母和一個數字"
    );
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

  console.log("errors內容物", errors);
  return { isValid: errors.length === 0, errors };
}

//==============================================================
//檢查第 3 頁輸入內容 --> 送出註冊 API --> 渲染成功或失敗訊息
async function submitRegistration(identity: string) {
  const page3Validation = validatePage3(identity);
  if (!page3Validation.isValid) {
    showErrors("page-3-response-message", page3Validation.errors);
    return;
  }

  const formData = getFormValues(identity);
  console.log("即將送去註冊的data", formData);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (response.ok && data.success) {
      showResponse("page-3-response-message", "註冊成功！請登入開始使用");
      setTimeout(() => {
        // 重置
        window.location.assign("./index");
      }, 2000);
    } else {
      let errorMessages = [];
      if (data.message) {
        errorMessages = [data.message];
      } else if (data.errors && Array.isArray(data.errors)) {
        errorMessages = data.errors;
      } else {
        errorMessages = ["註冊失敗，請檢查輸入或稍後再試"];
      }

      console.error("註冊回應錯誤", {
        status: response.status,
        data: data,
      });

      showErrors("page-3-response-message", errorMessages);
    }
  } catch (error) {
    console.log(error);
    showErrors("page-3-response-message", ["伺服器錯誤，請稍後再試"]);
  }
}

function validatePage3(identity: string) {
  const errors = [];
  if (identity === "HOST") {
    const unitName = getInputValue("host-profile-unit-name");
    const address = getInputValue("host-profile-unit-address");
    // const city = getInputValue("host-profile-unit-city");
    let city = getSelectedCity();
    const unitDescription = getInputValue("host-profile-unit-description");

    if (!unitName) errors.push("單位名稱為必填");
    if (!address) errors.push("地址為必填");
    if (!city) errors.push("縣市為必填，且必須符合清單選項");
    if (!unitDescription) errors.push("單位介紹為必填");
  } else if (identity === "HELPER") {
    const bio = getInputValue("helper-profile-bio");
    if (!bio || bio.length < 20) errors.push("自我介紹為必填，且至少 20 字");
  }

  return { isValid: errors.length === 0, errors };
}

function getFormValues(identity: string): RegisterFormData {
  const baseValues = {
    email: getInputValue("sign-up-email"),
    username: getInputValue("sign-up-username"),
    password: getInputValue("sign-up-password"),
    realname: getInputValue("sign-up-realname"),
    userType: identity,
  };

  if (identity === "HOST") {
    const city = getSelectedCity();
    return {
      ...baseValues,
      unitName: getInputValue("host-profile-unit-name"),
      address: getInputValue("host-profile-unit-address"),
      city: city!,
      unitDescription: getInputValue("host-profile-unit-description"),
      userType: "HOST" as const,
    };
  } else {
    return {
      ...baseValues,
      bio: getInputValue("helper-profile-bio"),
      userType: "HELPER" as const,
    };
  }
}

function getSelectedCity(): string | undefined {
  const cityInput = document.getElementById(
    "host-profile-unit-city"
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

//==============================================================
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

function getInputValue(id: string) {
  const element = document.getElementById(id);
  if (element) {
    let e = element as HTMLInputElement;
    return e.value.trim();
  } else {
    return "";
  }
}
