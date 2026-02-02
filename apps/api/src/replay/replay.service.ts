import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { TopicsService } from '../topics/topics.service';
import { ReplayEventsDto, ReplayMode } from './dto/replay-events.dto';

export interface ReplaySession {
  id: string;
  topicId: string;
  mode: ReplayMode;
  startOffset: string;
  endOffset: string | null;
  currentOffset: string;
  eventsReplayed: number;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReplayService {
  private sessions: Map<string, ReplaySession> = new Map();

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private topicsService: TopicsService,
  ) {}

  /**
   * Start a replay session
   */
  async startReplay(topicId: string, dto: ReplayEventsDto): Promise<string> {
    // Verify topic exists
    const topic = await this.topicsService.findOne(topicId);

    // Determine start and end offsets based on mode
    const { startOffset, endOffset } = await this.calculateOffsets(
      topicId,
      dto,
    );

    // Create replay session
    const sessionId = `replay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const session: ReplaySession = {
      id: sessionId,
      topicId,
      mode: dto.mode,
      startOffset,
      endOffset,
      currentOffset: startOffset,
      eventsReplayed: 0,
      status: 'RUNNING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Start replay process
    this.executeReplay(sessionId, dto).catch((error) => {
      console.error(`Replay session ${sessionId} failed:`, error);
      const failedSession = this.sessions.get(sessionId);
      if (failedSession) {
        failedSession.status = 'FAILED';
        failedSession.updatedAt = new Date();
      }
    });

    return sessionId;
  }

  /**
   * Get replay session status
   */
  getSession(sessionId: string): ReplaySession {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Replay session not found');
    }

    return session;
  }

  /**
   * Pause replay session
   */
  pauseSession(sessionId: string) {
    const session = this.getSession(sessionId);

    if (session.status !== 'RUNNING') {
      throw new BadRequestException('Session is not running');
    }

    session.status = 'PAUSED';
    session.updatedAt = new Date();

    return session;
  }

  /**
   * Resume replay session
   */
  resumeSession(sessionId: string, dto: ReplayEventsDto) {
    const session = this.getSession(sessionId);

    if (session.status !== 'PAUSED') {
      throw new BadRequestException('Session is not paused');
    }

    session.status = 'RUNNING';
    session.updatedAt = new Date();

    // Resume replay
    this.executeReplay(sessionId, dto).catch((error) => {
      console.error(`Replay session ${sessionId} failed:`, error);
      session.status = 'FAILED';
      session.updatedAt = new Date();
    });

    return session;
  }

  /**
   * Stop replay session
   */
  stopSession(sessionId: string) {
    const session = this.getSession(sessionId);

    session.status = 'COMPLETED';
    session.updatedAt = new Date();

    return session;
  }

  /**
   * List all replay sessions
   */
  listSessions(topicId?: string): ReplaySession[] {
    const sessions = Array.from(this.sessions.values());

    if (topicId) {
      return sessions.filter((s) => s.topicId === topicId);
    }

    return sessions;
  }

  /**
   * Calculate start and end offsets based on replay mode
   */
  private async calculateOffsets(
    topicId: string,
    dto: ReplayEventsDto,
  ): Promise<{ startOffset: string; endOffset: string | null }> {
    const streamKey = this.topicsService.getStreamKey(topicId, 0);

    switch (dto.mode) {
      case ReplayMode.FROM_OFFSET:
        if (!dto.fromOffset) {
          throw new BadRequestException(
            'fromOffset is required for FROM_OFFSET mode',
          );
        }
        return {
          startOffset: dto.fromOffset,
          endOffset: null,
        };

      case ReplayMode.FROM_TIMESTAMP:
        if (!dto.fromTimestamp) {
          throw new BadRequestException(
            'fromTimestamp is required for FROM_TIMESTAMP mode',
          );
        }
        const startTs = new Date(dto.fromTimestamp).getTime();
        const startOffsetFromTs = `${startTs}-0`;
        return {
          startOffset: startOffsetFromTs,
          endOffset: null,
        };

      case ReplayMode.TIME_RANGE:
        if (!dto.fromTimestamp || !dto.toTimestamp) {
          throw new BadRequestException(
            'fromTimestamp and toTimestamp are required for TIME_RANGE mode',
          );
        }
        const rangeStartTs = new Date(dto.fromTimestamp).getTime();
        const rangeEndTs = new Date(dto.toTimestamp).getTime();
        return {
          startOffset: `${rangeStartTs}-0`,
          endOffset: `${rangeEndTs}-0`,
        };

      case ReplayMode.OFFSET_RANGE:
        if (!dto.fromOffset || !dto.toOffset) {
          throw new BadRequestException(
            'fromOffset and toOffset are required for OFFSET_RANGE mode',
          );
        }
        return {
          startOffset: dto.fromOffset,
          endOffset: dto.toOffset,
        };

      default:
        throw new BadRequestException('Invalid replay mode');
    }
  }

  /**
   * Execute replay process
   */
  private async executeReplay(sessionId: string, dto: ReplayEventsDto) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const batchSize = dto.batchSize || 100;
    const speed = dto.speed || 1;
    const streamKey = this.topicsService.getStreamKey(session.topicId, 0);

    let currentOffset = session.currentOffset;
    let hasMore = true;

    while (hasMore && session.status === 'RUNNING') {
      // Read batch of events
      const result = await this.redis.xread(
        [streamKey],
        [currentOffset],
        batchSize,
      );

      if (!result || result.length === 0) {
        hasMore = false;
        break;
      }

      const [_stream, messages] = result[0];

      if (messages.length === 0) {
        hasMore = false;
        break;
      }

      // Process each message
      for (const [id, fields] of messages) {
        if (session.status !== 'RUNNING') {
          break;
        }

        // Check if we've reached the end offset
        if (session.endOffset && id > session.endOffset) {
          hasMore = false;
          break;
        }

        const fieldMap = this.arrayToObject(fields);

        // Republish event (either to original topic or destination topic)
        const targetTopicId = dto.destinationTopic || session.topicId;

        await this.republishEvent(targetTopicId, fieldMap);

        // Update session
        session.eventsReplayed++;
        session.currentOffset = id;
        currentOffset = id;
        session.updatedAt = new Date();

        // Apply speed (simulate time delays if speed < infinity)
        if (speed !== Infinity && fields.length >= 2) {
          // Calculate delay based on original event timestamp
          const eventTimestamp = parseInt(fieldMap.timestamp || '0');
          const now = Date.now();
          const delay = (now - eventTimestamp) / speed;

          if (delay > 0 && delay < 10000) {
            // Max 10s delay
            await this.sleep(delay);
          }
        }
      }

      // Update current offset for next batch
      if (messages.length > 0) {
        currentOffset = messages[messages.length - 1][0];
      }

      // Small delay between batches
      await this.sleep(10);
    }

    // Mark session as completed
    if (session.status === 'RUNNING') {
      session.status = 'COMPLETED';
      session.updatedAt = new Date();
    }
  }

  /**
   * Republish event to topic
   */
  private async republishEvent(topicId: string, eventData: any) {
    const streamKey = this.topicsService.getStreamKey(topicId, 0);

    const replayEventData: Record<string, string> = {
      payload: eventData.payload,
      timestamp: Date.now().toString(),
      topic: eventData.topic || '',
      partition: eventData.partition || '0',
      replayed: 'true',
      originalTimestamp: eventData.timestamp || '',
    };

    await this.redis.xadd(streamKey, replayEventData);
  }

  /**
   * Create snapshot for point-in-time recovery
   */
  async createSnapshot(topicId: string, name: string) {
    // Verify topic exists
    await this.topicsService.findOne(topicId);

    const streamKey = this.topicsService.getStreamKey(topicId, 0);

    // Get stream info
    const info = await this.redis.getClient().xinfo('STREAM', streamKey);
    const firstEntry = info[6]; // first-entry
    const lastEntry = info[8]; // last-entry

    // Create snapshot record
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      topicId,
      name,
      firstOffset: firstEntry ? firstEntry[0] : '0-0',
      lastOffset: lastEntry ? lastEntry[0] : '0-0',
      messageCount: info[2], // length
      createdAt: new Date(),
    };

    return snapshot;
  }

  /**
   * Get events count between offsets
   */
  async getEventCount(
    topicId: string,
    fromOffset: string,
    toOffset?: string,
  ): Promise<number> {
    const streamKey = this.topicsService.getStreamKey(topicId, 0);

    let count = 0;
    let currentOffset = fromOffset;
    const batchSize = 1000;

    while (true) {
      const result = await this.redis.xread(
        [streamKey],
        [currentOffset],
        batchSize,
      );

      if (!result || result.length === 0) {
        break;
      }

      const [_stream, messages] = result[0];

      if (messages.length === 0) {
        break;
      }

      for (const [id] of messages) {
        if (toOffset && id > toOffset) {
          return count;
        }
        count++;
        currentOffset = id;
      }

      if (messages.length < batchSize) {
        break;
      }
    }

    return count;
  }

  /**
   * Helper: Convert Redis array to object
   */
  private arrayToObject(arr: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    for (let i = 0; i < arr.length; i += 2) {
      obj[arr[i]] = arr[i + 1];
    }
    return obj;
  }

  /**
   * Helper: Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup old completed sessions
   */
  cleanup(olderThanMinutes: number = 60) {
    const cutoff = Date.now() - olderThanMinutes * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (
        (session.status === 'COMPLETED' || session.status === 'FAILED') &&
        session.updatedAt.getTime() < cutoff
      ) {
        this.sessions.delete(sessionId);
      }
    }

    return {
      success: true,
      remaining: this.sessions.size,
    };
  }
}
