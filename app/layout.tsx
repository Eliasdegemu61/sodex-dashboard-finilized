import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/app/providers'
import { AnnouncementProvider } from '@/context/announcement-context'
import { ThemeProvider } from '@/context/theme-context'
import { FAVICON_DATA_URI } from '@/lib/image-constants'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Sodex - DEX Dashboard',
  description: 'Professional DEX dashboard for portfolio tracking, address monitoring, and performance analytics',
  generator: 'v0.app',
  icons: {
    icon: FAVICON_DATA_URI,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <AnnouncementProvider>
          <Providers>
            {children}
          </Providers>
        </AnnouncementProvider>
        <Analytics />
      </body>
    </html>
  )
}
