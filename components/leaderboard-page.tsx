'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { fetchLeaderboardData, fetchSpotLeaderboardData } from '@/lib/volume-service'
import { useDexStatus } from '@/context/dex-status-context'

interface PerpsLeaderboardEntry {
  rank: number
  userId: string
  address: string
  pnl: number
  vol: number
}

interface SpotLeaderboardEntry {
  rank: number
  userId: string
  address: string
  vol: number
}

interface LeaderboardData {
  leaderboardByPnl: PerpsLeaderboardEntry[]
  leaderboardByVolume: PerpsLeaderboardEntry[]
}

type SortBy = 'pnl' | 'volume'
type LeaderboardType = 'perps' | 'spot'

// Animated ranking loader component
function RankingAnimation() {
  const [animatingRanks, setAnimatingRanks] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatingRanks(prev => {
        // Shuffle ranks for animation effect
        const shuffled = [...prev].sort(() => Math.random() - 0.5)
        return shuffled
      })
    }, 300)

    return () => clearInterval(interval)
  }, [])

  return (
    <table className="w-full text-xs md:text-sm">
      <thead>
        <tr className="border-b border-border bg-secondary/50">
          <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Rank</th>
          <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Address</th>
          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground">PnL</th>
          <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground">Volume</th>
        </tr>
      </thead>
      <tbody>
        {animatingRanks.map((rank, idx) => (
          <tr key={idx} className="border-b border-border">
            <td className="px-2 md:px-6 py-3 md:py-4">
              <div className="relative h-6 md:h-7 flex items-center">
                <div
                  className="font-bold text-lg md:text-xl text-accent transition-all duration-300 ease-out"
                  style={{
                    transform: `scale(${1 + Math.sin(Date.now() / 100 + idx) * 0.1})`,
                    opacity: 0.6 + Math.sin(Date.now() / 100 + idx) * 0.4,
                  }}
                >
                  #{rank}
                </div>
              </div>
            </td>
            <td className="px-2 md:px-6 py-3 md:py-4">
              <div className="h-4 bg-secondary/30 rounded animate-pulse w-32" />
            </td>
            <td className="px-2 md:px-6 py-3 md:py-4 text-right">
              <div
                className="h-4 bg-secondary/30 rounded w-20 ml-auto"
                style={{
                  animation: `pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                }}
              />
            </td>
            <td className="px-2 md:px-6 py-3 md:py-4 text-right">
              <div
                className="h-4 bg-secondary/30 rounded w-20 ml-auto"
                style={{
                  animation: `pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                  animationDelay: '0.2s',
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LeaderboardPage({ onBack }: { onBack: () => void }) {
  const { isLoading: isDexLoading, traderStats } = useDexStatus()
  const [perpsData, setPerpsData] = useState<LeaderboardData | null>(null)
  const [spotData, setSpotData] = useState<SpotLeaderboardEntry[] | null>(null)
  const [activeTab, setActiveTab] = useState<LeaderboardType>('perps')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('volume')
  const [searchAddress, setSearchAddress] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [data, setData] = useState<LeaderboardData | null>(null)

  useEffect(() => {
    // Wait for dex status to finish loading before fetching leaderboard
    if (isDexLoading) {
      setLoading(true)
      return
    }

    const fetchLeaderboards = async () => {
      try {
        // Fetch both perps and spot leaderboards
        const [perpsApiData, spotApiData] = await Promise.all([
          fetchLeaderboardData(),
          fetchSpotLeaderboardData(),
        ])

        // Process perps data
        const byPnL = [...perpsApiData]
          .sort((a, b) => Number(b.pnl) - Number(a.pnl))
          .map((entry, idx) => ({
            rank: idx + 1,
            userId: entry.userId,
            address: entry.address,
            pnl: Number(entry.pnl),
            vol: Number(entry.vol),
          }))

        const byVolume = [...perpsApiData]
          .sort((a, b) => Number(b.vol) - Number(a.vol))
          .map((entry, idx) => ({
            rank: idx + 1,
            userId: entry.userId,
            address: entry.address,
            pnl: Number(entry.pnl),
            vol: Number(entry.vol),
          }))

        setPerpsData({
          leaderboardByPnl: byPnL,
          leaderboardByVolume: byVolume,
        })

        // Process spot data - sort by volume
        const sortedSpotData = [...spotApiData]
          .sort((a, b) => b.vol - a.vol)
          .map((entry, idx) => ({
            rank: idx + 1,
            userId: entry.userId,
            address: entry.address,
            vol: entry.vol,
          }))

        setSpotData(sortedSpotData)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboards()
  }, [isDexLoading])

  const formatNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toFixed(2)
  }

  const getAllLeaderboard = () => {
    // Return appropriate data based on active tab
    if (activeTab === 'spot') {
      if (!spotData) return []
      
      let filtered = spotData
      if (searchAddress.trim()) {
        filtered = spotData.filter(entry =>
          entry.address.toLowerCase().includes(searchAddress.toLowerCase())
        )
      }
      return [...filtered].sort((a, b) => a.rank - b.rank)
    }

    // Perps leaderboard logic
    if (!perpsData) return []
    const leaderboard = sortBy === 'pnl' ? perpsData.leaderboardByPnl : perpsData.leaderboardByVolume
    
    let filtered = leaderboard
    if (searchAddress.trim()) {
      filtered = leaderboard.filter(entry =>
        entry.address.toLowerCase().includes(searchAddress.toLowerCase())
      )
    }

    return [...filtered].sort((a, b) => a.rank - b.rank)
  }

  const allLeaderboard = getAllLeaderboard()
  const totalPages = Math.ceil(allLeaderboard.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const leaderboard = allLeaderboard.slice(startIndex, startIndex + rowsPerPage)

  // Find search result in leaderboards
  const searchResultPnL = activeTab === 'perps' && perpsData && searchAddress.trim()
    ? perpsData.leaderboardByPnl.find(entry =>
        entry.address.toLowerCase() === searchAddress.toLowerCase()
      )
    : null

  const searchResultVolume = perpsData && searchAddress.trim()
    ? perpsData.leaderboardByVolume.find(entry =>
        entry.address.toLowerCase() === searchAddress.toLowerCase()
      )
    : null

  const searchResultSpot = activeTab === 'spot' && spotData && searchAddress.trim()
    ? spotData.find(entry =>
        entry.address.toLowerCase() === searchAddress.toLowerCase()
      )
    : null

  const hasSearchResult = activeTab === 'perps' ? (searchResultPnL || searchResultVolume) : searchResultSpot

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Leaderboard Type Tabs */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-3 md:px-6 flex gap-4">
          <button
            onClick={() => {
              setActiveTab('perps')
              setCurrentPage(1)
              setSortBy('volume')
            }}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'perps'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Perps Leaderboard
          </button>
          <button
            onClick={() => {
              setActiveTab('spot')
              setCurrentPage(1)
              setSortBy('volume')
            }}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'spot'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Spot Leaderboard
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-border bg-card/50 p-3 md:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-3 md:space-y-4">
          {/* Sort By Buttons - Only for Perps */}
          {activeTab === 'perps' && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setSortBy('pnl')}
                variant={sortBy === 'pnl' ? 'default' : 'outline'}
                className={sortBy === 'pnl' ? 'bg-accent text-background hover:bg-accent/90' : ''}
                size="sm"
              >
                Sort by PnL
              </Button>
              <Button
                onClick={() => setSortBy('volume')}
                variant={sortBy === 'volume' ? 'default' : 'outline'}
                className={sortBy === 'volume' ? 'bg-accent text-background hover:bg-accent/90' : ''}
                size="sm"
              >
                Sort by Volume
              </Button>
            </div>
          )}

          {/* Search Address */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="pl-10 bg-secondary border-border focus:border-accent text-sm"
            />
          </div>

          {/* Search Result */}
          {hasSearchResult && (
            <Card className="p-0 bg-gradient-to-r from-accent/10 to-secondary border border-accent/30 overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Address Section */}
                  <div className="flex-1 min-w-0">
                    <div className="inline-block px-3 py-1 rounded-full bg-accent/20 border border-accent/40 mb-2">
                      <p className="text-xs font-semibold text-accent">SEARCH RESULT</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Your Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm md:text-base font-mono font-bold text-foreground break-all">
                        {activeTab === 'spot'
                          ? searchResultSpot?.address
                          : searchResultPnL?.address || searchResultVolume?.address}
                      </p>
                      <button
                        onClick={() => {
                          const address = activeTab === 'spot'
                            ? searchResultSpot?.address
                            : searchResultPnL?.address || searchResultVolume?.address
                          if (address) {
                            navigator.clipboard.writeText(address)
                            setCopiedAddress(address)
                            setTimeout(() => setCopiedAddress(null), 2000)
                          }
                        }}
                        className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-lg hover:bg-secondary transition-colors"
                        title="Copy address"
                      >
                        {copiedAddress === (activeTab === 'spot' ? searchResultSpot?.address : searchResultPnL?.address || searchResultVolume?.address) ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {activeTab === 'spot' ? (
                      <>
                        {/* Spot: Volume Rank */}
                        <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Volume Rank</p>
                          <p className="text-xl md:text-2xl font-bold text-accent">
                            {searchResultSpot ? `#${searchResultSpot.rank}` : 'N/A'}
                          </p>
                        </div>

                        {/* Spot: Volume Value */}
                        <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Volume Value</p>
                          <p className="text-xl md:text-2xl font-bold text-foreground">
                            {searchResultSpot ? `$${formatNumber(searchResultSpot.vol)}` : 'N/A'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Perps: Volume Rank */}
                        <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Volume Rank</p>
                          <p className="text-xl md:text-2xl font-bold text-accent">
                            {searchResultVolume ? `#${searchResultVolume.rank}` : 'N/A'}
                          </p>
                        </div>

                        {/* Perps: Volume Value */}
                        <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Volume Value</p>
                          <p className="text-xl md:text-2xl font-bold text-foreground">
                            {searchResultVolume ? `$${formatNumber(searchResultVolume.vol)}` : 'N/A'}
                          </p>
                        </div>

                        {/* Perps: PnL Rank */}
                        <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                          <p className="text-xs text-muted-foreground font-medium mb-1">PnL Rank</p>
                          <p className="text-xl md:text-2xl font-bold text-accent">
                            {searchResultPnL ? `#${searchResultPnL.rank}` : 'N/A'}
                          </p>
                        </div>

                        {/* Perps: PnL Value */}
                        <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                          <p className="text-xs text-muted-foreground font-medium mb-1">PnL Value</p>
                          <p className={`text-xl md:text-2xl font-bold ${(searchResultPnL?.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {searchResultPnL ? `${searchResultPnL.pnl >= 0 ? '+' : '-'}$${formatNumber(Math.abs(searchResultPnL.pnl))}` : 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-card border-border overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                // Ranking Animation Loader
                <RankingAnimation />
              ) : (
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Rank</th>
                      <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Address</th>
                      {activeTab === 'perps' && (
                        <>
                          <th className={`px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground ${sortBy === 'pnl' ? 'bg-secondary' : ''}`}>PnL</th>
                          <th className={`px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground ${sortBy === 'volume' ? 'bg-secondary' : ''}`}>Volume</th>
                        </>
                      )}
                      {activeTab === 'spot' && (
                        <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground">Volume</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry) => (
                        <tr
                          key={`${entry.userId}-${entry.rank}`}
                          className="border-b border-border hover:bg-secondary/30 transition-colors"
                        >
                          <td className="px-2 md:px-6 py-3 md:py-4 font-bold text-foreground">#{entry.rank}</td>
                          <td className="px-2 md:px-6 py-3 md:py-4 font-mono text-xs">
                            <div className="flex items-center gap-2">
                              <span title={entry.address} className="text-muted-foreground cursor-help">
                                {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(entry.address)
                                  setCopiedAddress(entry.address)
                                  setTimeout(() => setCopiedAddress(null), 2000)
                                }}
                                className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-secondary transition-colors"
                                title="Copy address"
                                aria-label="Copy address"
                              >
                                {copiedAddress === entry.address ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                )}
                              </button>
                            </div>
                          </td>
                          {activeTab === 'perps' && (
                            <>
                              <td className={`px-2 md:px-6 py-3 md:py-4 text-right font-semibold ${(entry as PerpsLeaderboardEntry).pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(entry as PerpsLeaderboardEntry).pnl >= 0 ? '+' : '-'}${formatNumber(Math.abs((entry as PerpsLeaderboardEntry).pnl))}
                              </td>
                              <td className="px-2 md:px-6 py-3 md:py-4 text-right text-foreground">
                                ${formatNumber((entry as PerpsLeaderboardEntry).vol)}
                              </td>
                            </>
                          )}
                          {activeTab === 'spot' && (
                            <td className="px-2 md:px-6 py-3 md:py-4 text-right text-foreground">
                              ${formatNumber((entry as SpotLeaderboardEntry).vol)}
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={activeTab === 'spot' ? 3 : 4} className="px-6 py-8 text-center text-muted-foreground">
                          {searchAddress ? 'No address found in leaderboard' : 'No leaderboard data available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer - Controls and Pagination */}
      <div className="border-t border-border bg-card/50 p-3 md:p-6 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Pagination Info */}
          <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, allLeaderboard.length)} of {allLeaderboard.length}
          </div>

          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Rows:</span>
            <div className="flex gap-1 md:gap-2">
              {[20, 50, 100].map((rows) => (
                <Button
                  key={rows}
                  onClick={() => setRowsPerPage(rows)}
                  variant={rowsPerPage === rows ? 'default' : 'outline'}
                  size="sm"
                  className={rowsPerPage === rows ? 'bg-accent text-background hover:bg-accent/90 text-xs md:text-sm px-2 md:px-3' : 'text-xs md:text-sm px-2 md:px-3'}
                >
                  {rows}
                </Button>
              ))}
            </div>
          </div>

          {/* Pagination Buttons */}
          <div className="flex gap-1 md:gap-2 flex-shrink-0">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="text-xs md:text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden md:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-1 md:gap-2 px-2 whitespace-nowrap">
              <span className="text-xs md:text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
            </div>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="text-xs md:text-sm"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
