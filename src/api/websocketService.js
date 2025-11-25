const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:6789';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = [];
    this.reconnectInterval = 5000;
    this.reconnectTimer = null;
  }

  connect() {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.reconnect();
    }
  }

  reconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        this.connect();
      }, this.reconnectInterval);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }
}

export default new WebSocketService();
