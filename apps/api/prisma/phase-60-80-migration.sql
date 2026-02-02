-- Phase 60-80% Enterprise Features Migration

-- Schema Registry
CREATE TYPE "SchemaFormat" AS ENUM ('JSON_SCHEMA', 'AVRO', 'PROTOBUF');

CREATE TABLE "schema_versions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "topicId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "format" "SchemaFormat" NOT NULL DEFAULT 'JSON_SCHEMA',
  "schema" JSONB NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "schema_versions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE,
  CONSTRAINT "schema_versions_topicId_version_key" UNIQUE ("topicId", "version")
);

CREATE INDEX "schema_versions_topicId_active_idx" ON "schema_versions"("topicId", "active");

-- Webhooks
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

CREATE TABLE "webhook_endpoints" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "topicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "secret" TEXT,
  "headers" JSONB NOT NULL DEFAULT '{}',
  "filters" JSONB,
  "retryPolicy" JSONB NOT NULL DEFAULT '{"maxRetries": 3, "backoffMs": 1000}',
  "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "webhook_endpoints_topicId_idx" ON "webhook_endpoints"("topicId");

CREATE TABLE "webhook_deliveries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "webhookId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "statusCode" INTEGER,
  "response" TEXT,
  "error" TEXT,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE
);

CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt");

-- Topic ACLs
CREATE TYPE "Permission" AS ENUM ('READ', 'WRITE', 'ADMIN', 'DELETE');

CREATE TABLE "topic_acls" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "topicId" TEXT NOT NULL,
  "userId" TEXT,
  "apiKeyId" TEXT,
  "permission" "Permission" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL
);

CREATE INDEX "topic_acls_topicId_idx" ON "topic_acls"("topicId");
CREATE INDEX "topic_acls_userId_idx" ON "topic_acls"("userId");
CREATE INDEX "topic_acls_apiKeyId_idx" ON "topic_acls"("apiKeyId");

-- Audit Logs
CREATE TYPE "AuditAction" AS ENUM (
  'USER_LOGIN',
  'USER_LOGOUT',
  'WORKSPACE_CREATED',
  'WORKSPACE_DELETED',
  'TOPIC_CREATED',
  'TOPIC_DELETED',
  'TOPIC_UPDATED',
  'EVENT_PUBLISHED',
  'CONSUMER_GROUP_CREATED',
  'CONSUMER_GROUP_DELETED',
  'API_KEY_CREATED',
  'API_KEY_REVOKED',
  'ACL_GRANTED',
  'ACL_REVOKED',
  'SCHEMA_CREATED',
  'SCHEMA_UPDATED',
  'WEBHOOK_CREATED',
  'WEBHOOK_DELETED'
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT,
  "userId" TEXT,
  "action" "AuditAction" NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "audit_logs_workspaceId_idx" ON "audit_logs"("workspaceId");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- Usage Metrics
CREATE TYPE "MetricType" AS ENUM (
  'EVENTS_PUBLISHED',
  'EVENTS_CONSUMED',
  'BANDWIDTH_IN',
  'BANDWIDTH_OUT',
  'API_REQUESTS',
  'STORAGE_USED'
);

CREATE TABLE "usage_metrics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "topicId" TEXT,
  "metricType" "MetricType" NOT NULL,
  "value" BIGINT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB
);

CREATE INDEX "usage_metrics_workspaceId_idx" ON "usage_metrics"("workspaceId");
CREATE INDEX "usage_metrics_topicId_idx" ON "usage_metrics"("topicId");
CREATE INDEX "usage_metrics_metricType_idx" ON "usage_metrics"("metricType");
CREATE INDEX "usage_metrics_timestamp_idx" ON "usage_metrics"("timestamp");

-- Message Filters
CREATE TYPE "FilterOperator" AS ENUM (
  'EQUALS',
  'NOT_EQUALS',
  'CONTAINS',
  'NOT_CONTAINS',
  'GREATER_THAN',
  'LESS_THAN',
  'IN',
  'NOT_IN',
  'REGEX'
);

CREATE TABLE "message_filters" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "consumerGroupId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "operator" "FilterOperator" NOT NULL,
  "value" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "message_filters_consumerGroupId_idx" ON "message_filters"("consumerGroupId");
