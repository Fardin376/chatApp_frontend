import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../api/friendService';
import { userService } from '../api/userService';
import { authService } from '../api/authService';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  CardActions,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  ChatBubbleOutline as ChatIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Notifications as NotificationsIcon,
  PersonRemove as PersonRemoveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

function Friends() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'add'
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
    fetchUsers();

    // Set up polling for friend requests (checks every 3 seconds)
    const currentUser = authService.getCurrentUser();
    const stopPolling = friendService.startFriendRequestsPolling(
      currentUser.id,
      (requests) => {
        setFriendRequests(requests);
      }
    );

    // Cleanup polling on unmount
    return () => {
      if (stopPolling) {
        stopPolling();
      }
    };
  }, []);

  const fetchFriends = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const response = await friendService.getFriendsList(currentUser.id);
      // Response is now an array of friend objects: [{id, name, email}, ...]
      setFriends(response || []);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const response = await friendService.getFriendRequests(currentUser.id);
      // Response is now an array of request objects: [{id, fromId, name, email}, ...]
      setFriendRequests(response || []);
    } catch (err) {
      console.error('Failed to fetch friend requests:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      const currentUser = authService.getCurrentUser();
      const filteredUsers = data.filter((user) => user.id !== currentUser.id);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      await friendService.sendFriendRequest(currentUser.id, selectedUser);
      setSelectedUser('');
      setError('');
      alert('Friend request sent!');
    } catch (err) {
      setError(err.error || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (fromId) => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      await friendService.acceptFriendRequest(currentUser.id, fromId);
      fetchFriends();
      fetchFriendRequests();
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (fromUser) => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      await friendService.rejectFriendRequest(currentUser.id, fromUser);
      fetchFriendRequests();
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to reject friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      await friendService.removeFriend(currentUser.id, friendId);
      fetchFriends();
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = (userId) => {
    return users.find((u) => u.id === userId) || { name: 'Unknown', email: '' };
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header AppBar */}
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/chat')}
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <PersonIcon
            sx={{
              mr: { xs: 1, sm: 2 },
              fontSize: { xs: 28, sm: 32 },
              display: { xs: 'none', sm: 'block' },
            }}
          />
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            Friends
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs Navigation */}
        <Paper elevation={2} sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 80, sm: 120 },
                px: { xs: 1, sm: 2 },
                '&:hover': {
                  bgcolor: 'action.hover',
                  transition: 'all 0.2s',
                },
              },
            }}
          >
            <Tab
              label={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1 },
                  }}
                >
                  <PersonIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                  <Box
                    component="span"
                    sx={{ display: { xs: 'none', sm: 'inline' } }}
                  >
                    My Friends
                  </Box>
                  <Box
                    component="span"
                    sx={{ display: { xs: 'inline', sm: 'none' } }}
                  >
                    Friends
                  </Box>
                  ({friends.length})
                </Box>
              }
              value="friends"
            />
            <Tab
              label={
                <Badge badgeContent={friendRequests.length} color="error">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsIcon />
                    Requests
                  </Box>
                </Badge>
              }
              value="requests"
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon />
                  Add Friends
                </Box>
              }
              value="add"
            />
          </Tabs>
        </Paper>

        {activeTab === 'friends' && (
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              My Friends
            </Typography>
            {friends.length === 0 ? (
              <Paper
                elevation={1}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <PersonIcon
                  sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No friends yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Send friend requests to get started!
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {friends.map((friend) => {
                  // friend is now an object: {id, name, email}
                  return (
                    <Grid item xs={12} sm={6} md={4} key={friend.id}>
                      <Card
                        elevation={2}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            flexGrow: 1,
                            textAlign: 'center',
                            p: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: { xs: 48, sm: 56, md: 64 },
                              height: { xs: 48, sm: 56, md: 64 },
                              bgcolor: 'primary.main',
                              margin: '0 auto',
                              mb: { xs: 1, sm: 1.5, md: 2 },
                              fontSize: { xs: 20, sm: 24, md: 28 },
                            }}
                          >
                            {friend.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            gutterBottom
                            sx={{
                              fontSize: {
                                xs: '1rem',
                                sm: '1.125rem',
                                md: '1.25rem',
                              },
                            }}
                          >
                            {friend.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              wordBreak: 'break-word',
                            }}
                          >
                            {friend.email}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={
                              <ChatIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            }
                            onClick={() =>
                              navigate(`/conversations?userId=${friend.id}`)
                            }
                            fullWidth
                            size="small"
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            Chat
                          </Button>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveFriend(friend.id)}
                            disabled={loading}
                            size="small"
                            sx={{
                              display: { xs: 'none', sm: 'inline-flex' },
                              '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            <PersonRemoveIcon />
                          </IconButton>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            fullWidth
                            startIcon={
                              <PersonRemoveIcon
                                sx={{ fontSize: { xs: 16, sm: 20 } }}
                              />
                            }
                            onClick={() => handleRemoveFriend(friend.id)}
                            disabled={loading}
                            sx={{
                              display: { xs: 'flex', sm: 'none' },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            Remove
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {activeTab === 'requests' && (
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              Friend Requests
            </Typography>
            {friendRequests.length === 0 ? (
              <Paper
                elevation={1}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <NotificationsIcon
                  sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No pending friend requests
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {friendRequests.map((request) => {
                  // request is now an object: {id, fromId, name, email}
                  return (
                    <Grid item xs={12} sm={6} md={4} key={request.id}>
                      <Card
                        elevation={2}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            flexGrow: 1,
                            textAlign: 'center',
                            p: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: { xs: 48, sm: 56, md: 64 },
                              height: { xs: 48, sm: 56, md: 64 },
                              bgcolor: 'secondary.main',
                              margin: '0 auto',
                              mb: { xs: 1, sm: 1.5, md: 2 },
                              fontSize: { xs: 20, sm: 24, md: 28 },
                            }}
                          >
                            {request.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            gutterBottom
                            sx={{
                              fontSize: {
                                xs: '1rem',
                                sm: '1.125rem',
                                md: '1.25rem',
                              },
                            }}
                          >
                            {request.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              wordBreak: 'break-word',
                            }}
                          >
                            {request.email}
                          </Typography>
                        </CardContent>
                        <CardActions
                          sx={{
                            p: { xs: 1, sm: 1.5, md: 2 },
                            pt: 0,
                            gap: { xs: 0.5, sm: 1 },
                            flexDirection: { xs: 'column', sm: 'row' },
                          }}
                        >
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={
                              <CheckIcon
                                sx={{ fontSize: { xs: 16, sm: 20 } }}
                              />
                            }
                            onClick={() => handleAcceptRequest(request.fromId)}
                            disabled={loading}
                            fullWidth
                            size="small"
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={
                              <CloseIcon
                                sx={{ fontSize: { xs: 16, sm: 20 } }}
                              />
                            }
                            onClick={() => handleRejectRequest(request.fromId)}
                            disabled={loading}
                            fullWidth
                            size="small"
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            Reject
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {activeTab === 'add' && (
          <Box>
            {/* Send Friend Request Section */}
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                mb: { xs: 2, sm: 3, md: 4 },
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <PersonAddIcon
                  sx={{
                    mr: { xs: 0.5, sm: 1 },
                    color: 'primary.main',
                    fontSize: { xs: 20, sm: 24 },
                  }}
                />
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '1.125rem', sm: '1.5rem' } }}
                >
                  Send Friend Request
                </Typography>
              </Box>
              <Box
                component="form"
                onSubmit={handleSendRequest}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <FormControl fullWidth disabled={loading}>
                  <InputLabel id="user-select-label">Select a user</InputLabel>
                  <Select
                    labelId="user-select-label"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label="Select a user"
                  >
                    <MenuItem value="">
                      <em>Select a user...</em>
                    </MenuItem>
                    {users
                      .filter((user) => !friends.includes(user.id))
                      .map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !selectedUser}
                  fullWidth={{ xs: true, sm: false }}
                  sx={{
                    px: { xs: 2, sm: 3, md: 4 },
                    minWidth: { sm: 150 },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s',
                    },
                  }}
                >
                  Send Request
                </Button>
              </Box>
            </Paper>

            {/* All Users List */}
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              All Users
            </Typography>
            <Grid container spacing={3}>
              {users
                .filter((user) => !friends.includes(user.id))
                .map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <Card
                      elevation={2}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          flexGrow: 1,
                          textAlign: 'center',
                          p: { xs: 1.5, sm: 2 },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: { xs: 48, sm: 56, md: 64 },
                            height: { xs: 48, sm: 56, md: 64 },
                            bgcolor: 'success.main',
                            margin: '0 auto',
                            mb: { xs: 1, sm: 1.5, md: 2 },
                            fontSize: { xs: 20, sm: 24, md: 28 },
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          gutterBottom
                          sx={{
                            fontSize: {
                              xs: '1rem',
                              sm: '1.125rem',
                              md: '1.25rem',
                            },
                          }}
                        >
                          {user.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            wordBreak: 'break-word',
                          }}
                        >
                          {user.email}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: { xs: 1, sm: 1.5, md: 2 }, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          startIcon={
                            <PersonAddIcon
                              sx={{ fontSize: { xs: 16, sm: 20 } }}
                            />
                          }
                          onClick={() => {
                            setSelectedUser(user.id);
                            handleSendRequest({ preventDefault: () => {} });
                          }}
                          disabled={loading}
                          sx={{
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            '&:hover': {
                              transform: 'scale(1.02)',
                              transition: 'all 0.2s',
                            },
                          }}
                        >
                          Add Friend
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default Friends;
