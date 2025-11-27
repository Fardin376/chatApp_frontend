import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../api/authService';
import { userService } from '../api/userService';
import { roomService } from '../api/roomService';
import { conversationService } from '../api/conversationService';
import { messageService } from '../api/messageService';
import { friendService } from '../api/friendService';
import firestoreService from '../api/firestoreService';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Fab,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  ExitToApp as LogoutIcon,
  Refresh as RefreshIcon,
  ChatBubbleOutline as ChatIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

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
  const [unreadCounts, setUnreadCounts] = useState({
    rooms: {},
    conversations: {},
    total: 0,
  });
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const roomId = searchParams.get('roomId');
  const conversationId = searchParams.get('conversationId');

  // Initialize user and load data on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (!currentUser?.id) return;

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

    // Fetch rooms from API
    const fetchRooms = async () => {
      try {
        const roomsData = await roomService.getAllRooms();
        console.log('🏠 Fetched rooms from API:', roomsData);
        setRooms(roomsData.map((room) => ({ ...room, type: 'room' })));
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      }
    };

    // Fetch conversations from friends list
    const fetchConversationsFromFriends = async (allUsers) => {
      try {
        const friendsList = await friendService.getFriendsList(currentUser.id);
        console.log('👥 Fetched friends list:', friendsList);
        // Create conversation entries for each friend
        const convos = (friendsList.friends || []).map((friendId) => {
          const friend = allUsers.find((u) => u.id === friendId);
          // Sort user IDs alphabetically to ensure consistent conversation ID
          const sortedIds = [currentUser.id, friendId].sort();
          return {
            conversationId: `${sortedIds[0]}_${sortedIds[1]}`,
            participants: [currentUser.id, friendId],
            friendName: friend?.name || 'Unknown User',
            friendId: friendId,
            lastMessage: null,
            type: 'conversation',
          };
        });
        console.log('💬 Created conversations:', convos);
        setConversations(convos);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    // Setup real-time listeners (for updates only)
    const setupRealtimeListeners = async () => {
      try {
        // Subscribe to rooms with real-time updates
        await firestoreService.subscribeToRooms(
          currentUser.id,
          (realtimeRooms) => {
            console.log('📡 Real-time rooms update:', realtimeRooms);
            if (realtimeRooms.length > 0) {
              setRooms(
                realtimeRooms.map((room) => ({ ...room, type: 'room' }))
              );
            }
          },
          (error) => {
            console.error('❌ Rooms subscription error:', error);
          }
        );

        // Subscribe to conversations with real-time updates
        await firestoreService.subscribeToConversations(
          currentUser.id,
          (realtimeConversations) => {
            console.log(
              '📡 Real-time conversations update:',
              realtimeConversations
            );
            if (realtimeConversations.length > 0) {
              setConversations(
                realtimeConversations.map((conv) => ({
                  ...conv,
                  type: 'conversation',
                }))
              );
            }
          },
          (error) => {
            console.error('❌ Conversations subscription error:', error);
          }
        );

        // Subscribe to friend requests
        await firestoreService.subscribeToFriendRequests(
          currentUser.id,
          (requests) => {
            console.log('📡 Real-time friend requests:', requests);
            setFriendRequests(requests);
          },
          (error) => {
            console.error('❌ Friend requests subscription error:', error);
          }
        );

        // Subscribe to unread message counts
        await firestoreService.subscribeToUnreadCounts(
          currentUser.id,
          (counts) => {
            console.log('📡 Real-time unread counts:', counts);
            setUnreadCounts(counts);
          },
          (error) => {
            console.error('❌ Unread counts subscription error:', error);
          }
        );
      } catch (error) {
        console.error('❌ Failed to setup real-time listeners:', error);
      }
    };

    // Initialize data in correct order
    const initializeData = async () => {
      const allUsers = await fetchUsers();
      await fetchRooms();
      await fetchConversationsFromFriends(allUsers);
      await setupRealtimeListeners();
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
      // Allow any file type - no restrictions
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
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
          document: documentData ? documentData.filename : null,
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

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?'))
      return;

    try {
      await messageService.deleteMessage(messageId);
      // Message will be removed from UI via real-time listener
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError('Failed to delete message');
    }
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
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Chats
          </Typography>
          <IconButton onClick={() => setSidebarOpen(false)} size="small">
            <MenuIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* Rooms Section */}
        {rooms.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}
            >
              ROOMS
            </Typography>
            <List sx={{ py: 0 }}>
              {rooms.map((room) => (
                <ListItemButton
                  key={room.roomId}
                  selected={roomId === room.roomId}
                  onClick={() => navigate(`/chat?roomId=${room.roomId}`)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                  }}
                >
                  <Badge
                    badgeContent={unreadCounts.rooms[room.roomId] || 0}
                    color="error"
                    sx={{ mr: 2 }}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <GroupIcon />
                    </Avatar>
                  </Badge>
                  <ListItemText
                    primary={room.roomName}
                    primaryTypographyProps={{
                      fontWeight: unreadCounts.rooms[room.roomId] ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}

        {/* Conversations Section */}
        {conversations.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}
            >
              PRIVATE CHATS
            </Typography>
            <List sx={{ py: 0 }}>
              {conversations.map((conv) => (
                <ListItemButton
                  key={conv.conversationId}
                  selected={conversationId === conv.conversationId}
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
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                  }}
                >
                  <Badge
                    badgeContent={
                      unreadCounts.conversations[conv.conversationId] || 0
                    }
                    color="error"
                    sx={{ mr: 2 }}
                  >
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {conv.friendName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </Badge>
                  <ListItemText
                    primary={conv.friendName}
                    primaryTypographyProps={{
                      fontWeight: unreadCounts.conversations[
                        conv.conversationId
                      ]
                        ? 600
                        : 400,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}

        {rooms.length === 0 && conversations.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">No chats yet</Typography>
            <Typography variant="caption">
              Start a conversation or join a room
            </Typography>
          </Box>
        )}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header AppBar */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            {!sidebarOpen && (
              <IconButton
                edge="start"
                onClick={() => setSidebarOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {getChatTitle()}
            </Typography>

            {(roomId || conversationId) && (
              <IconButton
                onClick={handleManualRefresh}
                disabled={loading}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            )}

            <Button
              startIcon={<GroupIcon />}
              onClick={() => navigate('/rooms')}
              sx={{
                mx: 0.5,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s',
                },
              }}
            >
              Rooms
            </Button>
            <Button
              startIcon={<ChatIcon />}
              onClick={() => navigate('/conversations')}
              sx={{
                mx: 0.5,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s',
                },
              }}
            >
              Conversations
            </Button>
            <Badge badgeContent={friendRequests.length} color="error">
              <Button
                startIcon={<PersonIcon />}
                onClick={() => navigate('/friends')}
                sx={{
                  mx: 0.5,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s',
                  },
                }}
              >
                Friends
              </Button>
            </Badge>

            <Chip
              label={user?.name || 'User'}
              avatar={
                <Avatar>{user?.name?.charAt(0).toUpperCase() || 'U'}</Avatar>
              }
              sx={{ mx: 1 }}
            />
            <IconButton onClick={handleLogout} color="error">
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
              }}
            >
              <ChatIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6">No messages yet</Typography>
              <Typography variant="body2">Start the conversation!</Typography>
            </Box>
          ) : (
            <Box>
              {messages.map((msg, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    maxWidth: '70%',
                    ml: msg.senderId === user?.id ? 'auto' : 0,
                    mr: msg.senderId === user?.id ? 0 : 'auto',
                    bgcolor:
                      msg.senderId === user?.id ? 'primary.light' : 'white',
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="text.primary"
                      >
                        {msg.sender || getUserName(msg.senderId)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {msg.timestamp
                          ? new Date(msg.timestamp * 1000).toLocaleTimeString()
                          : new Date().toLocaleTimeString()}
                      </Typography>
                    </Box>
                    {msg.senderId === user?.id && msg.messageId && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteMessage(msg.messageId)}
                        sx={{
                          '&:hover': {
                            transform: 'scale(1.1)',
                            transition: 'all 0.2s',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Typography variant="body1">
                    {msg.message || msg.text}
                  </Typography>
                  {msg.document && (
                    <Button
                      size="small"
                      startIcon={<AttachFileIcon />}
                      href={msg.document}
                      target="_blank"
                      sx={{ mt: 1 }}
                    >
                      View Document
                    </Button>
                  )}
                </Paper>
              ))}
              <div ref={messagesEndRef} />
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <Chip
                  label={`${typingUsers
                    .map((userId) => getUserName(userId))
                    .join(', ')} ${
                    typingUsers.length === 1 ? 'is' : 'are'
                  } typing...`}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
          >
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="fileInput">
              <IconButton
                component="span"
                color="primary"
                sx={{
                  '&:hover': {
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s',
                  },
                }}
              >
                <AttachFileIcon />
              </IconButton>
            </label>
            {attachedDocument && (
              <Chip
                label={attachedDocument}
                onDelete={() => {
                  setAttachedDocument(null);
                  setDocumentFile(null);
                  const fileInput = document.getElementById('fileInput');
                  if (fileInput) fileInput.value = '';
                }}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            <TextField
              fullWidth
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              disabled={loading}
            />
            <IconButton
              type="submit"
              color="primary"
              disabled={!newMessage.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.1)',
                  transition: 'all 0.2s',
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default Chat;
