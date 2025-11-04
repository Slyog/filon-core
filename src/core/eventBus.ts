type EventHandler = (payload: any) => void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event type
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  emit(eventType: string, payload?: any): void {
    console.log(`[FEEDBACK] Event emitted: ${eventType}`, payload);
    const handlers = this.handlers.get(eventType) || [];
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[FEEDBACK] Error in handler for ${eventType}:`, err);
      }
    });
  }

  /**
   * Remove all handlers for an event type
   */
  unsubscribeAll(eventType: string): void {
    this.handlers.delete(eventType);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();

