/**
 * Webhook Management System
 * Handles webhook registration, triggering, retries, and delivery tracking
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
import axios, { AxiosError } from 'axios';

export interface WebhookEvent {
  event: string;
  data: unknown;
  timestamp: Date;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retryConfig?: {
    maxRetries: number;
    backoff: 'linear' | 'exponential';
  };
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private webhooks: Map<string, Webhook> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new webhook
   */
  async registerWebhook(webhook: Omit<Webhook, 'id'>): Promise<Webhook> {
    const id = `webhook_${Date.now()}`;
    const newWebhook = { id, ...webhook };
    
    this.webhooks.set(id, newWebhook);
    this.logger.log(`Webhook registered: ${id} for events: ${webhook.events.join(', ')}`);
    
    return newWebhook;
  }

  /**
   * Trigger webhooks for a specific event
   */
  async triggerEvent(event: string, data: unknown): Promise<void> {
    const webhookEvent: WebhookEvent = {
      event,
      data,
      timestamp: new Date(),
    };

    const applicableWebhooks = Array.from(this.webhooks.values()).filter(
      (wh) => wh.active && wh.events.includes(event)
    );

    this.logger.log(`Triggering ${applicableWebhooks.length} webhooks for event: ${event}`);

    // Trigger webhooks in parallel
    await Promise.allSettled(
      applicableWebhooks.map((webhook) => this.deliverWebhook(webhook, webhookEvent))
    );
  }

  /**
   * Deliver webhook with retry logic
   */
  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    attempt = 1
  ): Promise<void> {
    const maxRetries = webhook.retryConfig?.maxRetries || 3;

    try {
      const response = await axios.post(webhook.url, event, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event.event,
          'X-Webhook-Signature': webhook.secret
            ? this.generateSignature(event, webhook.secret)
            : undefined,
        },
        timeout: 10000,
      });

      this.logger.log(
        `Webhook delivered successfully: ${webhook.id} (${response.status})`
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Webhook delivery failed: ${webhook.id} (attempt ${attempt}/${maxRetries})`
      );

      if (attempt < maxRetries) {
        const delay = this.calculateBackoff(attempt, webhook.retryConfig?.backoff || 'exponential');
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.deliverWebhook(webhook, event, attempt + 1);
      }

      this.logger.error(`Webhook delivery failed permanently: ${webhook.id}`);
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateSignature(event: WebhookEvent, secret: string): string {
    const crypto = require('crypto');
    const payload = JSON.stringify(event);
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Calculate backoff delay for retries
   */
  private calculateBackoff(attempt: number, strategy: 'linear' | 'exponential'): number {
    if (strategy === 'linear') {
      return attempt * 1000; // 1s, 2s, 3s, ...
    }
    return Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, ...
  }

  /**
   * Get all registered webhooks
   */
  getWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    this.webhooks.delete(id);
    this.logger.log(`Webhook deleted: ${id}`);
  }

  /**
   * Update webhook status
   */
  async updateWebhookStatus(id: string, active: boolean): Promise<void> {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      webhook.active = active;
      this.logger.log(`Webhook ${id} ${active ? 'activated' : 'deactivated'}`);
    }
  }
}
