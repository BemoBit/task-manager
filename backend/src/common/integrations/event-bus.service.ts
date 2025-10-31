/**
 * Event Bus for decoupled communication
 * Implements pub/sub pattern for inter-module communication
 */

import { Injectable, Logger } from '@nestjs/common';

type EventHandler = (data: unknown) => void | Promise<void>;

interface Subscription {
  id: string;
  event: string;
  handler: EventHandler;
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private subscriptions: Map<string, Subscription[]> = new Map();
  private eventHistory: Array<{ event: string; timestamp: Date; data: unknown }> = [];

  /**
   * Subscribe to an event
   */
  subscribe(event: string, handler: EventHandler): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random()}`;
    const subscription: Subscription = {
      id: subscriptionId,
      event,
      handler,
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    this.subscriptions.get(event)!.push(subscription);
    this.logger.debug(`Subscribed to event: ${event} (${subscriptionId})`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): void {
    for (const [event, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        this.logger.debug(`Unsubscribed: ${subscriptionId}`);
        
        if (subs.length === 0) {
          this.subscriptions.delete(event);
        }
        return;
      }
    }
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(event: string, data: unknown): Promise<void> {
    this.logger.log(`Publishing event: ${event}`);

    // Store in history (keep last 1000 events)
    this.eventHistory.push({ event, timestamp: new Date(), data });
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    const subscribers = this.subscriptions.get(event) || [];
    
    if (subscribers.length === 0) {
      this.logger.debug(`No subscribers for event: ${event}`);
      return;
    }

    // Execute all handlers in parallel
    await Promise.allSettled(
      subscribers.map(async (sub) => {
        try {
          await sub.handler(data);
        } catch (error) {
          this.logger.error(
            `Error in event handler for ${event}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      })
    );

    this.logger.debug(`Event ${event} delivered to ${subscribers.length} subscribers`);
  }

  /**
   * Get all events with subscriber counts
   */
  getEvents(): Array<{ event: string; subscribers: number }> {
    return Array.from(this.subscriptions.entries()).map(([event, subs]) => ({
      event,
      subscribers: subs.length,
    }));
  }

  /**
   * Get event history
   */
  getHistory(limit = 100): Array<{ event: string; timestamp: Date }> {
    return this.eventHistory
      .slice(-limit)
      .map(({ event, timestamp }) => ({ event, timestamp }));
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    this.logger.log('All subscriptions cleared');
  }
}
