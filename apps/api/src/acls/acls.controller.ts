import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AclsService } from './acls.service';
import { GrantAclDto } from './dto/grant-acl.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class AclsController {
  constructor(private aclsService: AclsService) {}

  /**
   * Grant permission on a topic
   */
  @Post('topics/:topicId/acls')
  async grant(
    @Param('topicId') topicId: string,
    @Body() dto: GrantAclDto,
    @Request() req: any,
  ) {
    return this.aclsService.grant(topicId, req.user.sub, dto);
  }

  /**
   * Get all ACLs for a topic
   */
  @Get('topics/:topicId/acls')
  async findByTopic(@Param('topicId') topicId: string) {
    return this.aclsService.findByTopic(topicId);
  }

  /**
   * Get permission summary for a topic
   */
  @Get('topics/:topicId/acls/summary')
  async getSummary(@Param('topicId') topicId: string) {
    return this.aclsService.getPermissionSummary(topicId);
  }

  /**
   * Revoke specific ACL
   */
  @Delete('acls/:aclId')
  async revoke(@Param('aclId') aclId: string) {
    return this.aclsService.revoke(aclId);
  }

  /**
   * Revoke all ACLs for a user on a topic
   */
  @Delete('topics/:topicId/acls/user/:userId')
  async revokeAllForUser(
    @Param('topicId') topicId: string,
    @Param('userId') userId: string,
  ) {
    return this.aclsService.revokeAllForUser(topicId, userId);
  }

  /**
   * Revoke all ACLs for an API key on a topic
   */
  @Delete('topics/:topicId/acls/api-key/:apiKeyId')
  async revokeAllForApiKey(
    @Param('topicId') topicId: string,
    @Param('apiKeyId') apiKeyId: string,
  ) {
    return this.aclsService.revokeAllForApiKey(topicId, apiKeyId);
  }

  /**
   * Get ACLs for current user
   */
  @Get('my/acls')
  async findMyAcls(@Request() req: any) {
    return this.aclsService.findByUser(req.user.sub);
  }
}
