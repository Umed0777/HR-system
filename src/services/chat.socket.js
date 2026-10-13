import { CHAT_BASE, getLogin } from "./chat.config";

let instance = null;

class ChatSocket {
  constructor(url, handlers) {
    this.url = url;
    this.handlers = handlers;
    this.retry = 1000;
    this.closedByUser = false;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retry = 1000;
      this.handlers.onReconnect?.();
    };

    this.ws.onmessage = (e) => {
      e.data.split("\n").forEach((line) => {
        if (!line.trim()) return;
        try {
          const { type, payload } = JSON.parse(line);
          this.handlers[type]?.(payload);
        } catch (err) {
          console.log("WS parse error:", err);
        }
      });
    };

    this.ws.onclose = () => {
      if (this.closedByUser) return;
      setTimeout(() => this.connect(), this.retry);
      this.retry = Math.min(this.retry * 2, 30000);
    };
  }

  send(type, payload) {
    if (this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type, payload }));
    return true;
  }

  close() {
    this.closedByUser = true;
    this.ws.close();
    if (instance === this) instance = null;
  }
}

export const createChatSocket = (handlers) => {
  const url = `${CHAT_BASE.replace(/^http/, "ws")}/ws?login=${encodeURIComponent(getLogin())}`;
  instance = new ChatSocket(url, handlers);
  return instance;
};

export const sendSocket = (type, payload) =>
  instance ? instance.send(type, payload) : false;

export const closeChatSocket = () => instance?.close();