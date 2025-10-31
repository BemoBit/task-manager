import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PipelineEvent, PipelineEventType } from '../interfaces/pipeline.interface';

/**
 * Pipeline WebSocket Gateway
 * Handles real-time updates for pipeline execution
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/pipeline',
})
export class PipelineGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PipelineGateway.name);
  private readonly connectedClients = new Map<string, Socket>();
  private readonly pipelineSubscriptions = new Map<string, Set<string>>();

  afterInit(): void {
    this.logger.log('Pipeline WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Send connection success
    client.emit('connected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    // Handle pipeline subscription
    client.on('subscribe', (pipelineId: string) => {
      this.subscribeToPipeline(client.id, pipelineId);
    });

    // Handle pipeline unsubscription
    client.on('unsubscribe', (pipelineId: string) => {
      this.unsubscribeFromPipeline(client.id, pipelineId);
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);

    // Remove all subscriptions for this client
    this.pipelineSubscriptions.forEach((subscribers) => {
      subscribers.delete(client.id);
    });
  }

  /**
   * Subscribe client to pipeline updates
   */
  private subscribeToPipeline(clientId: string, pipelineId: string): void {
    if (!this.pipelineSubscriptions.has(pipelineId)) {
      this.pipelineSubscriptions.set(pipelineId, new Set());
    }

    this.pipelineSubscriptions.get(pipelineId)!.add(clientId);
    this.logger.log(`Client ${clientId} subscribed to pipeline ${pipelineId}`);

    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit('subscribed', { pipelineId });
    }
  }

  /**
   * Unsubscribe client from pipeline updates
   */
  private unsubscribeFromPipeline(clientId: string, pipelineId: string): void {
    const subscribers = this.pipelineSubscriptions.get(pipelineId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.pipelineSubscriptions.delete(pipelineId);
      }
    }

    this.logger.log(`Client ${clientId} unsubscribed from pipeline ${pipelineId}`);

    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit('unsubscribed', { pipelineId });
    }
  }

  /**
   * Emit pipeline event to subscribed clients
   */
  emitPipelineEvent(event: PipelineEvent): void {
    const subscribers = this.pipelineSubscriptions.get(event.pipelineId);

    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const eventData = {
      type: event.type,
      pipelineId: event.pipelineId,
      taskId: event.taskId,
      timestamp: event.timestamp.toISOString(),
      data: event.data,
    };

    this.logger.log(
      `Emitting ${event.type} to ${subscribers.size} clients for pipeline ${event.pipelineId}`,
    );

    subscribers.forEach((clientId) => {
      const client = this.connectedClients.get(clientId);
      if (client) {
        client.emit('pipeline-event', eventData);

        // Also emit specific event type
        const eventType = this.getEventName(event.type);
        client.emit(eventType, eventData);
      }
    });
  }

  /**
   * Emit pipeline started event
   */
  emitPipelineStarted(pipelineId: string, taskId: string, data?: Record<string, unknown>): void {
    this.emitPipelineEvent({
      type: PipelineEventType.PIPELINE_STARTED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: data || {},
    });
  }

  /**
   * Emit pipeline completed event
   */
  emitPipelineCompleted(pipelineId: string, taskId: string, result: Record<string, unknown>): void {
    this.emitPipelineEvent({
      type: PipelineEventType.PIPELINE_COMPLETED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: result,
    });
  }

  /**
   * Emit pipeline failed event
   */
  emitPipelineFailed(pipelineId: string, taskId: string, error: string): void {
    this.emitPipelineEvent({
      type: PipelineEventType.PIPELINE_FAILED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: { error },
    });
  }

  /**
   * Emit phase started event
   */
  emitPhaseStarted(pipelineId: string, taskId: string, phaseId: string, phaseName: string): void {
    this.emitPipelineEvent({
      type: PipelineEventType.PHASE_STARTED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: { phaseId, phaseName },
    });
  }

  /**
   * Emit phase completed event
   */
  emitPhaseCompleted(
    pipelineId: string,
    taskId: string,
    phaseId: string,
    phaseName: string,
    result: Record<string, unknown>,
  ): void {
    this.emitPipelineEvent({
      type: PipelineEventType.PHASE_COMPLETED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: { phaseId, phaseName, result },
    });
  }

  /**
   * Emit phase failed event
   */
  emitPhaseFailed(
    pipelineId: string,
    taskId: string,
    phaseId: string,
    phaseName: string,
    error: string,
  ): void {
    this.emitPipelineEvent({
      type: PipelineEventType.PHASE_FAILED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: { phaseId, phaseName, error },
    });
  }

  /**
   * Emit subtask generated event
   */
  emitSubtaskGenerated(pipelineId: string, taskId: string, subtask: Record<string, unknown>): void {
    this.emitPipelineEvent({
      type: PipelineEventType.SUBTASK_GENERATED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: { subtask },
    });
  }

  /**
   * Emit error occurred event
   */
  emitErrorOccurred(pipelineId: string, taskId: string, error: string): void {
    this.emitPipelineEvent({
      type: PipelineEventType.ERROR_OCCURRED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: { error },
    });
  }

  /**
   * Emit checkpoint created event
   */
  emitCheckpointCreated(pipelineId: string, taskId: string, checkpointId: string): void {
    this.emitPipelineEvent({
      type: PipelineEventType.CHECKPOINT_CREATED,
      pipelineId,
      taskId,
      timestamp: new Date(),
      data: { checkpointId },
    });
  }

  /**
   * Get event name for socket emission
   */
  private getEventName(eventType: PipelineEventType): string {
    return eventType.toLowerCase().replace(/_/g, '-');
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get pipeline subscribers count
   */
  getPipelineSubscribersCount(pipelineId: string): number {
    return this.pipelineSubscriptions.get(pipelineId)?.size || 0;
  }
}
