'use client'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AuthProvider } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Toaster } from "sonner"

export function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/'

  return (
    <AuthProvider>
      <ProtectedRoute>
        {isLoginPage ? children : <DashboardLayout>{children}</DashboardLayout>}
      </ProtectedRoute>
      <Toaster />
    </AuthProvider>
  )
} 