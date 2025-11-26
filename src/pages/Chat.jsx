import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../api/authService';
import { userService } from '../api/userService';
import { roomService } from '../api/roomService';
import { conversationService } from '../api/conversationService';
import { messageService } from '../api/messageService';
import { friendService } from '../api/friendService';
import firestoreService from '../api/firestoreService';
import styles from './Chat.module.css';

function Chat({ setIsAuthenticated }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [attachedDocument, setAttachedDocument] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const roomId = searchParams.get('roomId');
  const conversationId = searchParams.get('conversationId');

  // Initialize user and load data on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Fetch all users first (needed for name lookups)
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsers();
        setUsers(response);
        return response;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    };

    // Fetch all rooms with latest message
    const fetchRooms = async () => {
      try {
        const roomsData = await roomService.getAllRooms();
        const roomsWithMessages = await Promise.all(
          roomsData.map(async (room) => {
            try {
              const msgs = await roomService.getRoomMessages(room.roomId);
              const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
              return { ...room, lastMessage: lastMsg, type: 'room' };
            } catch {
              return { ...room, lastMessage: null, type: 'room' };
            }
          })
        );
        setRooms(roomsWithMessages);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      }
    };

    // Fetch conversations from friends list (requires users to be loaded first)
    const fetchConversationsFromFriends = async (allUsers) => {
      try {
        const friendsList = await friendService.getFriendsList(currentUser.id);
        // Create conversation entries for each friend
        const convos = (friendsList.friends || []).map((friendId) => {
          const friend = allUsers.find((u) => u.id === friendId);
          return {
            conversationId: `${currentUser.id}_${friendId}`,
            participants: [currentUser.id, friendId],
            friendName: friend?.name || 'Unknown User',
            friendId: friendId,
            lastMessage: null,
            type: 'conversation',
          };
        });
        setConversations(convos);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    // Initialize data in correct order
    const initializeData = async () => {
      const allUsers = await fetchUsers();
      await fetchRooms();
      if (currentUser) {
        await fetchConversationsFromFriends(allUsers);
      }
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      firestoreService.unsubscribeAll();
    };
  }, []);

  // Subscribe to real-time messages when room/conversation changes
  useEffect(() => {
    if (!user?.id) return;

    setMessages([]);
    setLoading(true);

    let unsubscribeMessages;
    let unsubscribeTyping;
    let isMounted = true;

    const setupSubscriptions = async () => {
      try {
        if (roomId) {
          console.log('📡 Subscribing to room messages:', roomId);
          // Subscribe to room messages
          unsubscribeMessages = await firestoreService.subscribeToRoomMessages(
            roomId,
            (messages) => {
              if (isMounted) {
                console.log('✅ Real-time room messages:', messages);
                setMessages(messages);
                setLoading(false);
                setError('');
              }
            },
            (error) => {
              if (isMounted) {
                console.error('❌ Room subscription error:', error);
                setError('Failed to load messages');
                setLoading(false);
              }
            }
          );

          // Subscribe to typing indicators
          unsubscribeTyping = await firestoreService.subscribeToRoomTyping(
            roomId,
            user.id,
            (users) => {
              if (isMounted) {
                setTypingUsers(users);
              }
            }
          );
        } else if (conversationId) {
          console.log(
            '📡 Subscribing to conversation messages:',
            conversationId
          );
          // Subscribe to conversation messages
          unsubscribeMessages =
            await firestoreService.subscribeToConversationMessages(
              conversationId,
              (messages) => {
                if (isMounted) {
                  console.log('✅ Real-time conversation messages:', messages);
                  setMessages(messages);
                  setLoading(false);
                  setError('');
                }
              },
              (error) => {
                if (isMounted) {
                  console.error('❌ Conversation subscription error:', error);
                  setError('Failed to load messages');
                  setLoading(false);
                }
              }
            );

          // Subscribe to typing indicators
          unsubscribeTyping =
            await firestoreService.subscribeToConversationTyping(
              conversationId,
              user.id,
              (users) => {
                if (isMounted) {
                  setTypingUsers(users);
                }
              }
            );
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Subscription setup error:', error);
          setError('Failed to setup real-time updates');
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions when room/conversation changes
    return () => {
      isMounted = false;
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
      if (unsubscribeTyping) {
        unsubscribeTyping();
      }
      setTypingUsers([]);
    };
  }, [roomId, conversationId, user?.id]);

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
        setError('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setDocumentFile(file);
      setAttachedDocument(file.name);
      setError('');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Send message via API if in a room or conversation
      if (roomId || conversationId) {
        let documentData = null;

        // Convert file to base64 if exists
        if (documentFile) {
          const reader = new FileReader();
          documentData = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({
                filename: documentFile.name,
                data: base64,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(documentFile);
          });
        }

        console.log('Sending message to:', {
          roomId,
          conversationId,
          userId: user.id,
        });
        const sendResult = await messageService.sendMessage(
          user.id,
          newMessage,
          roomId,
          conversationId,
          documentData
        );
        console.log('Message sent successfully:', sendResult);

        // Firestore onSnapshot will automatically update messages in real-time
        // No need for manual update - just clear the input
      }

      setNewMessage('');
      setAttachedDocument(null);
      setDocumentFile(null);
      // Reset file input
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.error || 'Failed to send message. Please try again.');
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
    if (roomId) return `Room Chat (ID: ${roomId})`;
    if (conversationId) return `Private Chat (ID: ${conversationId})`;
    return 'Chat App';
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unknown User';
    const foundUser = users.find((u) => u.id === userId);
    return foundUser ? foundUser.name : userId;
  };

  // Manual refresh function for debugging
  const handleManualRefresh = async () => {
    if (conversationId) {
      try {
        setLoading(true);
        console.log('Manual refresh - Conversation ID:', conversationId);
        const data = await conversationService.getConversationMessages(
          conversationId
        );
        console.log('Manual refresh - Messages:', data);
        setMessages(data);
        setError('');
      } catch (error) {
        console.error('Manual refresh failed:', error);
        setError(`Refresh failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else if (roomId) {
      try {
        setLoading(true);
        const data = await roomService.getRoomMessages(roomId);
        setMessages(data);
        setError('');
      } catch (error) {
        setError(`Refresh failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          !sidebarOpen ? styles.sidebarClosed : ''
        }`}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Chats</h2>
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        {sidebarOpen && (
          <div className={styles.sidebarContent}>
            {/* Rooms Section */}
            {rooms.length > 0 && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarSectionTitle}>Rooms</h3>
                {rooms.map((room) => (
                  <div
                    key={room.roomId}
                    className={`${styles.chatItem} ${
                      roomId === room.roomId ? styles.chatItemActive : ''
                    }`}
                    onClick={() => navigate(`/chat?roomId=${room.roomId}`)}
                  >
                    <div className={styles.chatItemAvatar}>🏠</div>
                    <div className={styles.chatItemContent}>
                      <div className={styles.chatItemName}>{room.roomName}</div>
                      {room.lastMessage && (
                        <div className={styles.chatItemMessage}>
                          {room.lastMessage.message?.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Conversations Section */}
            {conversations.length > 0 && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarSectionTitle}>Private Chats</h3>
                {conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    className={`${styles.chatItem} ${
                      conversationId === conv.conversationId
                        ? styles.chatItemActive
                        : ''
                    }`}
                    onClick={async () => {
                      try {
                        const response =
                          await conversationService.createConversation(
                            user.id,
                            conv.friendId
                          );
                        navigate(
                          `/chat?conversationId=${response.conversationId}`
                        );
                      } catch (error) {
                        console.error('Failed to open conversation:', error);
                      }
                    }}
                  >
                    <div className={styles.chatItemAvatar}>
                      {conv.friendName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.chatItemContent}>
                      <div className={styles.chatItemName}>
                        {conv.friendName}
                      </div>
                      {conv.lastMessage && (
                        <div className={styles.chatItemMessage}>
                          {conv.lastMessage.message?.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rooms.length === 0 && conversations.length === 0 && (
              <div className={styles.sidebarEmpty}>
                <p>No chats yet</p>
                <p className={styles.sidebarEmptyHint}>
                  Start a conversation or join a room
                </p>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>{getChatTitle()}</h1>
            <div className={styles.headerActions}>
              {(roomId || conversationId) && (
                <button
                  onClick={handleManualRefresh}
                  className={styles.refreshButton}
                  disabled={loading}
                  title="Refresh messages"
                >
                  🔄
                </button>
              )}
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
          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button
                onClick={() => setError('')}
                className={styles.closeError}
              >
                ×
              </button>
            </div>
          )}
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
                      {msg.timestamp
                        ? new Date(msg.timestamp * 1000).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.messageText}>
                    {msg.message || msg.text}
                  </div>
                  {msg.document && (
                    <a
                      href={msg.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.messageDocument}
                    >
                      📄 View Document
                    </a>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className={styles.typingIndicator}>
                <span className={styles.typingText}>
                  {typingUsers.map((userId) => getUserName(userId)).join(', ')}{' '}
                  {typingUsers.length === 1 ? 'is' : 'are'} typing
                </span>
                <span className={styles.typingDots}>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            )}
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
            {attachedDocument && (
              <span className={styles.fileName}>📄 {attachedDocument}</span>
            )}
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
    </div>
  );
}

export default Chat;
