'use client'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { useLogout } from '@/lib/hooks'
import { LogOut, User, Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()

  return (
    <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-8">
        {/* Left Side - Search */}
        <div className="flex items-center gap-6 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search topics, events, or settings..."
              className="pl-11 h-11 bg-card/50 border-border/50 focus:border-primary transition-colors w-full"
            />
          </div>
        </div>

        {/* Right Side - User Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-card/50 h-11 w-11 rounded-xl"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </Button>

          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 border border-border/50">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-background" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-foreground leading-none mb-1">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground leading-none">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Logout */}
          <Button
            onClick={() => logout.mutate()}
            variant="outline"
            size="default"
            disabled={logout.isPending}
            className="border-border/50 hover:bg-card/50 hover:border-destructive/50 hover:text-destructive transition-all h-11 rounded-xl"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </header>
  )
}
