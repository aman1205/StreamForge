'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspaceStore } from '@/lib/store'
import { useTopics } from '@/lib/hooks'
import { Users, Plus, Layers, ArrowRight } from 'lucide-react'

export default function ConsumerGroupsPage() {
  const searchParams = useSearchParams()
  const topicId = searchParams.get('topicId')
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)
  const { data: topics } = useTopics(workspace?.id || '')

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Consumer Groups</h1>
          <p className="text-lg text-muted-foreground">
            Manage event consumer groups for coordinated message processing
          </p>
        </div>
        {topicId && (
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow h-12 rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Consumer Group
          </Button>
        )}
      </div>

      {!topicId ? (
        /* Topic Selection View */
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Select a Topic</h3>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                Choose a topic to view and manage its consumer groups
              </p>

              {topics && topics.length > 0 ? (
                <div className="max-w-2xl mx-auto space-y-3">
                  {topics.map((topic, index) => (
                    <Link
                      key={topic.id}
                      href={`/consumer-groups?topicId=${topic.id}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Card className="border-border/50 bg-background/50 hover:border-primary/50 transition-all group">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Layers className="h-6 w-6 text-primary" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                                  {topic.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {topic.partitions} partition{topic.partitions !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-6">
                    No topics available. Create a topic first to set up consumer groups.
                  </p>
                  <Link href="/topics/new">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow"
                    >
                      <Layers className="mr-2 h-5 w-5" />
                      Create Topic
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Consumer Groups View (when topic selected) */
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-20 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No consumer groups yet</h3>
            <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
              Create a consumer group to start processing events from this topic
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Consumer Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="text-xl">What are Consumer Groups?</CardTitle>
          <CardDescription className="text-base">
            Learn about consumer groups and how they work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-foreground">
            Consumer groups enable multiple consumers to work together to process events from a topic in a coordinated way.
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Each consumer in a group processes different partitions</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Automatic load balancing across consumers</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Track consumer lag and offset management</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
