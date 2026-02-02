import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@Module({
  controllers: [TopicsController],
  providers: [TopicsService, PrismaService, RedisService],
  exports: [TopicsService],
})
export class TopicsModule {}
