import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FiltersService } from './filters.service';
import { CreateFilterDto } from './dto/create-filter.dto';
import { UpdateFilterDto } from './dto/update-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  /**
   * Create a new filter for a consumer group
   */
  @Post('consumer-groups/:consumerGroupId/filters')
  async create(
    @Param('consumerGroupId') consumerGroupId: string,
    @Body() dto: CreateFilterDto,
  ) {
    return this.filtersService.create(consumerGroupId, dto);
  }

  /**
   * Get all filters for a consumer group
   */
  @Get('consumer-groups/:consumerGroupId/filters')
  async findByConsumerGroup(
    @Param('consumerGroupId') consumerGroupId: string,
  ) {
    return this.filtersService.findByConsumerGroup(consumerGroupId);
  }

  /**
   * Get filter statistics
   */
  @Get('consumer-groups/:consumerGroupId/filters/stats')
  async getStats(@Param('consumerGroupId') consumerGroupId: string) {
    return this.filtersService.getStats(consumerGroupId);
  }

  /**
   * Get a specific filter
   */
  @Get('filters/:filterId')
  async findOne(@Param('filterId') filterId: string) {
    return this.filtersService.findOne(filterId);
  }

  /**
   * Update a filter
   */
  @Put('filters/:filterId')
  async update(
    @Param('filterId') filterId: string,
    @Body() dto: UpdateFilterDto,
  ) {
    return this.filtersService.update(filterId, dto);
  }

  /**
   * Delete a filter
   */
  @Delete('filters/:filterId')
  async delete(@Param('filterId') filterId: string) {
    return this.filtersService.delete(filterId);
  }

  /**
   * Test filter against sample message
   */
  @Post('filters/:filterId/test')
  async testFilter(
    @Param('filterId') filterId: string,
    @Body() sampleMessage: any,
  ) {
    return this.filtersService.testFilter(filterId, sampleMessage);
  }
}
