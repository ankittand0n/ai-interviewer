'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/') {
      router.push('/')
    }
  }, [isAuthenticated, router, pathname])

  if (!isAuthenticated && pathname !== '/') {
    return null
  }

  return <>{children}</>
} 