import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../api/roomService';
import { authService } from '../api/authService';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  CardActions,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Group as GroupIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Chat as ChatIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAllRooms();
      setRooms(data);
      setError('');
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      await roomService.createRoom(newRoomName, currentUser.id);
      setNewRoomName('');
      fetchRooms();
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async (roomId) => {
    if (!editRoomName.trim()) return;

    try {
      setLoading(true);
      await roomService.updateRoom(roomId, editRoomName);
      setEditingRoom(null);
      setEditRoomName('');
      fetchRooms();
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      setLoading(true);
      await roomService.deleteRoom(roomId);
      fetchRooms();
      setError('');
    } catch (err) {
      setError(err.error || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (room) => {
    setEditingRoom(room.roomId);
    setEditRoomName(room.roomName);
  };

  const cancelEditing = () => {
    setEditingRoom(null);
    setEditRoomName('');
  };

  const openRoom = (roomId) => {
    navigate(`/chat?roomId=${roomId}`);
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
          <GroupIcon
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
            Chat Rooms
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

        {/* Create Room Section */}
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
            <GroupIcon
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
              Create New Room
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleCreateRoom}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <TextField
              fullWidth
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              variant="outlined"
              disabled={loading}
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth={{ xs: true, sm: false }}
              disabled={loading || !newRoomName.trim()}
              sx={{
                px: { xs: 2, sm: 3, md: 4 },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s',
                },
              }}
            >
              Create Room
            </Button>
          </Box>
        </Paper>

        {/* Rooms List Section */}
        <Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Available Rooms
          </Typography>
          {loading && rooms.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : rooms.length === 0 ? (
            <Paper
              elevation={1}
              sx={{
                p: { xs: 3, sm: 4, md: 6 },
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <GroupIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No rooms available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create one to get started!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              {rooms.map((room) => (
                <Grid item xs={12} sm={6} md={4} key={room.roomId}>
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
                    {editingRoom === room.roomId ? (
                      <CardContent>
                        <TextField
                          fullWidth
                          value={editRoomName}
                          onChange={(e) => setEditRoomName(e.target.value)}
                          variant="outlined"
                          disabled={loading}
                          autoFocus
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => handleUpdateRoom(room.roomId)}
                            disabled={loading || !editRoomName.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </CardContent>
                    ) : (
                      <>
                        <CardContent
                          sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <GroupIcon
                              sx={{
                                mr: { xs: 0.5, sm: 1 },
                                color: 'primary.main',
                                fontSize: { xs: 20, sm: 24 },
                              }}
                            />
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                fontSize: {
                                  xs: '1rem',
                                  sm: '1.125rem',
                                  md: '1.25rem',
                                },
                              }}
                            >
                              {room.roomName}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions
                          sx={{
                            p: { xs: 1, sm: 1.5, md: 2 },
                            pt: 0,
                            gap: { xs: 0.5, sm: 1 },
                          }}
                        >
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={
                              <ChatIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            }
                            onClick={() => openRoom(room.roomId)}
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              '&:hover': {
                                transform: 'scale(1.02)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            Open
                          </Button>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => startEditing(room)}
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteRoom(room.roomId)}
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </CardActions>
                      </>
                    )}
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

export default Rooms;
