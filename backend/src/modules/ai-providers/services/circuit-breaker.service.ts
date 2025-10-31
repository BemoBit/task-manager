import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerState } from '../interfaces/ai-provider.interface';

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes in half-open before closing
  timeout: number; // Time in ms before moving from open to half-open
  monitoringPeriod: number; // Time window for counting failures
}

/**
 * Circuit Breaker implementation for AI providers
 * Prevents cascading failures by temporarily blocking requests to failing providers
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly states = new Map<string, CircuitBreakerState>();
  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriod: 120000, // 2 minutes
  };

  /**
   * Check if request should be allowed based on circuit state
   */
  async shouldAllowRequest(providerId: string): Promise<boolean> {
    const state = this.getOrCreateState(providerId);

    switch (state.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        // Check if enough time has passed to try again
        if (state.nextRetryTime && Date.now() >= state.nextRetryTime.getTime()) {
          this.logger.log(`Moving ${providerId} to HALF_OPEN state`);
          state.state = 'HALF_OPEN';
          state.failureCount = 0;
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful request
   */
  async recordSuccess(providerId: string): Promise<void> {
    const state = this.getOrCreateState(providerId);

    if (state.state === 'HALF_OPEN') {
      state.failureCount = 0;
      // If enough successes in half-open, close the circuit
      if (state.failureCount === 0) {
        this.logger.log(`Closing circuit for ${providerId}`);
        state.state = 'CLOSED';
        state.nextRetryTime = undefined;
      }
    } else if (state.state === 'CLOSED') {
      // Reset failure count on success
      state.failureCount = Math.max(0, state.failureCount - 1);
    }
  }

  /**
   * Record a failed request
   */
  async recordFailure(providerId: string, error: Error): Promise<void> {
    const state = this.getOrCreateState(providerId);

    state.failureCount++;
    state.lastFailureTime = new Date();

    this.logger.warn(
      `Provider ${providerId} failure: ${error.message} (count: ${state.failureCount})`,
    );

    if (state.state === 'HALF_OPEN') {
      // Any failure in half-open state should open the circuit
      this.openCircuit(providerId, state);
    } else if (state.state === 'CLOSED' && state.failureCount >= this.config.failureThreshold) {
      this.openCircuit(providerId, state);
    }
  }

  /**
   * Open the circuit for a provider
   */
  private openCircuit(providerId: string, state: CircuitBreakerState): void {
    this.logger.error(`Opening circuit for ${providerId}`);
    state.state = 'OPEN';
    state.nextRetryTime = new Date(Date.now() + this.config.timeout);
  }

  /**
   * Get or create circuit breaker state for a provider
   */
  private getOrCreateState(providerId: string): CircuitBreakerState {
    if (!this.states.has(providerId)) {
      this.states.set(providerId, {
        providerId,
        state: 'CLOSED',
        failureCount: 0,
      });
    }
    return this.states.get(providerId)!;
  }

  /**
   * Get current state for a provider
   */
  getState(providerId: string): CircuitBreakerState {
    return this.getOrCreateState(providerId);
  }

  /**
   * Reset circuit breaker for a provider
   */
  reset(providerId: string): void {
    this.logger.log(`Resetting circuit breaker for ${providerId}`);
    this.states.set(providerId, {
      providerId,
      state: 'CLOSED',
      failureCount: 0,
    });
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.states.values());
  }
}
