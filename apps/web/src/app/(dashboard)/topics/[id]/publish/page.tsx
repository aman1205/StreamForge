'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useTopic, usePublishEvent } from '@/lib/hooks'
import { ArrowLeft, Send } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

export default function PublishEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: topic, isLoading } = useTopic(id)
  const publishEvent = usePublishEvent(id)

  const [payload, setPayload] = useState('{\n  "event": "example",\n  "data": {}\n}')

  const handlePublish = () => {
    try {
      const parsedPayload = JSON.parse(payload)
      publishEvent.mutate(parsedPayload, {
        onSuccess: () => {
          toast.success('Event published successfully')
          setPayload('{\n  "event": "example",\n  "data": {}\n}')
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Failed to publish event'
          toast.error(message)
        },
      })
    } catch (error) {
      toast.error('Invalid JSON payload')
    }
  }

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(payload)
      setPayload(JSON.stringify(parsed, null, 2))
    } catch (error) {
      toast.error('Invalid JSON')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Topic not found</h2>
        <Link href="/topics">
          <Button>Back to Topics</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href={`/topics/${id}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topic
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Publish Event</h1>
        <p className="text-muted-foreground mt-1">
          Publish an event to <span className="font-mono">{topic.name}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Payload</CardTitle>
            <CardDescription>Enter your event data in JSON format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payload">JSON Payload</Label>
              <Textarea
                id="payload"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
                placeholder='{"event": "example", "data": {}}'
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePublish} disabled={publishEvent.isPending}>
                <Send className="mr-2 h-4 w-4" />
                {publishEvent.isPending ? 'Publishing...' : 'Publish Event'}
              </Button>
              <Button onClick={formatJSON} variant="outline">
                Format JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example Payloads</CardTitle>
            <CardDescription>Common event payload examples</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">User Event</p>
              <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
{`{
  "event": "user.created",
  "userId": "usr_123",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}`}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() =>
                  setPayload(
                    JSON.stringify(
                      {
                        event: 'user.created',
                        userId: 'usr_123',
                        timestamp: new Date().toISOString(),
                        data: {
                          email: 'user@example.com',
                          name: 'John Doe',
                        },
                      },
                      null,
                      2
                    )
                  )
                }
              >
                Use this example
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Order Event</p>
              <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
{`{
  "event": "order.placed",
  "orderId": "ord_789",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "total": 99.99,
    "items": 3
  }
}`}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() =>
                  setPayload(
                    JSON.stringify(
                      {
                        event: 'order.placed',
                        orderId: 'ord_789',
                        timestamp: new Date().toISOString(),
                        data: {
                          total: 99.99,
                          items: 3,
                        },
                      },
                      null,
                      2
                    )
                  )
                }
              >
                Use this example
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
