'use client'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AuthProvider } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Toaster } from "sonner"

export function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = pathname === '/' || pathname.startsWith('/interview/')

  return (
    <AuthProvider>
      {isPublicRoute ? (
        children
      ) : (
        <ProtectedRoute>
          <DashboardLayout>{children}</DashboardLayout>
        </ProtectedRoute>
      )}
      <Toaster />
    </AuthProvider>
  )
} 