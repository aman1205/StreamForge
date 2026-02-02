import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // Helper methods for Redis Streams
  async xadd(stream: string, data: Record<string, any>): Promise<string> {
    const fields = Object.entries(data).flat();
    return this.client.xadd(stream, '*', ...fields);
  }

  async xread(
    streams: string[],
    ids: string[],
    count?: number,
  ): Promise<[string, [string, string[]][]][]> {
    const args = ['COUNT', String(count || 100), 'STREAMS', ...streams, ...ids];
    // @ts-ignore - ioredis xread types are overly restrictive
    return this.client.xread(...args) as any;
  }

  async xreadgroup(
    group: string,
    consumer: string,
    streams: string[],
    ids: string[],
    count?: number,
  ): Promise<[string, [string, string[]][]][]> {
    const args = [
      'GROUP',
      group,
      consumer,
      'COUNT',
      String(count || 100),
      'STREAMS',
      ...streams,
      ...ids,
    ];
    // @ts-ignore - ioredis xreadgroup types are overly restrictive
    return this.client.xreadgroup(...args) as any;
  }

  async xgroupCreate(stream: string, group: string, id = '$'): Promise<string> {
    try {
      return await this.client.xgroup('CREATE', stream, group, id, 'MKSTREAM') as string;
    } catch (error) {
      // Ignore error if group already exists
      if (error.message.includes('BUSYGROUP')) {
        return 'OK';
      }
      throw error;
    }
  }
}
