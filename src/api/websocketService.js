const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:6789';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageHandlers = [];
    this.typingHandlers = [];
    this.statusHandlers = [];
    this.reconnectInterval = 5000;
    this.reconnectTimer = null;
    this.userId = null;
    this.currentRoom = null;
    this.currentConversation = null;
    this.typingTimeout = null;
  }

  connect(userId) {
    this.userId = userId;
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        // Register user with server
        this.send({
          type: 'register',
          userId: this.userId,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          // Route different message types
          switch (data.type) {
            case 'new_message':
              // New message in room or conversation
              this.messageHandlers.forEach((handler) => handler(data));
              break;
            case 'typing':
              // Someone is typing
              this.typingHandlers.forEach((handler) => handler(data));
              break;
            case 'status':
              // Message status update (delivered, read)
              this.statusHandlers.forEach((handler) => handler(data));
              break;
            default:
              // Generic message
              this.messageHandlers.forEach((handler) => handler(data));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.reconnect();
    }
  }

  reconnect() {
    if (!this.reconnectTimer && this.userId) {
      this.reconnectTimer = setTimeout(() => {
        console.log('🔄 Attempting to reconnect WebSocket...');
        this.connect(this.userId);
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
    this.userId = null;
    this.currentRoom = null;
    this.currentConversation = null;
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send:', data.type);
    }
  }

  // Join a room for receiving messages
  joinRoom(roomId) {
    this.currentRoom = roomId;
    this.currentConversation = null;
    this.send({
      type: 'join_room',
      roomId,
      userId: this.userId,
    });
  }

  // Leave current room
  leaveRoom() {
    if (this.currentRoom) {
      this.send({
        type: 'leave_room',
        roomId: this.currentRoom,
        userId: this.userId,
      });
      this.currentRoom = null;
    }
  }

  // Join a conversation for receiving messages
  joinConversation(conversationId) {
    this.currentConversation = conversationId;
    this.currentRoom = null;
    this.send({
      type: 'join_conversation',
      conversationId,
      userId: this.userId,
    });
  }

  // Leave current conversation
  leaveConversation() {
    if (this.currentConversation) {
      this.send({
        type: 'leave_conversation',
        conversationId: this.currentConversation,
        userId: this.userId,
      });
      this.currentConversation = null;
    }
  }

  // Send a message (will be saved via API, this just notifies)
  sendMessage(message) {
    this.send({
      type: 'message',
      ...message,
      userId: this.userId,
      roomId: this.currentRoom,
      conversationId: this.currentConversation,
      timestamp: Date.now(),
    });
  }

  // Send typing indicator
  sendTyping(isTyping = true) {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.send({
      type: 'typing',
      userId: this.userId,
      roomId: this.currentRoom,
      conversationId: this.currentConversation,
      isTyping,
    });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      this.typingTimeout = setTimeout(() => {
        this.sendTyping(false);
      }, 3000);
    }
  }

  // Mark messages as read
  sendReadReceipt(messageIds) {
    this.send({
      type: 'read',
      userId: this.userId,
      messageIds,
      roomId: this.currentRoom,
      conversationId: this.currentConversation,
    });
  }

  // Listen for new messages
  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  // Listen for typing indicators
  onTyping(handler) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter((h) => h !== handler);
    };
  }

  // Listen for status updates (delivered, read)
  onStatus(handler) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }
}

export default new WebSocketService();
