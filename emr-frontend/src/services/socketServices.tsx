import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.APP_URL || window.location.origin).replace(
  /\/$/,
  "",
);

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (!this.socket) {
      console.log("🔌 Connecting socket...");

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        path: "/socket.io", // default, adjust if server is different
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket?.id);
      });

      this.socket.on("disconnect", (reason) => {
        console.warn("❌ Socket disconnected:", reason);
      });

      this.socket.on("connect_error", (err) => {
        console.error("🚫 Socket connection error:", err.message);
      });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("🔌 Socket disconnected manually");
    }
  }
}

export const socketService = new SocketService();
