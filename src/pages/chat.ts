const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const token = localStorage.getItem("token");
import { getSocket, initSocket } from "../services/socket";
let currentUserId: string;
let messages: Message[] = [];
let conversations: Conversation[] = [];
let currentConversationId: string;

// token 驗證通過後，連接 socket，並載入對話列表
if (token) {
  const socket = initSocket(token);
  socket.off("connect").on("connect", async () => {
    const currentUserId = await getCurrentUserId();
    if (import.meta.env.VITE_MODE === "development") {
      console.log("連線成功！socket.id:", socket.id);
    }
    loadConversations(currentUserId);
  });

  socket.off("new_message").on("new_message", (message: Message) => {
    if (import.meta.env.VITE_MODE == "development") {
      console.log("收到新訊息:", message);
    }
    // 如果是當前對話的訊息，加入訊息列表
    if (message.conversationId === currentConversationId) {
      const isDuplicate = messages.some((m) => m.id === message.id);
      if (!isDuplicate) {
        messages.push(message);
        renderMessage(message);
      }
    }
    updateConversationList(message);
  });

  socket.on("error", (data: { message: string }) => {
    if (import.meta.env.VITE_MODE === "development") {
      console.error("Socket 錯誤:", data.message);
    }
    alert(data.message);
  });
  socket.off("disconnect").on("disconnect", () => {
    if (import.meta.env.VITE_MODE === "development") {
      console.log("Socket disconnect");
    }
  });
  socket.on("reconnect_attempt", (attempt) => {
    if (import.meta.env.VITE_MODE === "development") {
      console.log(`Socket reconnect 第 ${attempt} 次）`);
    }
  });
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
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

// 載入對話列表、點擊對話渲染訊息 ====================================================

async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  let userData = await res.json();
  if (userData.success) {
    if (import.meta.env.VITE_MODE == "development") {
      return userData;
    }
  } else {
    return null;
  }
}
async function getCurrentUserId(): Promise<string> {
  const userData = await getCurrentUser();
  currentUserId = userData.user.id;
  return currentUserId;
}

async function loadConversations(currentUserId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chat/conversations/${currentUserId}`
    );
    conversations = await response.json();
    try {
      renderConversationList();
    } catch (e) {
      console.error("渲染對話列表失敗", e);
    }
  } catch (error) {
    console.error("載入對話列表失敗:", error);
  }
}
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

    // const avatarImg = conversationTemplateClone.querySelector(
    //   "img"
    // ) as HTMLImageElement;
    // avatarImg.src = conv.otherUser.avatar!;

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

    if (conv.unreadCount > 0) {
      const unreadBadge = conversationTemplateClone.querySelector(
        ".unread-badge"
      ) as HTMLDivElement;
      unreadBadge.textContent = `${conv.unreadCount}`;
    }
    conversationList.appendChild(conversationTemplateClone);
  });
}
async function openConversation(conversationId: string) {
  currentConversationId = conversationId;
  const socket = getSocket();
  if (!socket) return;
  // 加入對話房間
  socket.emit("join_conversation", { conversationId });

  // 載入此對話的訊息
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chat/messages/${conversationId}`
    );
    messages = await response.json();
    renderMessages();
  } catch (error) {
    console.error("載入訊息失敗:", error);
  }
}
function renderMessages() {
  const messagesContainer = document.getElementById("messages-container");
  if (!messagesContainer) return;
  const messagesDefault = document.getElementById(
    "messages-default"
  ) as HTMLElement;
  messagesContainer.replaceChildren();

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
    messagesContainer.appendChild(messageTemplateClone);
  });
  messagesDefault.style.display = "none";
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderMessageHeader(conv: Conversation) {
  const otherAvatar = document.getElementById(
    "header-other-avatar"
  ) as HTMLImageElement;
  otherAvatar.src = `${conv.otherUser.avatar || "/img/default-avatar.jpg"}`;
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

// 點擊傳送按鈕，發送訊息 ===========================================================

const messageInputForm = document.getElementById(
  "message-input-form"
) as HTMLFormElement;
const messageInput = document.getElementById(
  "message-input"
) as HTMLTextAreaElement;

messageInputForm.addEventListener("submit", function (e) {
  e.preventDefault();
  if (messageInput && messageInput.value.trim()) {
    sendMessage(messageInput.value);
  }
});
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

// 接收新訊息，渲染於畫面 ===========================================================

function renderMessage(message: Message) {
  //取放置所有訊息的區域
  const messagesContainer = document.getElementById(
    "messages-container"
  ) as HTMLElement;
  if (!messagesContainer) return;

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

    // const massageSender = messageTemplateClone.querySelector(
    //   ".message-sender"
    // ) as HTMLDivElement;
    // massageSender.textContent = message.sender.username;
  }

  messagesContainer.appendChild(messageTemplateClone);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateConversationList(message: Message) {
  // 更新對話列表中的最後訊息
  const convIndex = conversations.findIndex(
    (conv) => conv.conversationId === message.conversationId
  );
  if (convIndex !== -1) {
    conversations[convIndex].lastMessage = message;
    conversations[convIndex].lastMessageAt = message.createdAt;

    // 如果不是當前對話且不是自己發送的訊息，增加未讀數
    if (
      message.conversationId !== currentConversationId &&
      message.senderId !== currentUserId
    ) {
      conversations[convIndex].unreadCount++;
    }

    // 重新排序和渲染
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
    );
    renderConversationList();
  }
}

// 其他功能函式 ===========================================================
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
