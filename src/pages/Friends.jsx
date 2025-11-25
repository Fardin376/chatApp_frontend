import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendService } from '../api/friendService';
import { userService } from '../api/userService';
import { authService } from '../api/authService';
import styles from './Friends.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Friends</h1>
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

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === 'friends' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('friends')}
          >
            My Friends ({friends.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === 'requests' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('requests')}
          >
            Requests ({friendRequests.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === 'add' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('add')}
          >
            Add Friends
          </button>
        </div>

        {activeTab === 'friends' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>My Friends</h2>
            {friends.length === 0 ? (
              <div className={styles.emptyState}>
                No friends yet. Send friend requests to get started!
              </div>
            ) : (
              <div className={styles.friendsList}>
                {friends.map((friendId) => {
                  const friend = getUserInfo(friendId);
                  return (
                    <div key={friendId} className={styles.friendCard}>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendAvatar}>
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.friendDetails}>
                          <h3 className={styles.friendName}>{friend.name}</h3>
                          <p className={styles.friendEmail}>{friend.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/conversations?userId=${friendId}`)
                        }
                        className={styles.chatButton}
                      >
                        Chat
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Friend Requests</h2>
            {friendRequests.length === 0 ? (
              <div className={styles.emptyState}>
                No pending friend requests
              </div>
            ) : (
              <div className={styles.friendsList}>
                {friendRequests.map((requestId) => {
                  const requester = getUserInfo(requestId);
                  return (
                    <div key={requestId} className={styles.friendCard}>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendAvatar}>
                          {requester.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.friendDetails}>
                          <h3 className={styles.friendName}>
                            {requester.name}
                          </h3>
                          <p className={styles.friendEmail}>
                            {requester.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptRequest(requestId)}
                        className={styles.acceptButton}
                        disabled={loading}
                      >
                        Accept
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Send Friend Request</h2>
            <form onSubmit={handleSendRequest} className={styles.addForm}>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={styles.select}
                disabled={loading}
              >
                <option value="">Select a user...</option>
                {users
                  .filter((user) => !friends.includes(user.id))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                className={styles.sendButton}
                disabled={loading || !selectedUser}
              >
                Send Request
              </button>
            </form>

            <div className={styles.usersSection}>
              <h3 className={styles.subsectionTitle}>All Users</h3>
              <div className={styles.friendsList}>
                {users
                  .filter((user) => !friends.includes(user.id))
                  .map((user) => (
                    <div key={user.id} className={styles.friendCard}>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendAvatar}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.friendDetails}>
                          <h3 className={styles.friendName}>{user.name}</h3>
                          <p className={styles.friendEmail}>{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(user.id);
                          handleSendRequest({ preventDefault: () => {} });
                        }}
                        className={styles.addButton}
                        disabled={loading}
                      >
                        Add Friend
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;
