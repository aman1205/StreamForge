'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspaceStore } from '@/lib/store'
import { useTopics, useDeleteTopic } from '@/lib/hooks'
import { Layers, Plus, Trash2, ArrowRight, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function TopicsPage() {
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)
  const { data: topics, isLoading } = useTopics(workspace?.id || '')
  const deleteTopic = useDeleteTopic()

  const handleDelete = (topicId: string, topicName: string) => {
    if (confirm(`Are you sure you want to delete "${topicName}"? This action cannot be undone.`)) {
      deleteTopic.mutate(topicId, {
        onSuccess: () => {
          toast.success(`Topic "${topicName}" deleted successfully`)
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Failed to delete topic'
          toast.error(message)
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Topics</h1>
          <p className="text-muted-foreground mt-1">
            Manage your event streaming topics
          </p>
        </div>
        <Link href="/topics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Topic
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : topics && topics.length > 0 ? (
        <div className="grid gap-4">
          {topics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{topic.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{topic.partitions} partition(s)</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Retention: {Math.floor(Number(topic.retentionMs) / 86400000)} days
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(topic.id, topic.name)}
                    disabled={deleteTopic.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Created {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/topics/${topic.id}/publish`}>
                      <Button variant="outline" size="sm">
                        Publish Event
                      </Button>
                    </Link>
                    <Link href={`/topics/${topic.id}`}>
                      <Button size="sm">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No topics yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first topic to start streaming events
            </p>
            <Link href="/topics/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Topic
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
