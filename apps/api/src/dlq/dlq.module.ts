import { Module } from '@nestjs/common';
import { DlqController } from './dlq.controller';
import { DlqService } from './dlq.service';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { TopicsModule } from '../topics/topics.module';

@Module({
  imports: [TopicsModule],
  controllers: [DlqController],
  providers: [DlqService, PrismaService, RedisService],
  exports: [DlqService],
})
export class DlqModule {}
