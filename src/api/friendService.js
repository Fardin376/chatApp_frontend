import apiClient from './apiClient';

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
      console.log('Fetching friend requests for userId:', userId);
      const response = await apiClient.get(`/friends/${userId}/incoming`);
      console.log('Friend requests API response:', response.data);

      // Backend returns {incomingRequests: ["uid1", "uid2"]}
      // Need to fetch user details for each request sender
      const requestIds = response.data.incomingRequests || [];
      console.log('Request IDs:', requestIds);

      if (requestIds.length === 0) {
        console.log('No friend requests found');
        return [];
      }

      // Fetch all users to get request sender details
      const usersResponse = await apiClient.get('/users');
      const allUsers = usersResponse.data;
      console.log('All users:', allUsers);

      // Filter to get only request senders with their details
      const requestDetails = allUsers
        .filter((user) => requestIds.includes(user.id))
        .map((user) => ({
          id: user.id,
          fromId: user.id,
          name: user.name,
          email: user.email,
        }));

      console.log('Request details:', requestDetails);
      return requestDetails;
    } catch (error) {
      console.error('Error in getFriendRequests:', error);
      throw error.response?.data || { error: 'Failed to get friend requests' };
    }
  },

  // Poll for friend request updates (real-time simulation)
  startFriendRequestsPolling: (userId, callback, interval = 3000) => {
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      try {
        const requests = await friendService.getFriendRequests(userId);
        callback(requests);
      } catch (error) {
        console.error('Error polling friend requests:', error);
      }

      if (isActive) {
        setTimeout(poll, interval);
      }
    };

    // Start polling immediately
    poll();

    // Return stop function
    return () => {
      isActive = false;
    };
  },
};

export default friendService;
