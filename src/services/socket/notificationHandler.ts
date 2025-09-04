// import { SocketEvent, NotificationData } from "./types";
import { emitSocketEvent, registerSocketHandler } from "./socketConnection";

type SocketEvent = {
  type: string;
  payload: any;
};

interface NotificationData {
  id: string;
  title: string;
  message: string;
  helperProfileId: string;
  timestamp: string;
  isRead?: boolean;
  data: NotificationUnitData;
}
interface NotificationUnitData {
  unitName: string;
  workPostId: string;
  positionName: string;
}

// 顯示瀏覽器通知
const showBrowserNotification = (notification: NotificationData): void => {
  if (!("Notification" in window)) {
    if (import.meta.env.VITE_MODE == "development") {
      console.warn("此瀏覽器不支援桌面通知");
    }
    return;
  }
  if (Notification.permission === "default") {
    Notification.requestPermission()
      .then((permission) => {
        if (permission !== "granted") {
          if (import.meta.env.VITE_MODE == "development") {
            console.log("用戶拒絕通知權限");
          }
          return;
        }
        // 權限允許後顯示通知
        new Notification(notification.title, {
          body: notification.message,
          icon: "/images/notification-icon.png",
          tag: notification.id,
        });
      })
      .catch((error) => {
        if (import.meta.env.VITE_MODE == "development") {
          console.error("請求通知權限失敗:", error);
        }
      });
  } else if (Notification.permission === "denied") {
    if (import.meta.env.VITE_MODE == "development") {
      console.log("通知權限已被拒絕，無法顯示通知");
    }
    return;
  } else if (Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.message,
      icon: "/images/notification-icon.png",
      tag: notification.id,
    });
  }
};

// 更新未讀數量
const updateUnreadCount = (count: number): void => {
  const countContainer = document.getElementById("notification-count")!;
  const countNumber = document.getElementById("notification-count-number")!;
  if (count > 0) {
    countNumber.textContent = `${count}`;
    countContainer.style.display = "flex";
  } else {
    countContainer.style.display = "none";
  }
};

// 更新通知列表
const showNotificationList = (notifications: NotificationData[]): void => {
  const notificationContainer = document.getElementById("notification-list");
  if (!notificationContainer) return;
  if (notifications.length > 0) {
    notifications.forEach((notification) => {
      const listItem = document.createElement("a");
      listItem.classList.add("notification-item");
      listItem.href = `/workpost/${notification.data.workPostId}`;
      listItem.target = "_blank";

      const title = document.createElement("div");
      title.textContent = notification.title;
      title.classList.add("notification-title");
      listItem.appendChild(title);

      const message = document.createElement("div");
      message.textContent = notification.message;
      message.classList.add("notification-message");
      listItem.appendChild(message);

      const timestamp = document.createElement("div");
      timestamp.textContent = notification.timestamp;
      message.classList.add("notification-timestamp");
      listItem.appendChild(timestamp);

      notificationContainer.appendChild(listItem);
    });
  } else {
    const title = document.createElement("div");
    title.textContent = "目前沒有新的通知";
    notificationContainer.appendChild(title);
  }
};

const updateNotificationList = (notification: NotificationData): void => {
  const notificationContainer = document.getElementById("notification-list");
  if (!notificationContainer) return;

  const listItem = document.createElement("div");
  listItem.classList.add("notification-item");

  const title = document.createElement("div");
  title.textContent = notification.title;
  title.classList.add("notification-title");
  listItem.appendChild(title);

  const message = document.createElement("div");
  message.textContent = notification.message;
  message.classList.add("notification-message");
  listItem.appendChild(message);

  const timestamp = document.createElement("div");
  timestamp.textContent = notification.timestamp;
  message.classList.add("notification-timestamp");
  listItem.appendChild(timestamp);

  // notificationContainer.appendChild(listItem);

  notificationContainer.prepend(listItem); // 將新通知插入列表頂端
};

// 處理普通通知
const handleGeneralNotification = (event: SocketEvent): void => {
  const notification = event.payload as NotificationData;
  // emitSocketEvent("get_unread_count"); // 觸發未讀數量更新
  showBrowserNotification(notification);
  updateNotificationList(notification);
};

// 處理未讀數量更新
const handleUnreadCount = (event: SocketEvent): void => {
  updateUnreadCount(event.payload.count);
};

// 處理通知列表
const handleNotificationList = (event: SocketEvent): void => {
  showNotificationList(event.payload.notifications);
};

// 註冊事件
export const setupNotification = (): void => {
  registerSocketHandler("new_notification", handleGeneralNotification);
  registerSocketHandler("unread_count", handleUnreadCount);
  registerSocketHandler("notifications_list", handleNotificationList);

  // 在連線建立後，獲取初始通知數據
  emitSocketEvent("get_unread_count");
  emitSocketEvent("get_notifications", { limit: 20, offset: 0 });
};

export const markAllNotificationsRead = (userId: string): void => {
  emitSocketEvent("mark_notification_read", { userId });
};
