'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AnnouncementContextType {
  selectedArticleId: number | null
  setSelectedArticleId: (id: number | null) => void
}

const AnnouncementContext = createContext<AnnouncementContextType | null>(null)

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null)

  return (
    <AnnouncementContext.Provider value={{ selectedArticleId, setSelectedArticleId }}>
      {children}
    </AnnouncementContext.Provider>
  )
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext)
  if (!context) {
    throw new Error('useAnnouncement must be used within AnnouncementProvider')
  }
  return context
}
