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
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/chat')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <GroupIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Chat Rooms
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Create Room Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold">
              Create New Room
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleCreateRoom}
            sx={{ display: 'flex', gap: 2 }}
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
              disabled={loading || !newRoomName.trim()}
              sx={{
                px: 4,
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
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
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
                p: 6,
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
            <Grid container spacing={3}>
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
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" fontWeight="bold">
                              {room.roomName}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<ChatIcon />}
                            onClick={() => openRoom(room.roomId)}
                            sx={{
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
                            onClick={() => startEditing(room)}
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteRoom(room.roomId)}
                            disabled={loading}
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s',
                              },
                            }}
                          >
                            <DeleteIcon />
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
