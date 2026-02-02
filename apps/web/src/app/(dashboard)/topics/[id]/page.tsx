'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTopic, useTopicStats } from '@/lib/hooks'
import { ArrowLeft, Layers, Clock, Database, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: topic, isLoading } = useTopic(id)
  const { data: stats, isLoading: statsLoading } = useTopicStats(id)

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
    )
  }

  if (!topic) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Topic not found</h2>
        <p className="text-muted-foreground mb-4">The requested topic does not exist</p>
        <Link href="/topics">
          <Button>Back to Topics</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/topics">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>
        <div className="flex items-center gap-3 mt-4">
          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{topic.name}</h1>
            <p className="text-muted-foreground mt-1">
              Created {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Messages in topic</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Message Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.messageRate || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Messages per second</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumer Groups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.consumerGroups || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active groups</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topic Configuration</CardTitle>
          <CardDescription>Current topic settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Partitions</p>
              <p className="text-lg font-semibold">{topic.partitions}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retention</p>
              <p className="text-lg font-semibold">
                {Math.floor(Number(topic.retentionMs) / 86400000)} days
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Topic ID</p>
              <p className="text-sm font-mono">{topic.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Workspace ID</p>
              <p className="text-sm font-mono">{topic.workspaceId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage this topic</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href={`/topics/${topic.id}/publish`}>
            <Button>Publish Event</Button>
          </Link>
          <Link href={`/consumer-groups?topicId=${topic.id}`}>
            <Button variant="outline">View Consumer Groups</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
