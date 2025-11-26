import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationService } from '../api/conversationService';
import { userService } from '../api/userService';
import { authService } from '../api/authService';
import styles from './Conversations.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Conversations</h1>
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

        <div className={styles.startSection}>
          <h2 className={styles.sectionTitle}>Start New Conversation</h2>
          <form onSubmit={handleStartConversation} className={styles.startForm}>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className={styles.select}
              disabled={loading}
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={styles.startButton}
              disabled={loading || !selectedUser}
            >
              Start Chat
            </button>
          </form>
        </div>

        <div className={styles.usersSection}>
          <h2 className={styles.sectionTitle}>Available Users</h2>
          {loading && users.length === 0 ? (
            <div className={styles.loading}>Loading users...</div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>No other users available</div>
          ) : (
            <div className={styles.usersList}>
              {users.map((user) => (
                <div key={user.id} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userDetails}>
                      <h3 className={styles.userName}>{user.name}</h3>
                      <p className={styles.userEmail}>{user.email}</p>
                    </div>
                  </div>
                  <button
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
                        setError(err.error || 'Failed to start conversation');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className={styles.chatButton}
                    disabled={loading}
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Conversations;
