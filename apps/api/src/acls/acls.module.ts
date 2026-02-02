import { Module } from '@nestjs/common';
import { AclsController } from './acls.controller';
import { AclsService } from './acls.service';
import { AclGuard } from './acl.guard';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [AclsController],
  providers: [AclsService, AclGuard, PrismaService],
  exports: [AclsService, AclGuard],
})
export class AclsModule {}
