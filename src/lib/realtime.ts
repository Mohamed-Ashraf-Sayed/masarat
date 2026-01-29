// Real-time messaging system using in-memory event emitter
// In production, replace with Redis pub/sub

type MessageHandler = (data: any) => void;

class RealtimeManager {
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private typingStatus: Map<string, { userId: string; userName: string; timestamp: number }> = new Map();

  subscribe(userId: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(userId)?.delete(handler);
      if (this.subscribers.get(userId)?.size === 0) {
        this.subscribers.delete(userId);
      }
    };
  }

  notify(userId: string, data: any): void {
    const handlers = this.subscribers.get(userId);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in realtime handler:', error);
        }
      });
    }
  }

  notifyMany(userIds: string[], data: any): void {
    userIds.forEach((userId) => this.notify(userId, data));
  }

  setTyping(conversationId: string, userId: string, userName: string): void {
    this.typingStatus.set(`${conversationId}:${userId}`, {
      userId,
      userName,
      timestamp: Date.now(),
    });

    // Auto-clear typing after 3 seconds
    setTimeout(() => {
      const status = this.typingStatus.get(`${conversationId}:${userId}`);
      if (status && Date.now() - status.timestamp >= 3000) {
        this.typingStatus.delete(`${conversationId}:${userId}`);
      }
    }, 3000);
  }

  clearTyping(conversationId: string, userId: string): void {
    this.typingStatus.delete(`${conversationId}:${userId}`);
  }

  getTypingUsers(conversationId: string, excludeUserId?: string): { userId: string; userName: string }[] {
    const result: { userId: string; userName: string }[] = [];
    const now = Date.now();

    this.typingStatus.forEach((status, key) => {
      if (key.startsWith(`${conversationId}:`) && status.userId !== excludeUserId) {
        // Only include if typed within last 3 seconds
        if (now - status.timestamp < 3000) {
          result.push({ userId: status.userId, userName: status.userName });
        }
      }
    });

    return result;
  }

  isUserOnline(userId: string): boolean {
    return this.subscribers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.subscribers.keys());
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();
