import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../api/authService';
import { userService } from '../api/userService';
import { roomService } from '../api/roomService';
import { conversationService } from '../api/conversationService';
import { messageService } from '../api/messageService';
import websocketService from '../api/websocketService';
import styles from './Chat.module.css';

function Chat({ setIsAuthenticated }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const roomId = searchParams.get('roomId');
  const conversationId = searchParams.get('conversationId');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Fetch all users
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsers();
        setUsers(response);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    // Fetch messages for room or conversation
    const fetchMessages = async () => {
      try {
        setLoading(true);
        let data = [];
        if (roomId) {
          data = await roomService.getRoomMessages(roomId);
        } else if (conversationId) {
          data = await conversationService.getConversationMessages(
            conversationId
          );
        }
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    if (roomId || conversationId) {
      fetchMessages();
    }

    // Connect to WebSocket
    websocketService.connect();

    // Listen for incoming messages
    const unsubscribe = websocketService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, [roomId, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      setDocument(file.name);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setLoading(true);

      // Send message via API if in a room or conversation
      if (roomId || conversationId) {
        await messageService.sendMessage(
          user.id,
          newMessage,
          roomId,
          conversationId,
          document
        );
      } else {
        // Fallback to WebSocket for general chat
        const message = {
          text: newMessage,
          sender: user?.name || 'Anonymous',
          timestamp: new Date().toISOString(),
        };
        websocketService.sendMessage(message);
        setMessages((prev) => [...prev, message]);
      }

      setNewMessage('');
      setDocument(null);

      // Refresh messages
      if (roomId) {
        const data = await roomService.getRoomMessages(roomId);
        setMessages(data);
      } else if (conversationId) {
        const data = await conversationService.getConversationMessages(
          conversationId
        );
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    navigate('/login');
  };

  const getChatTitle = () => {
    if (roomId) return 'Room Chat';
    if (conversationId) return 'Private Chat';
    return 'Chat App';
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unknown User';
    const foundUser = users.find((u) => u.id === userId);
    return foundUser ? foundUser.name : userId;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>{getChatTitle()}</h1>
          <div className={styles.headerActions}>
            <button
              onClick={() => navigate('/rooms')}
              className={styles.navButton}
            >
              Rooms
            </button>
            <button
              onClick={() => navigate('/conversations')}
              className={styles.navButton}
            >
              Conversations
            </button>
            <button
              onClick={() => navigate('/friends')}
              className={styles.navButton}
            >
              Friends
            </button>
          </div>
          <div className={styles.userSection}>
            <span className={styles.userName}>{user?.name || 'User'}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <main className={styles.main}>
        <div className={styles.messagesContainer}>
          {loading && messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  msg.senderId === user?.id
                    ? styles.messageSent
                    : styles.messageReceived
                }`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageSender}>
                    {msg.sender || getUserName(msg.senderId)}
                  </span>
                  <span className={styles.messageTime}>
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <div className={styles.messageText}>
                  {msg.message || msg.text}
                </div>
                {msg.document && (
                  <div className={styles.messageDocument}>
                    📄 {msg.document}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className={styles.footer}>
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <div className={styles.fileInputWrapper}>
            <label htmlFor="fileInput" className={styles.fileLabel}>
              📎
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </div>
          {document && <span className={styles.fileName}>📄 {document}</span>}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={styles.input}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!newMessage.trim() || loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </footer>
    </div>
  );
}

export default Chat;
