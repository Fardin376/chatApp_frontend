import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationService } from '../api/conversationService';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ChatBubbleOutline as ChatIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

function Conversations() {
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      const currentUser = authService.getCurrentUser();
      // Filter out current user
      const filteredUsers = data.filter((user) => user.id !== currentUser.id);
      setUsers(filteredUsers);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      const response = await conversationService.createConversation(
        currentUser.id,
        selectedUser
      );

      // Navigate to chat with this conversation
      navigate(`/chat?conversationId=${response.conversationId}`);
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
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
          <ChatIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Conversations
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Start Conversation Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ChatIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold">
              Start New Conversation
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleStartConversation}
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
                {users.map((user) => (
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
              Start Chat
            </Button>
          </Box>
        </Paper>

        {/* Users List Section */}
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
            Available Users
          </Typography>
          {loading && users.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
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
                No other users available
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {users.map((user) => (
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
                          bgcolor: 'secondary.main',
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
                        startIcon={<ChatIcon />}
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const currentUser = authService.getCurrentUser();
                            const response =
                              await conversationService.createConversation(
                                currentUser.id,
                                user.id
                              );
                            navigate(
                              `/chat?conversationId=${response.conversationId}`
                            );
                          } catch (err) {
                            setError(
                              err.error || 'Failed to start conversation'
                            );
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
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
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Conversations;
