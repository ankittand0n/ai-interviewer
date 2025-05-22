import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RootLayout as ClientRootLayout } from "@/components/layout/root-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Technical Interview System",
  description: "AI-powered technical interview platform",
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  )
}
