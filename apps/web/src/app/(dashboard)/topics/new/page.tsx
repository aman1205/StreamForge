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
import { ArrowLeft } from 'lucide-react'
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/topics">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Topic</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new event streaming topic
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topic Configuration</CardTitle>
          <CardDescription>
            Configure your topic settings. You can update these later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Topic Name *</Label>
              <Input
                id="name"
                placeholder="user-events"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partitions">Partitions *</Label>
              <Input
                id="partitions"
                type="number"
                min="1"
                max="100"
                value={partitions}
                onChange={(e) => setPartitions(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Number of partitions for parallel processing (1-100). Start with 1 for most use cases.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retention (days) *</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                How long to keep events before they are deleted (1-365 days)
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={createTopic.isPending}>
                {createTopic.isPending ? 'Creating...' : 'Create Topic'}
              </Button>
              <Link href="/topics">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
