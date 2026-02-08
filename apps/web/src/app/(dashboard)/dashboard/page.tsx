'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkspaceStore } from '@/lib/store'
import { useTopics, useApiKeys } from '@/lib/hooks'
import {
  Layers,
  Key,
  Activity,
  ArrowRight,
  TrendingUp,
  Users,
  Zap,
  Database,
  ArrowUpRight,
  Clock
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
  gradient,
}: {
  title: string
  value: string | number
  description: string
  icon: any
  trend?: string
  loading?: boolean
  gradient?: string
}) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group">
      {/* Gradient Background */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${gradient || 'bg-gradient-to-br from-primary/5 to-secondary/5'}`} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <>
            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
              {value}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-3 text-sm text-primary font-medium">
                <TrendingUp className="h-4 w-4" />
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
    <div className="space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Monitor your event streams and real-time activity
          </p>
        </div>
        <Link href="/topics/new">
          <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow h-12 rounded-xl">
            <Layers className="mr-2 h-5 w-5" />
            Create Topic
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Topics"
          value={totalTopics}
          description="Event streaming channels"
          icon={Layers}
          trend="+12% from last month"
          loading={topicsLoading}
          gradient="bg-gradient-to-br from-primary/5 to-primary/10"
        />
        <StatCard
          title="API Keys"
          value={activeApiKeys}
          description="Active access keys"
          icon={Key}
          trend="+3 new this week"
          loading={apiKeysLoading}
          gradient="bg-gradient-to-br from-secondary/5 to-secondary/10"
        />
        <StatCard
          title="Consumer Groups"
          value={0}
          description="Active consumer groups"
          icon={Users}
          gradient="bg-gradient-to-br from-[hsl(var(--stream-pink))]/5 to-[hsl(var(--stream-pink))]/10"
        />
        <StatCard
          title="Events Today"
          value="1.2M"
          description="Events processed"
          icon={Activity}
          trend="+23% from yesterday"
          gradient="bg-gradient-to-br from-[hsl(var(--stream-orange))]/5 to-[hsl(var(--stream-orange))]/10"
        />
      </div>

      {/* Real-time Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Health */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">System Health</CardTitle>
              <Badge variant="success" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Online
              </Badge>
            </div>
            <CardDescription>Real-time platform metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm">Throughput</span>
                </div>
                <span className="text-sm font-semibold">15.2k/s</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-secondary" />
                  <span className="text-sm">Storage</span>
                </div>
                <span className="text-sm font-semibold">42.8 GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-secondary to-[hsl(var(--stream-pink))] h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[hsl(var(--stream-orange))]" />
                  <span className="text-sm">Latency</span>
                </div>
                <span className="text-sm font-semibold">8.3ms</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-[hsl(var(--stream-orange))] to-[hsl(var(--stream-pink))] h-2 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Topics */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Topics</CardTitle>
                <CardDescription>Your latest event streaming channels</CardDescription>
              </div>
              <Link href="/topics">
                <Button variant="ghost" size="sm" className="hover:bg-background/50">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {topicsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : topics && topics.length > 0 ? (
              <div className="space-y-2">
                {topics.slice(0, 5).map((topic, index) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-primary/50 hover:bg-background/50 transition-all group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Layers className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {topic.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {topic.partitions} partition{topic.partitions !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">No topics yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create your first topic to start streaming events</p>
                <Link href="/topics/new">
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
                    <Layers className="mr-2 h-4 w-4" />
                    Create Topic
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Getting Started */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Getting Started</CardTitle>
            <CardDescription>Set up your event streaming platform in 3 steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-background flex items-center justify-center text-sm font-bold flex-shrink-0 stream-glow">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Create a Topic</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Topics are channels for organizing your event streams
                  </p>
                  <Link href="/topics/new">
                    <Button variant="link" className="h-auto p-0 text-primary hover:text-primary/80">
                      Create your first topic
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Publish Events</p>
                  <p className="text-sm text-muted-foreground">
                    Send your first event to a topic using our REST API or SDKs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Generate API Keys</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create secure API keys for programmatic access
                  </p>
                  <Link href="/api-keys">
                    <Button variant="link" className="h-auto p-0 text-primary hover:text-primary/80">
                      Manage API keys
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/topics/new" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4 border-border/50 hover:border-primary/50 hover:bg-background/50 transition-all group">
                <Layers className="mr-3 h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="font-semibold">Create New Topic</p>
                  <p className="text-xs text-muted-foreground">Set up a new event stream</p>
                </div>
              </Button>
            </Link>

            <Link href="/consumer-groups" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4 border-border/50 hover:border-secondary/50 hover:bg-background/50 transition-all group">
                <Users className="mr-3 h-5 w-5 text-secondary group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="font-semibold">Manage Consumer Groups</p>
                  <p className="text-xs text-muted-foreground">Configure event consumers</p>
                </div>
              </Button>
            </Link>

            <Link href="/api-keys" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4 border-border/50 hover:border-[hsl(var(--stream-pink))]/50 hover:bg-background/50 transition-all group">
                <Key className="mr-3 h-5 w-5 text-[hsl(var(--stream-pink))] group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="font-semibold">Generate API Key</p>
                  <p className="text-xs text-muted-foreground">Create authentication credentials</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
