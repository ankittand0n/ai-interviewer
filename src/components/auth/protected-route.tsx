'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isPublicRoute = pathname === '/' || pathname.startsWith('/interview/')

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/')
    }
  }, [isAuthenticated, router, pathname, isPublicRoute])

  if (!isAuthenticated && !isPublicRoute) {
    return null
  }

  return <>{children}</>
} 