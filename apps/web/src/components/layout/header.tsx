'use client'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { useLogout } from '@/lib/hooks'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            Welcome back, {user?.name || 'User'}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            {user?.email}
          </div>
          <Button
            onClick={() => logout.mutate()}
            variant="outline"
            size="sm"
            disabled={logout.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
