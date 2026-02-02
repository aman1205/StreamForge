import { Module } from '@nestjs/common';
import { ConsumerGroupsController } from './consumer-groups.controller';
import { ConsumerGroupsService } from './consumer-groups.service';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { TopicsModule } from '../topics/topics.module';

@Module({
  imports: [TopicsModule],
  controllers: [ConsumerGroupsController],
  providers: [ConsumerGroupsService, PrismaService, RedisService],
  exports: [ConsumerGroupsService],
})
export class ConsumerGroupsModule {}
