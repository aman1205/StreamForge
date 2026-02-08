'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useWorkspaceStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, workspace } = useAuthStore()
  const setCurrentWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace);
  console.log(workspace ,user ,"console")

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }, [user, workspace, router, setCurrentWorkspace])

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-8 scrollbar-thin">{children}</main>
      </div>
    </div>
  )
}
