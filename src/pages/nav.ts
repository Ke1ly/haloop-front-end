import { createDialogClickHandler } from "../utils/dialog-utils.js";
import { initSocket } from "../services/socket/socket.js";
import { disconnectSocket } from "../services/socket/socketConnection.js";
// import "../services/socket/socket.js";
import { API_BASE_URL } from "../utils/config.js";
if (import.meta.env.VITE_MODE == "development") {
  console.log("Current API URL:", import.meta.env.VITE_API_URL);
  console.log("Current Mode:", import.meta.env.VITE_MODE);
}
import { markAllNotificationsRead } from "../services/socket/notificationHandler.js";

type SocketConfig = {
  token: string;
  userId: string;
  pageName: string;
};

initApp();

async function initApp() {
  let token = localStorage.getItem("token");
  if (!token || token == "undefined") {
    renderMenu(null);
    initAuthUI();
  } else {
    const userData = await getCurrentUser();
    if (userData) {
      renderMenu(userData.user.userType);
      logOutUI();
    } else {
      renderMenu(null);
      initAuthUI();
    }
  }
}
const visitorMenu = document.getElementById("visitor-menu") as HTMLElement;
const helperMenu = document.getElementById("helper-menu") as HTMLElement;
const hostMenu = document.getElementById("host-menu") as HTMLElement;
// 根據角色渲染 menu
function renderMenu(UserType: any) {
  const showMenuBtn = document.getElementById(
    "show-menu-btn"
  ) as HTMLButtonElement;
  if (UserType == "HELPER") {
    showMenuBtn.addEventListener("click", () => {
      if (helperMenu.style.display == "block") {
        helperMenu.style.display = "none";
      } else {
        helperMenu.style.display = "block";
        if (notificationList.style.display == "block") {
          notificationList.style.display = "none";
        }
      }
    });
  } else if (UserType == "HOST") {
    showMenuBtn.addEventListener("click", () => {
      if (hostMenu.style.display == "block") {
        hostMenu.style.display = "none";
      } else {
        hostMenu.style.display = "block";
        if (notificationList.style.display == "block") {
          notificationList.style.display = "none";
        }
      }
    });
  } else {
    showMenuBtn.addEventListener("click", () => {
      if (visitorMenu.style.display == "block") {
        visitorMenu.style.display = "none";
      } else {
        visitorMenu.style.display = "block";
        if (notificationList.style.display == "block") {
          notificationList.style.display = "none";
        }
      }
    });
  }
}

//通知清單控制
const notificationBtn = document.querySelector(".fa-bell") as HTMLElement;
const notificationList = document.getElementById(
  "notification-list"
) as HTMLElement;
notificationBtn.addEventListener("click", async () => {
  let userData = await getCurrentUser();
  if (userData) {
    if (notificationList.style.display == "block") {
      notificationList.style.display = "none";
    } else {
      notificationList.style.display = "block";
      const userId = localStorage.getItem("userId") || "";
      markAllNotificationsRead(userId);
      if (visitorMenu.style.display == "block") {
        visitorMenu.style.display = "none";
      } else if (hostMenu.style.display == "block") {
        visitorMenu.style.display = "none";
      } else if (helperMenu.style.display == "block") {
        helperMenu.style.display = "none";
      }
    }
  } else {
    notificationList.style.display = "none";
  }
});

// 角色按鈕取值函式
// function getSelectedBtnValue(selector: string): string {
//   const selectedButton = document.querySelector(`${selector}.selected`);
//   const element = selectedButton as HTMLElement | null;
//   return element?.dataset.value || "";
// }

function initAuthUI() {
  // 角色按鈕樣式
  // const signUpRoleButtons = document.querySelectorAll(".sign-up-role");
  // const signInRoleButtons = document.querySelectorAll(".sign-in-role");
  // [signUpRoleButtons, signInRoleButtons].forEach((btns) => {
  //   btns.forEach((button) => {
  //     button.addEventListener("click", () => {
  //       btns.forEach((btn) => btn.classList.remove("selected"));
  //       button.classList.add("selected");
  //     });
  //   });
  // });

  // 點擊註冊按鈕，跳出表單
  // const toSignUpDiv = document.getElementById("sign-up-div") as HTMLDivElement;
  // const signUpDialog = document.getElementById(
  //   "sign-up-dialog"
  // ) as HTMLDialogElement;
  // toSignUpDiv.addEventListener("click", () => {
  //   signUpDialog.showModal();
  //   signUpDialog.classList.add("show");
  // });

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
  // signUpDialog.addEventListener(
  //   "click",
  //   createDialogClickHandler(signUpDialog)
  // );
  signInDialog.addEventListener(
    "click",
    createDialogClickHandler(signInDialog)
  );

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

    // 驗證登入資料
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value || !password.value) {
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
        localStorage.setItem("userId", signInData.user.id);
        const socketConfig: SocketConfig = {
          token: signInData.token,
          userId: signInData.userId,
          pageName: window.location.pathname,
        };
        await initSocket(socketConfig);

        renderResponseMessage(signInResponse, "登入成功", "green");
        location.reload();
      } else {
        alert(signInData.message);
      }
    }
  });
}

function logOutUI() {
  //登出
  const logOutBtns = document.querySelectorAll(".log-out-btn");
  logOutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      disconnectSocket();
      location.reload();
    });
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
