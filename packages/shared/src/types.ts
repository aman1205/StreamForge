// Core Domain Types

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user?: User;
  workspace?: Workspace;
}

export interface Topic {
  id: string;
  workspaceId: string;
  name: string;
  partitions: number;
  retentionMs: number;
  schema: Record<string, any> | null;
  createdAt: Date;
  workspace?: Workspace;
}

export interface ApiKey {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  permissions: Record<string, any>;
  active: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  workspace?: Workspace;
}

export interface Event {
  id: string;
  topic: string;
  partition: number;
  offset: string;
  timestamp: number;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

// Consumer Group Types
export enum ConsumerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REBALANCING = 'REBALANCING',
}

export interface ConsumerGroup {
  id: string;
  topicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  topic?: Topic;
  consumers?: Consumer[];
  offsets?: ConsumerOffset[];
}

export interface Consumer {
  id: string;
  consumerGroupId: string;
  consumerId: string;
  status: ConsumerStatus;
  assignedPartitions: number[];
  lastHeartbeat: Date;
  createdAt: Date;
  consumerGroup?: ConsumerGroup;
}

export interface ConsumerOffset {
  id: string;
  consumerGroupId: string;
  partition: number;
  offset: string;
  committedAt: Date;
  consumerGroup?: ConsumerGroup;
}

export interface ConsumerLag {
  partition: number;
  committedOffset: string | null;
  latestOffset: string;
  lag: number; // Number of messages behind
}

// DTOs (Data Transfer Objects)

// Auth DTOs
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  workspace: Workspace;
}

// Workspace DTOs
export interface CreateWorkspaceDto {
  name: string;
  slug?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
}

// Topic DTOs
export interface CreateTopicDto {
  name: string;
  partitions?: number;
  retentionMs?: number;
  schema?: Record<string, any>;
}

export interface UpdateTopicDto {
  retentionMs?: number;
  schema?: Record<string, any>;
}

// Event DTOs
export interface PublishEventDto {
  payload: Record<string, any>;
  partition?: number;
}

export interface ConsumeEventsDto {
  offset?: string;
  limit?: number;
  partition?: number;
}

export interface PublishEventResponse {
  success: boolean;
  eventId: string;
  topic: string;
  partition: number;
  offset: string;
}

export interface ConsumeEventsResponse {
  events: Event[];
  nextOffset: string | null;
}

// API Key DTOs
export interface CreateApiKeyDto {
  name: string;
  permissions?: Record<string, any>;
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only returned on creation
  permissions: Record<string, any>;
  active: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

// Consumer Group DTOs
export interface CreateConsumerGroupDto {
  name: string;
}

export interface RegisterConsumerDto {
  consumerId: string;
}

export interface ConsumeFromGroupDto {
  consumerId: string;
  partition?: number;
  limit?: number;
  autoCommit?: boolean;
}

export interface CommitOffsetDto {
  partition: number;
  offset: string;
}

export interface ConsumerGroupWithStats extends ConsumerGroup {
  activeConsumers: number;
  totalConsumers: number;
  partitionsAssigned: number;
  lag: ConsumerLag[];
}

// Dead Letter Queue Types
export enum DlqStatus {
  PENDING = 'PENDING',
  RETRYING = 'RETRYING',
  FAILED = 'FAILED',
  RESOLVED = 'RESOLVED',
}

export enum FailureReason {
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface DeadLetterQueue {
  id: string;
  topicId: string;
  consumerGroupId: string | null;
  partition: number;
  originalOffset: string;
  payload: Record<string, any>;
  metadata: Record<string, any> | null;
  errorMessage: string;
  errorStack: string | null;
  failureReason: FailureReason;
  status: DlqStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  retryHistory?: RetryHistory[];
}

export interface RetryHistory {
  id: string;
  dlqId: string;
  attemptNumber: number;
  errorMessage: string | null;
  retriedAt: Date;
  success: boolean;
}

export interface MessageAcknowledgment {
  id: string;
  consumerGroupId: string;
  consumerId: string;
  partition: number;
  offset: string;
  acknowledged: boolean;
  ackAt: Date | null;
  nackAt: Date | null;
  nackReason: string | null;
  createdAt: Date;
  expiresAt: Date;
}

// DLQ DTOs
export interface SendToDlqDto {
  topicId: string;
  consumerGroupId?: string;
  partition: number;
  originalOffset: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  errorMessage: string;
  errorStack?: string;
  failureReason?: FailureReason;
  maxRetries?: number;
}

export interface RetryDlqMessageDto {
  destinationTopic?: string;
  resetOffset?: boolean;
}

export interface AcknowledgeMessageDto {
  consumerId: string;
  offsets: string[];
}

export interface NackMessageDto {
  consumerId: string;
  offset: string;
  reason?: string;
  requeue?: boolean;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}
