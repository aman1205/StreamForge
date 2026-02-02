'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/lib/store'
import { useTopics, useApiKeys } from '@/lib/hooks'
import { Layers, Key, Activity, ArrowRight, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
}: {
  title: string
  value: string | number
  description: string
  icon: any
  trend?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)
  const { data: topics, isLoading: topicsLoading } = useTopics(workspace?.id || '')
  const { data: apiKeys, isLoading: apiKeysLoading } = useApiKeys(workspace?.id || '')

  const totalTopics = topics?.length || 0
  const activeApiKeys = apiKeys?.filter((key) => key.active).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your event streams and activity
          </p>
        </div>
        <Link href="/topics/new">
          <Button>
            <Layers className="mr-2 h-4 w-4" />
            Create Topic
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Topics"
          value={totalTopics}
          description="Active event topics"
          icon={Layers}
          loading={topicsLoading}
        />
        <StatCard
          title="API Keys"
          value={activeApiKeys}
          description="Active API keys"
          icon={Key}
          loading={apiKeysLoading}
        />
        <StatCard
          title="Consumer Groups"
          value={0}
          description="Active consumer groups"
          icon={Activity}
        />
        <StatCard
          title="Events Today"
          value="0"
          description="Events published today"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Topics</CardTitle>
            <CardDescription>Your latest event topics</CardDescription>
          </CardHeader>
          <CardContent>
            {topicsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : topics && topics.length > 0 ? (
              <div className="space-y-2">
                {topics.slice(0, 5).map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {topic.partitions} partition(s)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No topics yet</p>
                <Link href="/topics/new">
                  <Button variant="link" className="mt-2">
                    Create your first topic
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Set up your event streaming platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Create a topic</p>
                  <p className="text-sm text-muted-foreground">
                    Topics are channels for your events
                  </p>
                  <Link href="/topics/new">
                    <Button variant="link" className="h-auto p-0 mt-1">
                      Create topic →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Publish events</p>
                  <p className="text-sm text-muted-foreground">
                    Send your first event to a topic
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Generate API keys</p>
                  <p className="text-sm text-muted-foreground">
                    Create keys for programmatic access
                  </p>
                  <Link href="/api-keys">
                    <Button variant="link" className="h-auto p-0 mt-1">
                      Manage API keys →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
