import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../../utils/config";
import { getCurrentUser } from "../../utils/authMe.js";

type SocketConfig = {
  // token: string;
  userId: string;
  pageName: string;
};

type SocketEvent = {
  type: string;
  payload: any;
};

type SocketHandler = (event: SocketEvent) => void;

interface SocketState {
  socket: Socket | null;
  config: SocketConfig | null;
  eventHandlers: Map<string, Function[]>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isConnected: boolean;
}

// 建立初始狀態
const createInitialState = (): SocketState => ({
  socket: null,
  config: null,
  eventHandlers: new Map(),
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  isConnected: false,
});

// 全域狀態
let socketState = createInitialState();

export function getSocket(): Socket | null {
  return socketState.socket;
}

// 事件觸發器
const triggerEvent = (event: SocketEvent): void => {
  const handlers = socketState.eventHandlers.get(event.type);
  if (handlers) {
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        if (import.meta.env.VITE_MODE == "development") {
          console.error(`執行 ${event.type} handler 時發生錯誤:`, error);
        }
      }
    });
  } else {
    if (import.meta.env.VITE_MODE == "development") {
      console.warn(`未找到 ${event.type} 的 handler`);
    }
  }
};

// 初始化連線：連線、斷線、錯誤處理、註冊事件
export const connectToSocket = (config: SocketConfig): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    socketState.config = config;
    const userData = await getCurrentUser();
    if (!userData || !config.userId) {
      if (import.meta.env.VITE_MODE == "development") {
        console.warn("未提供有效的 token 或 userId，無法初始化 Socket");
      }
      return;
    }
    // 若已存在舊的連線，先斷開
    if (socketState.socket?.connected) {
      socketState.socket.disconnect();
    }

    socketState.socket = io(`${API_BASE_URL}`, {
      withCredentials: true,
      // query: { page: config.pageName },
      transports: ["websocket", "polling"],
      reconnection: false,
    });

    socketState.socket.on("connect", () => {
      socketState.isConnected = true;
      socketState.reconnectAttempts = 0;
      // if (socketState.config) {
      //   socketState.socket.emit("join_page", {
      //     pageName: socketState.config.pageName,
      //   });
      // }

      resolve();
    });

    socketState.socket.on("connect_error", (error) => {
      socketState.isConnected = false;
      if (socketState.reconnectAttempts < socketState.maxReconnectAttempts) {
        socketState.reconnectAttempts++;
        setTimeout(() => {
          socketState.socket?.connect();
        }, 1000 * socketState.reconnectAttempts);
      } else {
        reject(new Error(`連線失敗: ${error.message}`));
      }
    });

    socketState.socket.on("disconnect", (reason) => {
      socketState.isConnected = false;
      if (reason === "io server disconnect") {
        socketState.socket?.connect();
      }
    });

    socketState.socket.onAny((event: string, payload: any) => {
      triggerEvent({ type: event, payload });
    });

    setTimeout(() => {
      if (!socketState.isConnected) {
        reject(new Error("連線超時"));
      }
    }, 10000);
  });
};

// 註冊事件處理
export const registerSocketHandler = (
  event: string,
  handler: SocketHandler
): void => {
  const handlers = socketState.eventHandlers.get(event) || [];
  socketState.eventHandlers.set(event, [...handlers, handler]);
};

// 移除事件處理
export const unregisterSocketHandler = (
  event: string,
  handler?: SocketHandler
): void => {
  if (!handler) {
    socketState.eventHandlers.delete(event);
    if (import.meta.env.VITE_MODE == "development") {
      console.log(`事件 ${event} 的所有處理函數已移除`);
    }
  } else {
    const handlers =
      socketState.eventHandlers.get(event)?.filter((h) => h !== handler) || [];
    if (handlers.length > 0) {
      socketState.eventHandlers.set(event, handlers);
    } else {
      socketState.eventHandlers.delete(event);
    }
    if (import.meta.env.VITE_MODE == "development") {
      console.log(`事件 ${event} 的指定處理函數已移除`);
    }
  }
};

// 發送事件
export const emitSocketEvent = <T>(
  event: string,
  data?: T,
  callback?: (response: any) => void
): void => {
  if (socketState.socket?.connected) {
    socketState.socket.emit(event, data, callback);
  } else {
    if (import.meta.env.VITE_MODE == "development") {
      console.warn(`Socket 未連線，無法發送事件: ${event}`);
    }
  }
};

// 斷開連線
export const disconnectSocket = (): void => {
  if (socketState.socket) {
    socketState.socket.disconnect();
    socketState.socket = null;
  }
  socketState = createInitialState();
};

// 獲取連線狀態
export const getConnectionStatus = (): {
  isConnected: boolean;
  socketId?: string;
} => ({
  isConnected: socketState.isConnected,
  socketId: socketState.socket?.id,
});

// 心跳檢測
// export const pingSocket = (): Promise<number> => {
//   return new Promise((resolve, reject) => {
//     if (!socketState.socket?.connected) {
//       reject(new Error("Socket 未連線"));
//       return;
//     }
//     const startTime = Date.now();
//     socketState.socket.emit("ping", (response: { timestamp: number }) => {
//       resolve(Date.now() - startTime);
//     });
//     setTimeout(() => reject(new Error("心跳檢測超時")), 5000);
//   });
// };

// 獲取用戶狀態
export const getUserStatus = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!socketState.socket?.connected) {
      reject(new Error("Socket 未連線"));
      return;
    }
    socketState.socket.emit("get_user_status", (response: any) => {
      resolve(response);
    });
    setTimeout(() => reject(new Error("獲取狀態超時")), 5000);
  });
};
