import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/ui/AuthProvider'
import Navbar from '@/components/ui/Navbar'
import SafetyAlerts from '@/components/ui/SafetyAlerts'

export const metadata: Metadata = {
  title: 'NagarIQ — Community Intelligence Platform',
  description: 'AI-powered civic issue reporting, tracking, and accountability for your neighbourhood',
  manifest: '/manifest.json',
  themeColor: '#2a8aff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <SafetyAlerts />
        </AuthProvider>
      </body>
    </html>
  )
}