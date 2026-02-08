"use client";

import { useConsumerGroups } from "@/lib/hooks/useConsumerGroups";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertCircle, CheckCircle, Activity } from "lucide-react";
import Link from "next/link";

export function TopicConsumersTab({ topicId }: { topicId: string }) {
  const { data: consumerGroups, isLoading } = useConsumerGroups(topicId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!consumerGroups || consumerGroups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Consumer Groups</h3>
          <p className="text-muted-foreground mb-6">
            Create a consumer group to start processing events from this topic.
          </p>
          <Link href={`/consumer-groups/new?topicId=${topicId}`}>
            <Button>Create Consumer Group</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {consumerGroups.map((group) => (
        <Card
          key={group.id}
          className="hover:border-primary/50 transition-colors"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {group.name}
              </CardTitle>
              <CardDescription className="text-xs font-mono">
                {group.id.slice(0, 8)}...
              </CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Active
                </Badge>
              </div>

              <Link
                href={`/consumer-groups/${group.id}`}
                className="block mt-4"
              >
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="border-dashed bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-center">
        <Link
          href={`/consumer-groups/new?topicId=${topicId}`}
          className="w-full h-full flex items-center justify-center p-6"
        >
          <div className="text-center">
            <div className="mx-auto h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl text-primary font-light">+</span>
            </div>
            <p className="font-semibold">Add Consumer Group</p>
          </div>
        </Link>
      </Card>
    </div>
  );
}
