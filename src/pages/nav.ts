import { createDialogClickHandler } from "../utils/dialog-utils.js";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";
if (import.meta.env.VITE_MODE == "development") {
  console.log("Current API URL:", import.meta.env.VITE_API_URL);
  console.log("Current Mode:", import.meta.env.VITE_MODE);
}
initApp();

async function initApp() {
  let token = localStorage.getItem("token");
  if (import.meta.env.VITE_MODE == "development") {
    console.log("token:", token);
  }
  if (!token || token == "undefined") {
    renderMenu(null);
    initAuthUI();
  } else {
    const userData = await getCurrentUser();
    if (userData) {
      renderMenu(userData.user.userType);
      loginUI();
      if (userData.user.userType == "HELPER") {
        sse(userData.user.id);
      }
    } else {
      renderMenu(null);
      initAuthUI();
    }
  }
}
// 根據角色渲染 menu
function renderMenu(UserType: any) {
  const visitorMenu = document.getElementById("visitor-menu")!;
  const helperMenu = document.getElementById("helper-menu")!;
  const hostMenu = document.getElementById("host-menu")!;
  const showMenuBtn = document.getElementById(
    "show-menu-btn"
  ) as HTMLButtonElement;
  if (UserType == "HELPER") {
    showMenuBtn.addEventListener("click", () => {
      if (helperMenu.style.display == "block") {
        helperMenu.style.display = "none";
      } else {
        helperMenu.style.display = "block";
      }
    });
  } else if (UserType == "HOST") {
    showMenuBtn.addEventListener("click", () => {
      if (hostMenu.style.display == "block") {
        hostMenu.style.display = "none";
      } else {
        hostMenu.style.display = "block";
      }
    });
  } else {
    showMenuBtn.addEventListener("click", () => {
      if (visitorMenu.style.display == "block") {
        visitorMenu.style.display = "none";
      } else {
        visitorMenu.style.display = "block";
      }
    });
  }
}
// 角色按鈕取值函式
function getSelectedBtnValue(selector: string): string {
  const selectedButton = document.querySelector(`${selector}.selected`);
  const element = selectedButton as HTMLElement | null;
  return element?.dataset.value || "";
}
const validators = {
  email: (email: any) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "請輸入電子郵件";
    if (!re.test(email)) return "請輸入有效的電子郵件";
    return null;
  },

  realname: (name: any) => {
    if (!name) return "請輸入真實姓名";

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 10) {
      return "真實姓名長度必須在 2-10 字符之間";
    }

    const chinesePattern = /^[\u4e00-\u9fa5]{2,}$/;
    const englishPattern = /^[a-zA-Z\s]{2,}$/;

    if (
      !chinesePattern.test(trimmedName) &&
      !englishPattern.test(trimmedName)
    ) {
      return "請輸入有效的中文姓名或英文姓名";
    }

    if (/[\d!@#$%^&*(),.?":{}|<>]/.test(trimmedName)) {
      return "真實姓名不應包含數字或特殊符號";
    }

    return null;
  },

  username: (username: any) => {
    if (!username) return "請輸入用戶名";

    if (username.length < 3 || username.length > 20) {
      return "用戶名必須為 3-20 個字符";
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "用戶名只能包含字母、數字和下底線";
    }

    return null;
  },

  password: (password: any) => {
    if (!password) return "請輸入密碼";

    if (password.length < 6) {
      return "密碼至少需要 6 個字符";
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "密碼必須包含至少一個大寫字母、一個小寫字母和一個數字";
    }

    return null;
  },

  userType: (userType: any) => {
    const validTypes = ["HELPER", "HOST"];
    if (!userType) return "請選擇用戶類型";

    if (!validTypes.includes(userType)) {
      return "用戶類型必須為 HELPER 或 HOST";
    }

    return null;
  },
};
function validateField(fieldName: string, value: any) {
  let error = null;

  switch (fieldName) {
    case "email":
      error = validators.email(value);
      break;
    case "realname":
      error = validators.realname(value);
      break;
    case "username":
      error = validators.username(value);
      break;
    case "password":
      error = validators.password(value);
      break;
    case "userType":
      error = validators.userType(value);
      break;
  }

  showFieldError(fieldName, error);
  return error === null;
}

// 顯示錯誤訊息
function showFieldError(fieldName: string, errorMessage: string | null) {
  const field = document.getElementById(
    `${fieldName}-response-message`
  ) as HTMLDivElement;
  field.replaceChildren();

  if (errorMessage) {
    const errorElement = document.createElement("div");
    errorElement.textContent = errorMessage;
    errorElement.className = "error-message";
    errorElement.style.color = "#c45f00";
    errorElement.style.fontSize = "12px";
    errorElement.style.padding = "0px 10px";

    field.appendChild(errorElement);
  }
}

function validateRegistrationForm() {
  // 取得註冊資料
  const email = document.getElementById("sign-up-email") as HTMLInputElement;
  const password = document.getElementById(
    "sign-up-passsword"
  ) as HTMLInputElement;
  const username = document.getElementById(
    "sign-up-username"
  ) as HTMLInputElement;
  const realname = document.getElementById(
    "sign-up-realname"
  ) as HTMLInputElement;
  const userType = getSelectedBtnValue(".sign-up-role");

  const formData = {
    email: email.value,
    password: password.value,
    username: username.value,
    realname: realname.value,
    userType,
  };

  let isValid = true;

  // 驗證所有欄位
  if (!validateField("email", formData.email)) {
    isValid = false;
  }
  if (!validateField("realname", formData.realname)) {
    isValid = false;
  }
  if (!validateField("username", formData.username)) {
    isValid = false;
  }
  if (!validateField("password", formData.password)) {
    isValid = false;
  }
  if (!validateField("userType", formData.userType)) {
    isValid = false;
  }

  return { isValid, formData };
}
function initAuthUI() {
  // 角色按鈕樣式
  const signUpRoleButtons = document.querySelectorAll(".sign-up-role");
  const signInRoleButtons = document.querySelectorAll(".sign-in-role");
  [signUpRoleButtons, signInRoleButtons].forEach((btns) => {
    btns.forEach((button) => {
      button.addEventListener("click", () => {
        btns.forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
  });

  // 點擊註冊按鈕，跳出表單
  const toSignUpDiv = document.getElementById("sign-up-div") as HTMLDivElement;
  const signUpDialog = document.getElementById(
    "sign-up-dialog"
  ) as HTMLDialogElement;
  toSignUpDiv.addEventListener("click", () => {
    signUpDialog.showModal();
    signUpDialog.classList.add("show");
  });

  // 點擊登入按鈕，跳出表單
  const toSignInDiv = document.getElementById("sign-in-div") as HTMLDivElement;
  const signInDialog = document.getElementById(
    "sign-in-dialog"
  ) as HTMLDialogElement;
  toSignInDiv.addEventListener("click", () => {
    signInDialog.showModal();
    signInDialog.classList.add("show");
  });

  //點擊周邊區域，關閉登入或註冊表單
  signUpDialog.addEventListener(
    "click",
    createDialogClickHandler(signUpDialog)
  );
  signInDialog.addEventListener(
    "click",
    createDialogClickHandler(signInDialog)
  );

  // 註冊 submit
  const signUpForm = document.getElementById("sign-up-form") as HTMLFormElement;
  signUpForm.addEventListener("submit", async (event: Event) => {
    event.preventDefault();
    // 重置回應訊息
    const signUpResponse = document.getElementById(
      "sign-up-response-message"
    ) as HTMLParagraphElement;
    signUpResponse.replaceChildren();

    // 取得註冊資料
    const { isValid, formData } = validateRegistrationForm();
    console.log(isValid);
    if (isValid) {
      let response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorData = await response.json();
        if (Array.isArray(errorData.errors)) {
          const messages = errorData.errors
            .map((err: any) => err.msg)
            .join(" / ");
          renderResponseMessage(signUpResponse, messages, "red");
        } else {
          renderResponseMessage(
            signUpResponse,
            errorData.message || "註冊時發生錯誤",
            "red"
          );
        }

        throw new Error(errorData.message || "註冊時發生錯誤");
      }
      const signUpData = await response.json();
      if (signUpData.success) {
        localStorage.setItem("token", signUpData.token);
        renderResponseMessage(
          signUpResponse,
          "註冊成功！請登入開始使用",
          "green"
        );
      } else {
        alert(signUpData.message);
      }
    }
  });

  function renderResponseMessage(
    area: HTMLParagraphElement,
    msg: string,
    color: string
  ) {
    area.textContent = msg;
    area.style.color = color;
    area.style.marginBottom = "10px";
  }

  // 登入 submit
  const signInForm = document.getElementById("sign-in-form") as HTMLFormElement;
  signInForm.addEventListener("submit", async (event: Event) => {
    event.preventDefault();
    // 重置回應訊息
    const signInResponse = document.getElementById(
      "sign-in-response-message"
    ) as HTMLParagraphElement;
    signInResponse.replaceChildren();

    // 取得登入資料
    const email = document.getElementById("sign-in-email") as HTMLInputElement;
    const password = document.getElementById(
      "sign-in-password"
    ) as HTMLInputElement;
    const userType = getSelectedBtnValue(".sign-in-role");
    if (import.meta.env.VITE_MODE == "development") {
      console.log("取得登入資料", { email, password, userType });
    }

    // 驗證登入資料
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value || !password.value || !userType) {
      renderResponseMessage(signInResponse, "請填打所有欄位", "red");
    } else if (!re.test(email.value)) {
      renderResponseMessage(signInResponse, "請輸入正確的電子郵件", "red");
    } else {
      let response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      });

      if (!response.ok) {
        let errorData = await response.json();
        if (Array.isArray(errorData.errors)) {
          const messages = errorData.errors
            .map((err: any) => err.msg)
            .join(" / ");
          renderResponseMessage(signInResponse, messages, "red");
        } else {
          renderResponseMessage(
            signInResponse,
            errorData.message || "登入時發生錯誤",
            "red"
          );
        }
        throw new Error(errorData.message || "登入時發生錯誤");
      }
      const signInData = await response.json();

      if (signInData.success) {
        localStorage.setItem("token", signInData.token);
        renderResponseMessage(signInResponse, "登入成功", "green");
        location.reload();
      } else {
        alert(signInData.message);
      }
    }
  });
}

function loginUI() {
  //登出
  const logOutBtns = document.querySelectorAll(".log-out-btn");
  logOutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("token");
      location.reload();
    });
  });
  //前往帳號頁
  const accountBtns = document.querySelectorAll<HTMLButtonElement>(
    ".account-management-btn"
  );
  accountBtns.forEach((accountBtn) => {
    accountBtn.onclick = () => {
      window.location.assign("./account.html");
    };
  });
}

//用 token 取得當前使用者資訊
async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  let data = await res.json();
  if (import.meta.env.VITE_MODE == "development") {
    console.log("userData", data);
  }
  if (data.success) {
    return data;
  } else {
    return null;
  }
}

//通知清單控制
const notificationBtn = document.querySelector(".fa-bell") as HTMLElement;
const notificationList = document.getElementById(
  "notification-list"
) as HTMLElement;
notificationBtn.addEventListener("click", () => {
  if (notificationList.style.display == "block") {
    notificationList.style.display = "none";
  } else {
    notificationList.style.display = "block";
  }
});

// 根據角色連結 SSE
function sse(helperId: number) {
  const eventSource = new EventSource(`/api/notification/stream/${helperId}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const list = document.getElementById("notification-list");
    const count = document.getElementById("notification-count");

    const item = document.createElement("div");
    item.innerText = data.message;
    list?.appendChild(item);

    const current = parseInt(count?.innerText || "0");
    count!.innerText = (current + 1).toString();
  };
}
