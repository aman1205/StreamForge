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
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="border-b p-6">
        <h1 className="text-xl font-bold">StreamForge</h1>
        {workspace && (
          <p className="text-sm text-gray-600 mt-1">{workspace.name}</p>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-gray-500">
          <p>StreamForge v0.1.0</p>
          <p className="mt-1">Distributed Event Streaming</p>
        </div>
      </div>
    </aside>
  )
}
