import { connectToSocket, getConnectionStatus } from "./socketConnection.js";
import { setupNotification } from "./notificationHandler.js";
import { setupChat, initChatPage } from "../../pages/chat.js";
import { debounce } from "lodash"; // 假設使用 lodash 的 debounce

type SocketConfig = {
  token: string;
  userId: string;
  pageName: string;
};

export const initSocket = async (config: SocketConfig): Promise<void> => {
  // 檢查 token 是否存在
  if (!config.token || !config.userId) {
    if (import.meta.env.VITE_MODE == "development") {
      console.warn("未提供有效的 token 或 userId，無法初始化 Socket");
    }
    return;
  }

  const { isConnected } = getConnectionStatus();
  if (isConnected) {
    if (import.meta.env.VITE_MODE == "development") {
      console.log("Socket 已連線，跳過初始化");
    }
    return;
  }

  try {
    await connectToSocket(config);
    setupNotification();
    if (config.pageName.includes("/chat")) {
      setupChat();
      initChatPage();
    }
    if (import.meta.env.VITE_MODE == "development") {
      console.log("Socket 初始化成功:", getConnectionStatus());
    }
  } catch (error) {
    if (import.meta.env.VITE_MODE == "development") {
      console.error("Socket 初始化失敗:", error);
    }
  }
};

const debouncedInitSocket = debounce(initSocket, 1000);
document.addEventListener("DOMContentLoaded", async () => {
  const config: SocketConfig = {
    token: localStorage.getItem("token") || "",
    userId: localStorage.getItem("userId") || "",
    pageName: window.location.pathname,
  };

  debouncedInitSocket(config);
});
