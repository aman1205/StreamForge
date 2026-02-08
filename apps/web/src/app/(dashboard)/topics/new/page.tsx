'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspaceStore } from '@/lib/store'
import { useCreateTopic } from '@/lib/hooks'
import { toast } from 'sonner'
import { ArrowLeft, Layers, Database, Clock, Info } from 'lucide-react'
import Link from 'next/link'

export default function CreateTopicPage() {
  const router = useRouter()
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)
  const createTopic = useCreateTopic(workspace?.id || '')

  const [name, setName] = useState('')
  const [partitions, setPartitions] = useState('1')
  const [retentionDays, setRetentionDays] = useState('7')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const retentionMs = Number(retentionDays) * 24 * 60 * 60 * 1000

    createTopic.mutate(
      {
        name,
        partitions: Number(partitions),
        retentionMs,
      },
      {
        onSuccess: (data) => {
          toast.success(`Topic "${data.name}" created successfully`)
          router.push('/topics')
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Failed to create topic'
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="space-y-8 max-w-4xl animate-slide-in">
      {/* Header */}
      <div>
        <Link href="/topics">
          <Button variant="ghost" size="sm" className="mb-4 hover:bg-background/50 rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Layers className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Create Topic</h1>
            <p className="text-lg text-muted-foreground mt-1">
              Set up a new event streaming channel
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Topic Configuration</CardTitle>
              <CardDescription className="text-base">
                Configure your topic settings for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Topic Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Topic Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., user-events, order-created, payment-processed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    pattern="[a-z0-9-]+"
                    className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                  />
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Use lowercase letters, numbers, and hyphens only. Choose a descriptive name.
                  </p>
                </div>

                {/* Partitions */}
                <div className="space-y-3">
                  <Label htmlFor="partitions" className="text-base font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-secondary" />
                    Partitions *
                  </Label>
                  <Input
                    id="partitions"
                    type="number"
                    min="1"
                    max="100"
                    value={partitions}
                    onChange={(e) => setPartitions(e.target.value)}
                    required
                    className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                  />
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Number of partitions for parallel processing (1-100). More partitions = higher throughput. Start with 1 for most use cases.
                  </p>
                </div>

                {/* Retention */}
                <div className="space-y-3">
                  <Label htmlFor="retention" className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[hsl(var(--stream-orange))]" />
                    Retention Period (days) *
                  </Label>
                  <Input
                    id="retention"
                    type="number"
                    min="1"
                    max="365"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    required
                    className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                  />
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    How long events are stored before deletion (1-365 days). Longer retention uses more storage.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border/30">
                  <Button
                    type="submit"
                    disabled={createTopic.isPending}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow rounded-xl"
                  >
                    {createTopic.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                        Creating Topic...
                      </>
                    ) : (
                      <>
                        <Layers className="mr-2 h-5 w-5" />
                        Create Topic
                      </>
                    )}
                  </Button>
                  <Link href="/topics">
                    <Button type="button" variant="outline" size="lg" className="border-border/50 hover:bg-background/50 rounded-xl">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Best Practices */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">Topic Naming</p>
                <p className="text-muted-foreground">
                  Use clear, descriptive names like "user-registered" or "order-completed"
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Partition Count</p>
                <p className="text-muted-foreground">
                  Start with 1-3 partitions. Scale up as your throughput increases.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Retention Policy</p>
                <p className="text-muted-foreground">
                  7 days is common for events. Use 1 day for high-volume streams.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Preview */}
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-lg">Configuration Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Topic Name:</span>
                <span className="font-semibold text-foreground">{name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partitions:</span>
                <span className="font-semibold text-foreground">{partitions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retention:</span>
                <span className="font-semibold text-foreground">{retentionDays} days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
