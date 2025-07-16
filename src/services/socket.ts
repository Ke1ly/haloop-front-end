import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

export function initSocket(token: string): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
    });
  }
  return socket;
}

// 取得已初始化的 socket，沒有就回傳 undefined
export function getSocket(): Socket | undefined {
  return socket;
}

// 斷線並清除 socket 實例（登出時用）
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}
