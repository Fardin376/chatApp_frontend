import apiClient from './apiClient';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const friendService = {
  // Send a friend request - POST /friends/request
  sendFriendRequest: async (fromId, toId) => {
    try {
      const response = await apiClient.post('/friends/request', {
        fromUser: fromId,
        toUser: toId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to send friend request' };
    }
  },

  // Accept a friend request - POST /friends/accept
  acceptFriendRequest: async (userId, fromId) => {
    try {
      const response = await apiClient.post('/friends/accept', {
        userId: userId,
        fromUser: fromId,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { error: 'Failed to accept friend request' }
      );
    }
  },

  // Reject a friend request - POST /friends/reject
  rejectFriendRequest: async (userId, fromUser) => {
    try {
      const response = await apiClient.post('/friends/reject', {
        userId: userId,
        fromUser: fromUser,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { error: 'Failed to reject friend request' }
      );
    }
  },

  // Remove a friend - POST /friends/delete
  removeFriend: async (userA, userB) => {
    try {
      const response = await apiClient.post('/friends/delete', {
        userA: userA,
        userB: userB,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to remove friend' };
    }
  },

  // Get list of friends - GET /friends/:userId
  getFriendsList: async (userId) => {
    try {
      const response = await apiClient.get(`/friends/${userId}`);
      // Backend returns {friends: ["uid1", "uid2"]}
      // Need to fetch user details for each friend ID
      const friendIds = response.data.friends || [];

      if (friendIds.length === 0) {
        return [];
      }

      // Fetch all users to get friend details
      const usersResponse = await apiClient.get('/users');
      const allUsers = usersResponse.data;

      // Filter to get only friends
      const friendDetails = allUsers.filter((user) =>
        friendIds.includes(user.id)
      );
      return friendDetails;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get friends list' };
    }
  },

  // Get pending friend requests - GET /friends/:userId/incoming
  getFriendRequests: async (userId) => {
    try {
      const response = await apiClient.get(`/friends/${userId}/incoming`);
      // Backend returns {incomingRequests: ["uid1", "uid2"]}
      // Need to fetch user details for each request sender
      const requestIds = response.data.incomingRequests || [];

      if (requestIds.length === 0) {
        return [];
      }

      // Fetch all users to get request sender details
      const usersResponse = await apiClient.get('/users');
      const allUsers = usersResponse.data;

      // Filter to get only request senders with their details
      const requestDetails = allUsers
        .filter((user) => requestIds.includes(user.id))
        .map((user) => ({
          id: user.id,
          fromId: user.id,
          name: user.name,
          email: user.email,
        }));

      return requestDetails;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get friend requests' };
    }
  },

  // Listen to real-time updates for incoming friend requests
  onFriendRequestsChange: (userId, callback) => {
    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const requestIds = userData.incomingFriendRequests || [];

          if (requestIds.length === 0) {
            callback([]);
            return;
          }

          try {
            // Fetch all users to get request sender details
            const usersResponse = await apiClient.get('/users');
            const allUsers = usersResponse.data;

            // Filter to get only request senders with their details
            const requestDetails = allUsers
              .filter((user) => requestIds.includes(user.id))
              .map((user) => ({
                id: user.id,
                fromId: user.id,
                name: user.name,
                email: user.email,
              }));

            callback(requestDetails);
          } catch (error) {
            console.error('Error fetching user details:', error);
            callback([]);
          }
        } else {
          callback([]);
        }
      },
      (error) => {
        console.error('Error listening to friend requests:', error);
      }
    );

    return unsubscribe;
  },
};

export default friendService;
