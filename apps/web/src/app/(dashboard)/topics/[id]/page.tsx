"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopic, useTopicStats } from "@/lib/hooks/useTopics";
import { ArrowLeft, Layers, Database, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicEventsTab } from "@/components/topics/TopicEventsTab";
import { TopicConsumersTab } from "@/components/topics/TopicConsumersTab";
import { TopicSettingsTab } from "@/components/topics/TopicSettingsTab";

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: topic, isLoading } = useTopic(id);
  const { data: stats, isLoading: statsLoading } = useTopicStats(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Topic not found</h2>
        <p className="text-muted-foreground mb-4">
          The requested topic does not exist
        </p>
        <Link href="/topics">
          <Button>Back to Topics</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <Link href="/topics">
          <Button variant="ghost" size="sm" className="mb-2 hover:bg-muted/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {topic.name}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                Created{" "}
                {formatDistanceToNow(new Date(topic.createdAt), {
                  addSuffix: true,
                })}
                <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  {topic.id}
                </span>
              </p>
            </div>
          </div>
          <Link href={`/topics/${topic.id}/publish`}>
            <Button className="bg-gradient-to-r from-primary to-secondary stream-glow">
              Publish Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Messages
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gradient">
                  {stats?.totalMessages?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime messages
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Message Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gradient">
                  {stats?.messageRate || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Events per second
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consumer Groups
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gradient">
                  {stats?.consumerGroups || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active groups
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="events" className="rounded-lg px-4">
            Live Events
          </TabsTrigger>
          <TabsTrigger value="consumers" className="rounded-lg px-4">
            Consumers
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg px-4">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <TopicEventsTab topicId={topic.id} />
        </TabsContent>

        <TabsContent value="consumers" className="space-y-4">
          <TopicConsumersTab topicId={topic.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <TopicSettingsTab topic={topic} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
