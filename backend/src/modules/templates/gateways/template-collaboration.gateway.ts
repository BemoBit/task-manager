import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { IUserPresence } from '../interfaces/template.interface';

/**
 * WebSocket Gateway for Real-time Template Collaboration
 */
@WebSocketGateway({
  namespace: '/templates',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class TemplateCollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TemplateCollaborationGateway.name);
  private readonly sessions: Map<string, Set<string>> = new Map(); // templateId -> Set of socketIds
  private readonly userPresence: Map<string, IUserPresence> = new Map(); // socketId -> UserPresence

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove user from all sessions
    for (const [templateId, clients] of this.sessions.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);

        // Broadcast user left
        this.server.to(templateId).emit('user-left', {
          userId: this.userPresence.get(client.id)?.userId,
          socketId: client.id,
        });

        // Clean up empty sessions
        if (clients.size === 0) {
          this.sessions.delete(templateId);
        }
      }
    }

    // Remove user presence
    this.userPresence.delete(client.id);
  }

  /**
   * Join a template editing session
   */
  @SubscribeMessage('join-template')
  handleJoinTemplate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { templateId: string; userId: string; userName: string },
  ) {
    const { templateId, userId, userName } = data;

    // Add client to session
    if (!this.sessions.has(templateId)) {
      this.sessions.set(templateId, new Set());
    }
    this.sessions.get(templateId)!.add(client.id);

    // Join socket room
    client.join(templateId);

    // Create user presence
    const presence: IUserPresence = {
      userId,
      userName,
      color: this.generateUserColor(userId),
      lastActive: new Date(),
    };
    this.userPresence.set(client.id, presence);

    // Broadcast user joined to others in the room
    client.to(templateId).emit('user-joined', presence);

    // Send current users to new client
    const currentUsers = Array.from(this.sessions.get(templateId)!)
      .filter((socketId) => socketId !== client.id)
      .map((socketId) => this.userPresence.get(socketId))
      .filter(Boolean);

    client.emit('current-users', currentUsers);

    this.logger.log(`User ${userName} joined template ${templateId}`);

    return { success: true, presence };
  }

  /**
   * Leave a template editing session
   */
  @SubscribeMessage('leave-template')
  handleLeaveTemplate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { templateId: string },
  ) {
    const { templateId } = data;

    // Remove from session
    if (this.sessions.has(templateId)) {
      this.sessions.get(templateId)!.delete(client.id);
    }

    // Leave socket room
    client.leave(templateId);

    // Broadcast user left
    this.server.to(templateId).emit('user-left', {
      userId: this.userPresence.get(client.id)?.userId,
      socketId: client.id,
    });

    this.logger.log(`User left template ${templateId}`);

    return { success: true };
  }

  /**
   * Update cursor position
   */
  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { templateId: string; sectionId: string; position: number },
  ) {
    const { templateId, sectionId, position } = data;
    const presence = this.userPresence.get(client.id);

    if (presence) {
      presence.cursor = { sectionId, position };
      presence.lastActive = new Date();

      // Broadcast to others in the room
      client.to(templateId).emit('cursor-update', {
        userId: presence.userId,
        cursor: presence.cursor,
      });
    }
  }

  /**
   * Update selection
   */
  @SubscribeMessage('selection-change')
  handleSelectionChange(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { templateId: string; sectionId: string; start: number; end: number },
  ) {
    const { templateId, sectionId, start, end } = data;
    const presence = this.userPresence.get(client.id);

    if (presence) {
      presence.selection = { sectionId, start, end };
      presence.lastActive = new Date();

      // Broadcast to others
      client.to(templateId).emit('selection-update', {
        userId: presence.userId,
        selection: presence.selection,
      });
    }
  }

  /**
   * Handle content edit
   */
  @SubscribeMessage('edit-content')
  handleEditContent(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      templateId: string;
      sectionId: string;
      content: string;
      version: number;
    },
  ) {
    const { templateId, sectionId, content, version } = data;
    const presence = this.userPresence.get(client.id);

    if (presence) {
      presence.lastActive = new Date();

      // Broadcast edit to others (operational transformation can be added here)
      client.to(templateId).emit('content-updated', {
        userId: presence.userId,
        sectionId,
        content,
        version,
        timestamp: new Date(),
      });

      this.logger.debug(
        `Content edit by ${presence.userName} in section ${sectionId}`,
      );
    }

    return { success: true, version: version + 1 };
  }

  /**
   * Add a comment
   */
  @SubscribeMessage('add-comment')
  handleAddComment(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      templateId: string;
      sectionId: string;
      text: string;
      position?: number;
    },
  ) {
    const { templateId, sectionId, text, position } = data;
    const presence = this.userPresence.get(client.id);

    if (presence) {
      const comment = {
        id: this.generateId(),
        userId: presence.userId,
        userName: presence.userName,
        sectionId,
        text,
        position,
        timestamp: new Date(),
      };

      // Broadcast comment to all users in the room
      this.server.to(templateId).emit('comment-added', comment);

      this.logger.log(`Comment added by ${presence.userName}`);

      return { success: true, comment };
    }
  }

  /**
   * Request template lock (for exclusive editing)
   */
  @SubscribeMessage('request-lock')
  handleRequestLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { templateId: string; sectionId: string },
  ) {
    const { templateId, sectionId } = data;
    const presence = this.userPresence.get(client.id);

    if (presence) {
      // Check if section is already locked
      // (In production, implement proper locking mechanism)

      // Broadcast lock acquired
      this.server.to(templateId).emit('lock-acquired', {
        userId: presence.userId,
        sectionId,
      });

      return { success: true, locked: true };
    }

    return { success: false, locked: false };
  }

  /**
   * Release template lock
   */
  @SubscribeMessage('release-lock')
  handleReleaseLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { templateId: string; sectionId: string },
  ) {
    const { templateId, sectionId } = data;
    const presence = this.userPresence.get(client.id);

    if (presence) {
      // Release lock
      this.server.to(templateId).emit('lock-released', {
        userId: presence.userId,
        sectionId,
      });

      return { success: true };
    }
  }

  /**
   * Broadcast template save
   */
  @SubscribeMessage('template-saved')
  handleTemplateSaved(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { templateId: string; version: string },
  ) {
    const { templateId, version } = data;
    const presence = this.userPresence.get(client.id);

    if (presence) {
      // Broadcast save event
      client.to(templateId).emit('template-save-notification', {
        userId: presence.userId,
        userName: presence.userName,
        version,
        timestamp: new Date(),
      });

      this.logger.log(`Template ${templateId} saved by ${presence.userName}`);
    }

    return { success: true };
  }

  /**
   * Get active users in a template
   */
  @SubscribeMessage('get-active-users')
  handleGetActiveUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { templateId: string },
  ) {
    const { templateId } = data;

    if (!this.sessions.has(templateId)) {
      return { users: [] };
    }

    const activeUsers = Array.from(this.sessions.get(templateId)!)
      .map((socketId) => this.userPresence.get(socketId))
      .filter(Boolean);

    return { users: activeUsers };
  }

  /**
   * Generate consistent color for user
   */
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
      '#F8B739',
      '#52B788',
    ];

    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
