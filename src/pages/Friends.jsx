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
    fetchFriendRequests();
    fetchUsers();
  }, []);

  const fetchFriends = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const response = await friendService.getFriendsList(currentUser.id);
      setFriends(response.friends || []);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const response = await friendService.getFriendRequests(currentUser.id);
      setFriendRequests(response.incomingRequests || []);
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

  const getUserInfo = (userId) => {
    return users.find((u) => u.id === userId) || { name: 'Unknown', email: '' };
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header AppBar */}
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/chat')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <PersonIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Friends
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tabs Navigation */}
        <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            centered
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transition: 'all 0.2s',
                },
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  My Friends ({friends.length})
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
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
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
                {friends.map((friendId) => {
                  const friend = getUserInfo(friendId);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={friendId}>
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
                        <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: 'primary.main',
                              margin: '0 auto',
                              mb: 2,
                              fontSize: 28,
                            }}
                          >
                            {friend.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            gutterBottom
                          >
                            {friend.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {friend.email}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<ChatIcon />}
                            onClick={() =>
                              navigate(`/conversations?userId=${friendId}`)
                            }
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            Chat
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
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
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
                {friendRequests.map((requestId) => {
                  const requester = getUserInfo(requestId);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={requestId}>
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
                        <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: 'secondary.main',
                              margin: '0 auto',
                              mb: 2,
                              fontSize: 28,
                            }}
                          >
                            {requester.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            gutterBottom
                          >
                            {requester.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {requester.email}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleAcceptRequest(requestId)}
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            Accept
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
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonAddIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight="bold">
                  Send Friend Request
                </Typography>
              </Box>
              <Box
                component="form"
                onSubmit={handleSendRequest}
                sx={{ display: 'flex', gap: 2 }}
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
                  sx={{
                    px: 4,
                    minWidth: 150,
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
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
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
                      <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            bgcolor: 'success.main',
                            margin: '0 auto',
                            mb: 2,
                            fontSize: 28,
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<PersonAddIcon />}
                          onClick={() => {
                            setSelectedUser(user.id);
                            handleSendRequest({ preventDefault: () => {} });
                          }}
                          disabled={loading}
                          sx={{
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
