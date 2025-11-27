import apiClient from './apiClient';

export const messageService = {
  // Send a message to a room or conversation
  // document can be either a filename string or an object with { filename, data }
  sendMessage: async (
    senderId,
    message,
    roomId = null,
    conversationId = null,
    document = null
  ) => {
    const payload = {
      senderId,
      message,
      roomId,
      conversationId,
    };

    // Add document field only if provided
    // Backend expects just the filename string (e.g., "file.pdf", "image.png", "doc.docx")
    if (document) {
      // If document is an object with filename, extract just the filename
      payload.document =
        typeof document === 'object' ? document.filename : document;
    }

    const response = await apiClient.post('/messages', payload);
    return response.data;
  },
};
