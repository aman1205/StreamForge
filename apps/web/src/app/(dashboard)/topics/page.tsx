'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWorkspaceStore } from '@/lib/store'
import { useTopics, useDeleteTopic } from '@/lib/hooks'
import { Layers, Plus, Trash2, ArrowRight, Clock, Database, Send } from 'lucide-react'
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
    <div className="space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Topics</h1>
          <p className="text-lg text-muted-foreground">
            Manage your event streaming topics and channels
          </p>
        </div>
        <Link href="/topics/new">
          <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow h-12 rounded-xl">
            <Plus className="mr-2 h-5 w-5" />
            Create Topic
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      {!isLoading && topics && topics.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription>Total Topics</CardDescription>
              <CardTitle className="text-3xl font-bold text-gradient">{topics.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription>Total Partitions</CardDescription>
              <CardTitle className="text-3xl font-bold text-gradient">
                {topics.reduce((sum, topic) => sum + topic.partitions, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription>Avg Retention</CardDescription>
              <CardTitle className="text-3xl font-bold text-gradient">
                {(topics.reduce((sum, topic) => sum + Math.floor(Number(topic.retentionMs) / 86400000), 0) / topics.length).toFixed(1)} days
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Topics List */}
      {isLoading ? (
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : topics && topics.length > 0 ? (
        <div className="grid gap-6">
          {topics.map((topic, index) => (
            <Card
              key={topic.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Layers className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                          {topic.name}
                        </CardTitle>
                        <Badge variant="success" className="gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          Active
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-base">
                        <span className="flex items-center gap-1.5">
                          <Database className="h-4 w-4" />
                          {topic.partitions} partition{topic.partitions !== 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {Math.floor(Number(topic.retentionMs) / 86400000)} days retention
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(topic.id, topic.name)}
                    disabled={deleteTopic.isPending}
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-xl"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="relative z-10">
                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Created {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/topics/${topic.id}/publish`}>
                      <Button variant="outline" size="default" className="border-border/50 hover:border-secondary/50 hover:bg-background/50 rounded-xl h-10">
                        <Send className="mr-2 h-4 w-4" />
                        Publish Event
                      </Button>
                    </Link>
                    <Link href={`/topics/${topic.id}`}>
                      <Button size="default" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity rounded-xl h-10">
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
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-20 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-6">
              <Layers className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No topics yet</h3>
            <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
              Create your first topic to start streaming events in real-time
            </p>
            <Link href="/topics/new">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Topic
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
