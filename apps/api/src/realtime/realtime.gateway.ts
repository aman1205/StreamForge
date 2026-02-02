import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

interface SubscriptionData {
  topicId: string;
  consumerGroupId?: string;
  filters?: Record<string, any>;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private subscriptions: Map<string, Set<string>> = new Map(); // socketId -> Set of topicIds
  private topicSockets: Map<string, Set<string>> = new Map(); // topicId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  onModuleInit() {
    this.startRedisListener();
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Authenticate client
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.userId = payload.sub;

      console.log(`Client connected: ${client.id} (user: ${payload.sub})`);
      client.emit('connected', {
        socketId: client.id,
        message: 'Connected to StreamForge real-time events',
      });
    } catch (error) {
      console.error('Authentication failed:', error.message);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Clean up subscriptions
    const subscribedTopics = this.subscriptions.get(client.id);
    if (subscribedTopics) {
      subscribedTopics.forEach((topicId) => {
        const sockets = this.topicSockets.get(topicId);
        if (sockets) {
          sockets.delete(client.id);
          if (sockets.size === 0) {
            this.topicSockets.delete(topicId);
          }
        }
      });
      this.subscriptions.delete(client.id);
    }
  }

  /**
   * Subscribe to topic events
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscriptionData,
  ) {
    try {
      const { topicId, consumerGroupId, filters } = data;

      // Verify topic exists and user has access
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: client.data.userId },
              },
            },
          },
        },
      });

      if (!topic || topic.workspace.members.length === 0) {
        client.emit('error', {
          message: 'Topic not found or access denied',
        });
        return;
      }

      // Add subscription
      if (!this.subscriptions.has(client.id)) {
        this.subscriptions.set(client.id, new Set());
      }
      this.subscriptions.get(client.id)!.add(topicId);

      if (!this.topicSockets.has(topicId)) {
        this.topicSockets.set(topicId, new Set());
      }
      this.topicSockets.get(topicId)!.add(client.id);

      // Store filters if provided
      if (filters) {
        client.data[`filters_${topicId}`] = filters;
      }

      client.emit('subscribed', {
        topicId,
        message: `Subscribed to topic: ${topic.name}`,
      });

      console.log(`Client ${client.id} subscribed to topic ${topicId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * Unsubscribe from topic events
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { topicId: string },
  ) {
    const { topicId } = data;

    const subscribedTopics = this.subscriptions.get(client.id);
    if (subscribedTopics) {
      subscribedTopics.delete(topicId);
    }

    const sockets = this.topicSockets.get(topicId);
    if (sockets) {
      sockets.delete(client.id);
    }

    // Remove filters
    delete client.data[`filters_${topicId}`];

    client.emit('unsubscribed', { topicId });
    console.log(`Client ${client.id} unsubscribed from topic ${topicId}`);
  }

  /**
   * Get current subscriptions
   */
  @SubscribeMessage('subscriptions')
  handleGetSubscriptions(@ConnectedSocket() client: Socket) {
    const subscribedTopics = Array.from(
      this.subscriptions.get(client.id) || [],
    );
    client.emit('subscriptions', { topics: subscribedTopics });
  }

  /**
   * Broadcast event to subscribed clients
   */
  async broadcastEvent(topicId: string, event: any) {
    const sockets = this.topicSockets.get(topicId);

    if (!sockets || sockets.size === 0) {
      return;
    }

    // Emit to all subscribed clients
    sockets.forEach((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        // Apply client-specific filters if any
        const filters = socket.data[`filters_${topicId}`];

        if (filters) {
          const matches = this.matchesFilters(event, filters);
          if (!matches) {
            return;
          }
        }

        socket.emit('event', {
          topicId,
          event,
          timestamp: new Date().toISOString(),
        });
      }
    });

    console.log(
      `Broadcasted event to ${sockets.size} clients for topic ${topicId}`,
    );
  }

  /**
   * Start Redis pub/sub listener for events
   */
  private startRedisListener() {
    const client = this.redis.getClient();
    if (!client) {
      console.warn('Redis client not ready yet, skipping real-time listener setup');
      return;
    }
    const subscriber = client.duplicate();

    subscriber.on('ready', () => {
      console.log('Redis subscriber ready for real-time events');

      // Subscribe to event channel
      subscriber.subscribe('streamforge:events', (err, count) => {
        if (err) {
          console.error('Failed to subscribe to Redis channel:', err);
        } else {
          console.log(`Subscribed to ${count} Redis channel(s)`);
        }
      });
    });

    subscriber.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);
        const { topicId, event } = data;

        await this.broadcastEvent(topicId, event);
      } catch (error) {
        console.error('Error processing Redis message:', error);
      }
    });

    subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });
  }

  /**
   * Check if event matches filters
   */
  private matchesFilters(event: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const eventValue = this.getNestedValue(event, key);

      if (eventValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      totalSubscriptions: this.subscriptions.size,
      topicsWithSubscribers: this.topicSockets.size,
      subscriptionsByTopic: Array.from(this.topicSockets.entries()).map(
        ([topicId, sockets]) => ({
          topicId,
          subscribers: sockets.size,
        }),
      ),
    };
  }
}
