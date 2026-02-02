import { Module } from '@nestjs/common';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { TopicsService } from '../topics/topics.service';

@Module({
  controllers: [ReplayController],
  providers: [ReplayService, PrismaService, RedisService, TopicsService],
  exports: [ReplayService],
})
export class ReplayModule {}
