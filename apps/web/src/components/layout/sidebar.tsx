'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Layers,
  Users,
  Key,
  Settings,
  Activity,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Topics', href: '/topics', icon: Layers },
  { name: 'Consumer Groups', href: '/consumer-groups', icon: Users },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const workspace = useWorkspaceStore((state) => state.currentWorkspace)

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-border/50 bg-card/30 backdrop-blur-xl">
      {/* Logo & Workspace */}
      <div className="border-b border-border/50 p-6">
        <Link href="/" className="flex items-center space-x-3 group mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center stream-glow group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              Stream<span className="text-gradient">Forge</span>
            </h1>
          </div>
        </Link>

        {workspace && (
          <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Workspace</p>
            <p className="text-sm font-semibold text-foreground truncate">{workspace.name}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary to-secondary text-background shadow-lg stream-glow'
                  : 'text-foreground hover:bg-background/50 hover:translate-x-1'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive ? "text-background" : "text-muted-foreground group-hover:text-primary"
                )} />
                <span>{item.name}</span>
              </div>

              {isActive && (
                <ChevronRight className="h-4 w-4 text-background" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-[hsl(var(--stream-pink))]/10 p-4 border border-primary/20">
          <p className="text-xs font-medium text-foreground mb-1">StreamForge v0.1.0</p>
          <p className="text-xs text-muted-foreground">Event Streaming Platform</p>
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-primary font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
