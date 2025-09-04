import {
  getSocket,
  registerSocketHandler,
  // emitSocketEvent,
} from "../services/socket/socketConnection.js";
import { debounce } from "lodash";

import { API_BASE_URL } from "../utils/config.js";
let currentUserId: string;
let messages: Message[] = [];
let conversations: Conversation[] = [];
let currentConversationId: string;

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: "TEXT" | "IMAGE" | "FILE";
  attachments?: JSON;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface Conversation {
  conversationId: string;
  myRole: "HOST" | "HELPER";
  otherUser: {
    id: string;
    username: string;
    avatar?: string;
  };
  otherUserRole: "HOST" | "HELPER";
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
}

async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!res.ok) {
    return null;
  }
  let data = await res.json();
  if (data.success) {
    return data;
  } else {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.pathname.startsWith("/chat")) return;
  const token = localStorage.getItem("token");
  if (!token) {
    location.replace("/");
  } else {
    const userData = await getCurrentUser();
    if (!userData) {
      location.replace("/");
    }
  }
});

//===================================================//
export async function initChatPage() {
  let localUserId = localStorage.getItem("userId");
  if (localUserId) {
    currentUserId = localUserId;
    await loadConversations(currentUserId);
  }

  // 點擊按鈕，發送訊息
  const messageInputForm = document.getElementById(
    "message-input-form"
  ) as HTMLFormElement;
  const messageInput = document.getElementById(
    "message-input"
  ) as HTMLTextAreaElement;

  if (messageInputForm && messageInput) {
    messageInputForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (messageInput.value.trim()) {
        sendMessage(messageInput.value);
      }
    });
  }
  // 使用 Input 0.2ms，顯示輸入中
  const sendTyping = debounce(() => {
    const socket = getSocket();
    if (!socket || !currentConversationId) return;
    socket.emit("typing", {
      conversationId: currentConversationId,
      isTyping: true,
    });
  }, 200);

  let typingTimeout: NodeJS.Timeout | null = null;
  messageInput.addEventListener("input", () => {
    sendTyping();
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    typingTimeout = setTimeout(() => {
      const socket = getSocket();
      if (!socket || !currentConversationId) return;
      socket.emit("typing", {
        conversationId: currentConversationId,
        isTyping: false,
      });
    }, 1000);
  });

  // 接收暫存的 convId，載入對話細節
  const convId = localStorage.getItem("activeConvId");
  if (convId) {
    localStorage.removeItem("activeConvId");
    const targetConv = conversations.find(
      (conv) => conv.conversationId === convId
    );
    if (targetConv) {
      openConversation(convId);
      renderMessageHeader(targetConv);
    }
  }

  //關閉頁面
  function setupLeaveOnUnload() {
    window.addEventListener("beforeunload", () => {
      const socket = getSocket();
      if (socket && currentConversationId) {
        socket.emit("leave_conversation", {
          conversationId: currentConversationId,
        });
        if (import.meta.env.VITE_MODE == "development") {
          console.log(`頁面關閉時離開對話房間: ${currentConversationId}`);
        }
      }
    });
  }
  setupLeaveOnUnload();
}

//取得 conversations 資料，並且渲染
async function loadConversations(currentUserId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chat/conversations/${currentUserId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    conversations = await response.json();
    try {
      renderConversationList();
      // initializeChatPage();
    } catch (e) {
      if (import.meta.env.VITE_MODE == "development") {
        console.error("渲染對話列表失敗", e);
      }
    }
  } catch (error) {
    if (import.meta.env.VITE_MODE == "development") {
      console.error("載入對話列表失敗:", error);
    }
  }
}
//conversations 渲染函式
function renderConversationList() {
  //取放置所有對話的區域
  const conversationList = document.getElementById("conversations-list");
  if (!conversationList) {
    return;
  }
  conversationList.replaceChildren();
  const conversationTemplate = document.getElementById(
    "conversation-template"
  ) as HTMLTemplateElement;

  conversations.forEach((conv) => {
    const conversationTemplateClone = conversationTemplate.content.cloneNode(
      true
    ) as DocumentFragment;
    const conversationItem = conversationTemplateClone.querySelector(
      ".conversation-item"
    ) as HTMLDivElement;
    conversationItem.onclick = async () => {
      await openConversation(`${conv.conversationId}`);
      renderMessageHeader(conv);
    };
    conversationItem.dataset.conversationId = conv.conversationId;

    const avatarImg = conversationTemplateClone.querySelector(
      "img"
    ) as HTMLImageElement;
    if (conv.otherUser.avatar) {
      avatarImg.src = conv.otherUser.avatar;
    } else {
      avatarImg.src = "/img/user-default.png";
    }

    const conversationTitle = conversationTemplateClone.querySelector(
      ".conversation-title"
    ) as HTMLDivElement;
    conversationTitle.textContent = ` ${conv.otherUser.username}`;

    const lastMessage = conversationTemplateClone.querySelector(
      ".last-message"
    ) as HTMLDivElement;
    lastMessage.textContent = `${
      conv.lastMessage ? conv.lastMessage.content : "暫無訊息"
    }`;
    const timestamp = conversationTemplateClone.querySelector(
      ".timestamp"
    ) as HTMLDivElement;
    timestamp.textContent = `   ${
      conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""
    }`;

    const unreadBadge = conversationTemplateClone.querySelector(
      ".unread-badge"
    ) as HTMLDivElement;
    if (conv.unreadCount > 0) {
      unreadBadge.style.display = "block";
      unreadBadge.textContent = `${conv.unreadCount}`;
    } else {
      unreadBadge.style.display = "none";
    }
    conversationList.appendChild(conversationTemplateClone);
  });
}

//===================================================//

// 註冊聊天相關 Socket 事件
export function setupChat() {
  const socket = getSocket();
  if (!socket) return;

  registerSocketHandler("new_message_online", (event: { payload: Message }) => {
    const message = event.payload;
    renderMessage(message);
    updateConversationList(message);
  });

  registerSocketHandler("new_message_offline", (event: { payload: any }) => {
    const message = event.payload;
    const { conversationId, content, createdAt, unreadCount } = event.payload;

    // 更新 conversations 陣列
    const convIndex = conversations.findIndex(
      (conv) => conv.conversationId === conversationId
    );
    if (convIndex !== -1) {
      // 更新最後訊息
      conversations[convIndex].lastMessage = content;
      conversations[convIndex].lastMessageAt = createdAt;
      // 使用後端傳來的未讀數
      conversations[convIndex].unreadCount = unreadCount;

      // 排序並重新渲染列表
      conversations.sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0).getTime() -
          new Date(a.lastMessageAt || 0).getTime()
      );
      renderConversationList();
    } else {
      // 如果本地沒有這個 conversation，重新載入列表
      loadConversations(currentUserId);
    }

    updateConversationList(message);
  });

  registerSocketHandler(
    "unread_update",
    (event: { payload: { conversationId: string; unreadCount: number } }) => {
      const { conversationId, unreadCount } = event.payload;
      updateConversationUnreadCount(conversationId, unreadCount);
    }
  );

  registerSocketHandler(
    "user_typing",
    (event: { payload: { userId: string; isTyping: boolean } }) => {
      const { userId, isTyping } = event.payload;
      const updateTypingIndicator = debounce((isTyping: boolean) => {
        const typingIndicator = document.getElementById(
          "typing-indicator-wrap"
        );
        if (!typingIndicator) {
          return;
        }
        typingIndicator.style.display = isTyping ? "flex" : "none";
        const messagesContainer = document.getElementById(
          "messages-container"
        ) as HTMLElement;
        if (!messagesContainer) return;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 200); // 延遲 200ms，避免快速切換

      if (userId !== currentUserId) {
        updateTypingIndicator(isTyping);
      }
    }
  );
}

function renderMessage(message: Message) {
  //取放置所有訊息的區域
  const messagesContentArea = document.getElementById(
    "messages-content"
  ) as HTMLElement;
  if (!messagesContentArea) return;

  // 檢查訊息是否已存在，避免重複渲染
  const existingMessage = document.querySelector(
    `[data-message-id="${message.id}"]`
  );
  if (existingMessage) {
    return;
  }

  // 複製訊息模板
  const messageTemplate = document.getElementById(
    "message-template"
  ) as HTMLTemplateElement;
  const messageTemplateClone = messageTemplate.content.cloneNode(
    true
  ) as DocumentFragment;
  //共同渲染的東西
  const massageText = messageTemplateClone.querySelector(
    ".message-text"
  ) as HTMLDivElement;
  massageText.textContent = message.content;

  const massageTime = messageTemplateClone.querySelector(
    ".message-time"
  ) as HTMLDivElement;
  massageTime.textContent = formatTime(message.createdAt);

  const massageDiv = messageTemplateClone.querySelector(
    ".message"
  ) as HTMLDivElement;
  massageDiv.dataset.messageId = message.id;

  //判斷傳訊息者，決定渲染格式
  const isMyMessage = message.senderId === currentUserId;

  if (isMyMessage) {
    massageDiv.classList.add("my-message");
  } else {
    massageDiv.classList.add("other-message");
    // const avatarImg = messageTemplateClone.querySelector(
    //   "img"
    // ) as HTMLImageElement;
    // avatarImg.src = `${message.sender.avatar || "/img/default-avatar.png"}`;

    // const massageSender = messageTemplateClone.querySelector(
    //   ".message-sender"
    // ) as HTMLDivElement;
    // massageSender.textContent = message.sender.username;
  }

  messagesContentArea.appendChild(messageTemplateClone);
  const messagesContainer = document.getElementById(
    "messages-container"
  ) as HTMLElement;
  if (!messagesContainer) return;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
//即時更新對話列表的未讀數量和最後訊息
function updateConversationList(message: Message) {
  // 更新對話列表中的最後訊息
  const convIndex = conversations.findIndex(
    (conv) => conv.conversationId === message.conversationId
  );
  if (convIndex !== -1) {
    conversations[convIndex].lastMessage = message;
    conversations[convIndex].lastMessageAt = message.createdAt;

    // 重新排序和渲染
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
    );
    renderConversationList();
  }
}

//即時更新對話列表的未讀數量
function updateConversationUnreadCount(
  conversationId: string,
  unreadCount: number
) {
  //找出當前對話
  const convIndex = conversations.findIndex(
    (c) => c.conversationId === conversationId
  );
  if (convIndex === -1) return;

  //設定新的 unreadCount
  conversations[convIndex].unreadCount = unreadCount;

  // 更新 DOM
  const conversationItem = document.querySelector(
    `.conversation-item[data-conversation-id="${conversationId}"]`
  );
  if (conversationItem) {
    const unreadBadge = conversationItem.querySelector(
      ".unread-badge"
    ) as HTMLDivElement;
    if (unreadBadge) {
      if (unreadCount > 0) {
        unreadBadge.textContent = `${unreadCount}`;
        unreadBadge.style.display = "block";
      } else {
        unreadBadge.style.display = "none";
      }
    }
  }
}

//===================================================//

//點擊單一 conversation，加入對話房間、渲染對話訊息
async function openConversation(conversationId: string) {
  const socket = getSocket();
  if (!socket) return;
  if (socket && currentConversationId) {
    socket.emit("leave_conversation", {
      conversationId: currentConversationId,
    });
    if (import.meta.env.VITE_MODE == "development") {
      console.log(`離開頁面前，離開對話房間: ${currentConversationId}`);
    }
  }

  currentConversationId = conversationId;
  // 加入對話房間
  socket.emit("join_conversation", { conversationId });

  // 載入此對話的訊息
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chat/messages/${conversationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    messages = await response.json();
    renderMessages();
  } catch (error) {
    if (import.meta.env.VITE_MODE == "development") {
      console.error("載入訊息失敗:", error);
    }
  }
}
//選染對話房間的標題
function renderMessageHeader(conv: Conversation) {
  const otherAvatar = document.getElementById(
    "header-other-avatar"
  ) as HTMLImageElement;

  otherAvatar.src = `${conv.otherUser.avatar || "/img/user-default.png"}`;
  const otherUserName = document.getElementById(
    "header-other-username"
  ) as HTMLDivElement;
  otherUserName.textContent = conv.otherUser.username;

  const roleReminder = document.getElementById(
    "header-role-reminder"
  ) as HTMLDivElement;
  if (conv.myRole == "HELPER") {
    roleReminder.textContent = "您正在以 [幫手] 身份與對方通訊";
  } else {
    roleReminder.textContent = "您正在以 [店家] 身份與對方通訊";
  }
}
//渲染所有 messages
function renderMessages() {
  const messagesContentArea = document.getElementById("messages-content");
  if (!messagesContentArea) return;
  const messagesDefault = document.getElementById(
    "messages-default"
  ) as HTMLElement;
  messagesContentArea.replaceChildren();

  messages.forEach((message) => {
    const messageTemplate = document.getElementById(
      "message-template"
    ) as HTMLTemplateElement;
    const messageTemplateClone = messageTemplate.content.cloneNode(
      true
    ) as DocumentFragment;

    //共同渲染的東西
    const massageText = messageTemplateClone.querySelector(
      ".message-text"
    ) as HTMLDivElement;
    massageText.textContent = message.content;

    const massageTime = messageTemplateClone.querySelector(
      ".message-time"
    ) as HTMLDivElement;
    massageTime.textContent = formatTime(message.createdAt);

    const massageDiv = messageTemplateClone.querySelector(
      ".message"
    ) as HTMLDivElement;
    massageDiv.setAttribute("data-message-id", message.id);

    //判斷傳訊息者，決定渲染格式
    const isMyMessage = message.senderId === currentUserId;

    if (isMyMessage) {
      massageDiv.classList.add("my-message");
    } else {
      massageDiv.classList.add("other-message");
      // const avatarImg = messageTemplateClone.querySelector(
      //   "img"
      // ) as HTMLImageElement;
      // avatarImg.src = `${message.sender.avatar || "/img/default-avatar.png"}`;
    }
    messagesContentArea.appendChild(messageTemplateClone);
  });
  messagesDefault.style.display = "none";
  const messagesContainer = document.getElementById(
    "messages-container"
  ) as HTMLElement;
  if (!messagesContainer) return;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 點擊傳送按鈕，發送訊息 ===========================================================

// const messageInputForm = document.getElementById(
//   "message-input-form"
// ) as HTMLFormElement;
// const messageInput = document.getElementById(
//   "message-input"
// ) as HTMLTextAreaElement;
// messageInputForm.addEventListener("submit", function (e) {
//   e.preventDefault();
//   if (messageInput && messageInput.value.trim()) {
//     sendMessage(messageInput.value);
//   }
// });

function sendMessage(
  content: string,
  messageType: "TEXT" | "IMAGE" | "FILE" = "TEXT"
) {
  if (!currentConversationId || !content.trim()) return;
  const socket = getSocket();
  if (!socket) return;

  socket.emit("send_message", {
    conversationId: currentConversationId,
    content: content.trim(),
    messageType,
  });
  const messageInput = document.getElementById(
    "message-input"
  ) as HTMLTextAreaElement;
  if (messageInput) messageInput.value = "";
}

//===================================================//

// messageInput.addEventListener("input", () => {
//   const socket = getSocket();
//   if (!socket) return;
//   socket.emit("typing", { conversationId, isTyping: true });
//   //使用防抖（debounce）機制，避免過頻繁發送 typing 事件。
// });

//===================================================//

// 功能函式
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
  }
}
