import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateFilterDto } from './dto/create-filter.dto';
import { UpdateFilterDto } from './dto/update-filter.dto';
import { FilterOperator } from '@prisma/client';

@Injectable()
export class FiltersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new message filter
   */
  async create(consumerGroupId: string, dto: CreateFilterDto) {
    // Verify consumer group exists
    const consumerGroup = await this.prisma.consumerGroup.findUnique({
      where: { id: consumerGroupId },
    });

    if (!consumerGroup) {
      throw new NotFoundException('Consumer group not found');
    }

    const filter = await this.prisma.messageFilter.create({
      data: {
        consumerGroupId,
        name: dto.name,
        field: dto.field,
        operator: dto.operator,
        value: dto.value,
        active: dto.active !== undefined ? dto.active : true,
      },
    });

    return filter;
  }

  /**
   * Get all filters for a consumer group
   */
  async findByConsumerGroup(consumerGroupId: string) {
    return this.prisma.messageFilter.findMany({
      where: { consumerGroupId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific filter
   */
  async findOne(filterId: string) {
    const filter = await this.prisma.messageFilter.findUnique({
      where: { id: filterId },
    });

    if (!filter) {
      throw new NotFoundException('Filter not found');
    }

    return filter;
  }

  /**
   * Update a filter
   */
  async update(filterId: string, dto: UpdateFilterDto) {
    await this.findOne(filterId);

    return this.prisma.messageFilter.update({
      where: { id: filterId },
      data: dto,
    });
  }

  /**
   * Delete a filter
   */
  async delete(filterId: string) {
    await this.findOne(filterId);

    await this.prisma.messageFilter.delete({
      where: { id: filterId },
    });

    return { success: true };
  }

  /**
   * Apply filters to messages
   */
  async applyFilters(consumerGroupId: string, messages: any[]): Promise<any[]> {
    // Get active filters for this consumer group
    const filters = await this.prisma.messageFilter.findMany({
      where: {
        consumerGroupId,
        active: true,
      },
    });

    if (filters.length === 0) {
      return messages;
    }

    // Filter messages
    return messages.filter((message) => {
      // All filters must match (AND logic)
      return filters.every((filter) =>
        this.matchesFilter(message, filter),
      );
    });
  }

  /**
   * Check if a message matches a filter
   */
  private matchesFilter(message: any, filter: any): boolean {
    const value = this.getNestedValue(message, filter.field);
    const filterValue = filter.value;

    switch (filter.operator) {
      case FilterOperator.EQUALS:
        return value === filterValue;

      case FilterOperator.NOT_EQUALS:
        return value !== filterValue;

      case FilterOperator.CONTAINS:
        if (typeof value === 'string' && typeof filterValue === 'string') {
          return value.includes(filterValue);
        }
        if (Array.isArray(value)) {
          return value.includes(filterValue);
        }
        return false;

      case FilterOperator.NOT_CONTAINS:
        if (typeof value === 'string' && typeof filterValue === 'string') {
          return !value.includes(filterValue);
        }
        if (Array.isArray(value)) {
          return !value.includes(filterValue);
        }
        return true;

      case FilterOperator.GREATER_THAN:
        return value > filterValue;

      case FilterOperator.LESS_THAN:
        return value < filterValue;

      case FilterOperator.IN:
        if (Array.isArray(filterValue)) {
          return filterValue.includes(value);
        }
        return false;

      case FilterOperator.NOT_IN:
        if (Array.isArray(filterValue)) {
          return !filterValue.includes(value);
        }
        return true;

      case FilterOperator.REGEX:
        if (typeof value === 'string' && typeof filterValue === 'string') {
          try {
            const regex = new RegExp(filterValue);
            return regex.test(value);
          } catch (error) {
            console.error(`Invalid regex pattern: ${filterValue}`, error);
            return false;
          }
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Test filter against sample message
   */
  async testFilter(
    filterId: string,
    sampleMessage: any,
  ): Promise<{ matches: boolean; value: any }> {
    const filter = await this.findOne(filterId);

    const value = this.getNestedValue(sampleMessage, filter.field);
    const matches = this.matchesFilter(sampleMessage, filter);

    return {
      matches,
      value,
    };
  }

  /**
   * Get filter statistics
   */
  async getStats(consumerGroupId: string) {
    const filters = await this.findByConsumerGroup(consumerGroupId);

    const stats = {
      total: filters.length,
      active: filters.filter((f) => f.active).length,
      inactive: filters.filter((f) => !f.active).length,
      byOperator: {} as Record<FilterOperator, number>,
    };

    // Count by operator
    filters.forEach((filter) => {
      stats.byOperator[filter.operator] =
        (stats.byOperator[filter.operator] || 0) + 1;
    });

    return stats;
  }
}
