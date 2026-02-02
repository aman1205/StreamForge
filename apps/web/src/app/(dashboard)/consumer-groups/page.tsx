'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspaceStore } from '@/lib/store'
import { useTopics } from '@/lib/hooks'
import { Users, Plus } from 'lucide-react'

export default function ConsumerGroupsPage() {
  const searchParams = useSearchParams()
  const topicId = searchParams.get('topicId')
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)
  const { data: topics } = useTopics(workspace?.id || '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consumer Groups</h1>
          <p className="text-muted-foreground mt-1">
            Manage event consumer groups for coordinated message processing
          </p>
        </div>
        {topicId && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Consumer Group
          </Button>
        )}
      </div>

      {!topicId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a topic</h3>
            <p className="text-muted-foreground mb-6">
              Choose a topic to view and manage its consumer groups
            </p>
            <div className="max-w-md mx-auto space-y-2">
              {topics && topics.length > 0 ? (
                topics.map((topic) => (
                  <Link key={topic.id} href={`/consumer-groups?topicId=${topic.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      {topic.name}
                    </Button>
                  </Link>
                ))
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    No topics available. Create a topic first.
                  </p>
                  <Link href="/topics/new">
                    <Button>Create Topic</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No consumer groups yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a consumer group to start processing events from this topic
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Consumer Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
