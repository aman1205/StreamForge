'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspaceStore } from '@/lib/store'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/lib/hooks'
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function ApiKeysPage() {
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)
  const { data: apiKeys, isLoading } = useApiKeys(workspace?.id || '')
  const createApiKey = useCreateApiKey(workspace?.id || '')
  const revokeApiKey = useRevokeApiKey()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()

    createApiKey.mutate(
      { name },
      {
        onSuccess: (data) => {
          toast.success('API key created successfully')
          setName('')
          setShowCreate(false)
          setNewKey(data.key || null)
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Failed to create API key'
          toast.error(message)
        },
      }
    )
  }

  const handleRevoke = (keyId: string, keyName: string) => {
    if (confirm(`Are you sure you want to revoke "${keyName}"? This action cannot be undone.`)) {
      revokeApiKey.mutate(keyId, {
        onSuccess: () => {
          toast.success(`API key "${keyName}" revoked successfully`)
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Failed to revoke API key'
          toast.error(message)
        },
      })
    }
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard')
  }

  const toggleVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for programmatic access
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {newKey && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-600">API Key Created!</CardTitle>
            <CardDescription>
              Make sure to copy your API key now. You won't be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={newKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={() => handleCopy(newKey)} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setNewKey(null)}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              Generate a new API key for programmatic access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="Production API Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name to help you identify this key
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createApiKey.isPending}>
                  {createApiKey.isPending ? 'Creating...' : 'Create Key'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : apiKeys && apiKeys.length > 0 ? (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                      <CardDescription>
                        Created {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
                        {apiKey.expiresAt && (
                          <> • Expires {formatDistanceToNow(new Date(apiKey.expiresAt), { addSuffix: true })}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        apiKey.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {apiKey.active ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(apiKey.id, apiKey.name)}
                      disabled={!apiKey.active || revokeApiKey.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={
                      visibleKeys.has(apiKey.id)
                        ? `sk_${apiKey.id.substring(0, 16)}...`
                        : '••••••••••••••••••••••••••••••••'
                    }
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => toggleVisibility(apiKey.id)}
                    variant="outline"
                    size="icon"
                  >
                    {visibleKeys.has(apiKey.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use this key to authenticate API requests
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
            <p className="text-muted-foreground mb-4">
              Create an API key to access the platform programmatically
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
