import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Spanish Vocab',
  description: 'Learn every word in your Spanish books',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto pt-14 md:pt-0">
            <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
