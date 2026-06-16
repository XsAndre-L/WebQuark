type EventCallback<T = any> = (data: T) => void;

class TypedEventBus<M extends Record<string, any>> {
  private listeners: { [K in keyof M]?: Set<EventCallback<M[K]>> } = {};

  /**
   * Subscribe to an event. Returns a cleanup function to unsubscribe.
   */
  on<K extends keyof M>(event: K, callback: EventCallback<M[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event.
   */
  off<K extends keyof M>(event: K, callback: EventCallback<M[K]>): void {
    if (this.listeners[event]) {
      this.listeners[event]!.delete(callback);
    }
  }

  /**
   * Emit an event with type-safe payload.
   */
  emit<K extends keyof M>(event: K, data: M[K]): void {
    if (this.listeners[event]) {
      this.listeners[event]!.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in event listener for event "${String(event)}":`, err);
        }
      });
    }
  }
}

export interface PlaygroundEvents {
  'event-dispatched': { name: string; detail: any };
}

export const playgroundBus = new TypedEventBus<PlaygroundEvents>();
