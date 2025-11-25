import apiClient from './apiClient';

export const roomService = {
  // Create a new chat room
  createRoom: async (roomName, createdBy) => {
    const response = await apiClient.post('/rooms', { roomName, createdBy });
    return response.data;
  },

  // Get all chat rooms
  getAllRooms: async () => {
    const response = await apiClient.get('/rooms');
    return response.data;
  },

  // Get specific room details
  getRoomById: async (roomId) => {
    const response = await apiClient.get(`/rooms/${roomId}`);
    return response.data;
  },

  // Update a chat room
  updateRoom: async (roomId, roomName) => {
    const response = await apiClient.post(`/rooms/${roomId}`, { roomName });
    return response.data;
  },

  // Delete a chat room
  deleteRoom: async (roomId) => {
    const response = await apiClient.post(`/rooms/${roomId}/delete`);
    return response.data;
  },

  // Get messages in a room
  getRoomMessages: async (roomId) => {
    const response = await apiClient.get(`/rooms/${roomId}/messages`);
    return response.data;
  },
};
