import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RedisService } from '../common/redis.service';
import { PrismaService } from '../common/prisma.service';
import { TopicsModule } from '../topics/topics.module';

@Module({
  imports: [TopicsModule],
  controllers: [EventsController],
  providers: [EventsService, RedisService, PrismaService],
})
export class EventsModule {}
