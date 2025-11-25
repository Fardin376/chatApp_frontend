import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../api/roomService';
import { authService } from '../api/authService';
import styles from './Rooms.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Chat Rooms</h1>
          <button
            className={styles.backButton}
            onClick={() => navigate('/chat')}
          >
            Back to Chat
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.createSection}>
          <h2 className={styles.sectionTitle}>Create New Room</h2>
          <form onSubmit={handleCreateRoom} className={styles.createForm}>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              className={styles.input}
              disabled={loading}
            />
            <button
              type="submit"
              className={styles.createButton}
              disabled={loading || !newRoomName.trim()}
            >
              Create Room
            </button>
          </form>
        </div>

        <div className={styles.roomsSection}>
          <h2 className={styles.sectionTitle}>Available Rooms</h2>
          {loading && rooms.length === 0 ? (
            <div className={styles.loading}>Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className={styles.emptyState}>
              No rooms available. Create one to get started!
            </div>
          ) : (
            <div className={styles.roomsList}>
              {rooms.map((room) => (
                <div key={room.roomId} className={styles.roomCard}>
                  {editingRoom === room.roomId ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editRoomName}
                        onChange={(e) => setEditRoomName(e.target.value)}
                        className={styles.input}
                        disabled={loading}
                      />
                      <div className={styles.editActions}>
                        <button
                          onClick={() => handleUpdateRoom(room.roomId)}
                          className={styles.saveButton}
                          disabled={loading || !editRoomName.trim()}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className={styles.cancelButton}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.roomInfo}>
                        <h3 className={styles.roomName}>{room.roomName}</h3>
                      </div>
                      <div className={styles.roomActions}>
                        <button
                          onClick={() => openRoom(room.roomId)}
                          className={styles.openButton}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => startEditing(room)}
                          className={styles.editButton}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.roomId)}
                          className={styles.deleteButton}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Rooms;
