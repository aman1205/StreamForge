import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TopicsModule } from './topics/topics.module';
import { EventsModule } from './events/events.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ConsumerGroupsModule } from './consumer-groups/consumer-groups.module';
import { DlqModule } from './dlq/dlq.module';
import { SchemaRegistryModule } from './schema-registry/schema-registry.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AclsModule } from './acls/acls.module';
import { AuditModule } from './audit/audit.module';
import { MetricsModule } from './metrics/metrics.module';
import { FiltersModule } from './filters/filters.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ReplayModule } from './replay/replay.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { PrismaService } from './common/prisma.service';
import { RedisService } from './common/redis.service';
import jwtConfig from './common/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    AuthModule,
    WorkspacesModule,
    TopicsModule,
    EventsModule,
    ApiKeysModule,
    ConsumerGroupsModule,
    DlqModule,
    SchemaRegistryModule,
    WebhooksModule,
    AclsModule,
    AuditModule,
    MetricsModule,
    FiltersModule,
    RealtimeModule,
    ReplayModule,
  ],
  providers: [
    PrismaService,
    RedisService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
