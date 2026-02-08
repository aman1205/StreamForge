'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspaceStore } from '@/lib/store'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/lib/hooks'
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Shield, Clock, AlertCircle } from 'lucide-react'
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
    <div className="space-y-8 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">API Keys</h1>
          <p className="text-lg text-muted-foreground">
            Manage authentication credentials for programmatic access
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow h-12 rounded-xl"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create API Key
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && apiKeys && apiKeys.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription>Total Keys</CardDescription>
              <CardTitle className="text-3xl font-bold text-gradient">{apiKeys.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription>Active Keys</CardDescription>
              <CardTitle className="text-3xl font-bold text-gradient">
                {apiKeys.filter(k => k.active).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription>Revoked Keys</CardDescription>
              <CardTitle className="text-3xl font-bold text-gradient">
                {apiKeys.filter(k => !k.active).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* New Key Alert */}
      {newKey && (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/10 via-secondary/10 to-[hsl(var(--stream-pink))]/10 animate-slide-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-primary text-xl">API Key Created!</CardTitle>
                <CardDescription className="text-base">
                  Copy your key now - you won't be able to see it again
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-xl bg-background/80 border border-primary/30">
              <code className="flex-1 font-mono text-sm text-primary overflow-auto">
                {newKey}
              </code>
              <Button
                onClick={() => handleCopy(newKey)}
                variant="outline"
                size="icon"
                className="hover:bg-primary/10 rounded-lg flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setNewKey(null)}
              variant="outline"
              className="border-border/50 hover:bg-background/50 rounded-xl"
            >
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Key className="h-6 w-6 text-primary" />
              Create New API Key
            </CardTitle>
            <CardDescription className="text-base">
              Generate a new key for API authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-base font-semibold">Key Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production API, Development Key, Mobile App"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary text-base"
                />
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Choose a descriptive name to identify this key's purpose
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/30">
                <Button
                  type="submit"
                  disabled={createApiKey.isPending}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity rounded-xl"
                >
                  {createApiKey.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Create Key
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false)
                    setName('')
                  }}
                  className="border-border/50 hover:bg-background/50 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : apiKeys && apiKeys.length > 0 ? (
        <div className="space-y-6">
          {apiKeys.map((apiKey, index) => (
            <Card
              key={apiKey.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Key className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{apiKey.name}</CardTitle>
                        <Badge variant={apiKey.active ? 'success' : 'destructive'}>
                          {apiKey.active ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            'Revoked'
                          )}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4" />
                        Created {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
                        {apiKey.expiresAt && (
                          <> • Expires {formatDistanceToNow(new Date(apiKey.expiresAt), { addSuffix: true })}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {apiKey.active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(apiKey.id, apiKey.name)}
                      disabled={revokeApiKey.isPending}
                      className="hover:bg-destructive/10 hover:text-destructive rounded-xl"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-4 rounded-xl bg-background/50 border border-border/30">
                  <code className="flex-1 font-mono text-sm overflow-auto">
                    {visibleKeys.has(apiKey.id)
                      ? `sk_${apiKey.id.substring(0, 16)}...`
                      : '••••••••••••••••••••••••••••••••'}
                  </code>
                  <Button
                    onClick={() => toggleVisibility(apiKey.id)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-background/50 rounded-lg flex-shrink-0"
                  >
                    {visibleKeys.has(apiKey.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleCopy(`sk_${apiKey.id}`)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-background/50 rounded-lg flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ID: {apiKey.id}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-20 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-6">
              <Key className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No API keys yet</h3>
            <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
              Create an API key to access the StreamForge platform programmatically
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Your First API Key
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
