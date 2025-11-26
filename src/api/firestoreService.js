import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

class FirestoreService {
  constructor() {
    this.unsubscribers = new Map();
  }

  // Subscribe to messages in a room
  subscribeToRoomMessages(roomId, callback, errorCallback) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('roomId', '==', roomId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            messages.push({ messageId: doc.id, ...doc.data() });
          });
          callback(messages);
        },
        (error) => {
          console.error('Error listening to room messages:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`room_${roomId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to room messages:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to messages in a conversation
  subscribeToConversationMessages(conversationId, callback, errorCallback) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            messages.push({ messageId: doc.id, ...doc.data() });
          });
          callback(messages);
        },
        (error) => {
          console.error('Error listening to conversation messages:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`conversation_${conversationId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to conversation messages:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to typing indicators in a room
  subscribeToRoomTyping(roomId, currentUserId, callback) {
    try {
      const typingRef = collection(db, 'typing');
      const q = query(
        typingRef,
        where('roomId', '==', roomId),
        where('isTyping', '==', true)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const typingUsers = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Exclude current user and check if typing status is recent (within last 5 seconds)
          const now = Date.now();
          if (
            data.userId !== currentUserId &&
            data.timestamp &&
            now - data.timestamp < 5000
          ) {
            typingUsers.push(data.userId);
          }
        });
        callback(typingUsers);
      });

      this.unsubscribers.set(`typing_room_${roomId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to room typing:', error);
    }
  }

  // Subscribe to typing indicators in a conversation
  subscribeToConversationTyping(conversationId, currentUserId, callback) {
    try {
      const typingRef = collection(db, 'typing');
      const q = query(
        typingRef,
        where('conversationId', '==', conversationId),
        where('isTyping', '==', true)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const typingUsers = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Exclude current user and check if typing status is recent (within last 5 seconds)
          const now = Date.now();
          if (
            data.userId !== currentUserId &&
            data.timestamp &&
            now - data.timestamp < 5000
          ) {
            typingUsers.push(data.userId);
          }
        });
        callback(typingUsers);
      });

      this.unsubscribers.set(
        `typing_conversation_${conversationId}`,
        unsubscribe
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to conversation typing:', error);
    }
  }

  // Unsubscribe from specific listener
  unsubscribe(key) {
    const unsubscribe = this.unsubscribers.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(key);
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribers.clear();
  }
}

export default new FirestoreService();
