// Cache busted: v3
'use client';

import React from "react"

import { Suspense, useState, lazy, useEffect } from 'react'
import { Search, Bell, ChevronDown, Lock, Unlock, MessageCircle, MoreVertical, Moon, Sun } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/app/providers'
import { DashboardStats } from '@/components/dashboard-stats'
import { VolumeChart } from '@/components/volume-chart'
import { TopPairsWidget } from '@/components/top-pairs-widget'
import { TodayTopPairs } from '@/components/today-top-pairs'
import { TopTradersCard } from '@/components/top-traders-card'
import { TopSpotTradersCard } from '@/components/top-spot-traders-card'
import { TopGainersCard } from '@/components/top-gainers-card'
import { TopLosersCard } from '@/components/top-losers-card'
import { LeaderboardPage } from '@/components/leaderboard-page'
import { ProfitEfficiencyCard } from '@/components/profit-efficiency-card'
import { OverallProfitEfficiencyCard } from '@/components/overall-profit-efficiency-card'
import { VolumeRangeCard } from '@/components/volume-range-card'
import { AnnouncementsPanel } from '@/components/announcements-panel'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { MobileNavMenu } from '@/components/mobile-nav-menu'
import { NewTradersTracker } from '@/components/new-traders-tracker'
import { AnnouncementSidePanel } from '@/components/announcement-side-panel'
import { PortfolioSection } from '@/components/portfolio-section'
import { OpenPositions } from '@/components/open-positions'
import { TrackerSection } from '@/components/tracker-section'
import { Footer } from '@/components/footer'

function LoadingCard() {
  return <Card className="p-4 md:p-6 bg-card border border-border h-64 animate-pulse" />
}

function DistributionAnalyzerPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'distribution' | 'reverse'>('distribution')
  const [brackets, setBrackets] = useState([
    { id: '1', volMin: '', volMax: '', pnlMin: '', pnlMax: '' }
  ])
  const [reversePrefix, setReversePrefix] = useState('')
  const [reverseSuffix, setReverseSuffix] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [searchAddressResult, setSearchAddressResult] = useState<any>(null)
  const [distributionResults, setDistributionResults] = useState<any>(null)
  const [reverseResults, setReverseResults] = useState<any[]>([])
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(false)
  const [isLoadingReverse, setIsLoadingReverse] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [allTraders, setAllTraders] = useState<any[]>([])

  const addBracket = () => {
    setBrackets([...brackets, { id: Date.now().toString(), volMin: '', volMax: '', pnlMin: '', pnlMax: '' }])
  }

  const updateBracket = (id: string, field: string, value: string) => {
    setBrackets(brackets.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const removeBracket = (id: string) => {
    if (brackets.length > 1) setBrackets(brackets.filter(b => b.id !== id))
  }

  const handleApply = async () => {
    setIsLoadingDistribution(true)
    try {
      const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json')
      if (!response.ok) throw new Error('Failed to fetch data')
      const traders: any[] = await response.json()
      setAllTraders(traders)

      // Calculate stats FOR EACH BRACKET separately
      const bracketStats = brackets.map(bracket => {
        const filtered = traders.filter(trader => {
          const vol = typeof trader.vol === 'string' ? parseFloat(trader.vol) : trader.vol || 0
          const pnl = typeof trader.pnl === 'string' ? parseFloat(trader.pnl) : trader.pnl || 0
          
          const volMin = bracket.volMin ? parseFloat(bracket.volMin) : -Infinity
          const volMax = bracket.volMax ? parseFloat(bracket.volMax) : Infinity
          const pnlMin = bracket.pnlMin ? parseFloat(bracket.pnlMin) : -Infinity
          const pnlMax = bracket.pnlMax ? parseFloat(bracket.pnlMax) : Infinity

          return vol >= volMin && vol <= volMax && pnl >= pnlMin && pnl <= pnlMax
        })

        const totalVol = filtered.reduce((sum, t) => sum + (typeof t.vol === 'string' ? parseFloat(t.vol) : t.vol || 0), 0)
        const totalPnl = filtered.reduce((sum, t) => sum + (typeof t.pnl === 'string' ? parseFloat(t.pnl) : t.pnl || 0), 0)
        const profitCount = filtered.filter(t => (typeof t.pnl === 'string' ? parseFloat(t.pnl) : t.pnl || 0) > 0).length
        const lossCount = filtered.filter(t => (typeof t.pnl === 'string' ? parseFloat(t.pnl) : t.pnl || 0) < 0).length

        // Donut chart data
        const donutData = [
          { name: 'Profitable', value: profitCount, color: '#22c55e' },
          { name: 'Loss', value: lossCount, color: '#ef4444' }
        ]

        return {
          bracketId: bracket.id,
          count: filtered.length,
          totalVolume: totalVol,
          totalPnl: totalPnl,
          profitCount,
          lossCount,
          donutData,
          traders: filtered
        }
      })

      setDistributionResults(bracketStats)
    } catch (error) {
      console.error('[v0] Error filtering data:', error)
      setDistributionResults(null)
    } finally {
      setIsLoadingDistribution(false)
    }
  }

  const handleSearchAddress = async (bracketId?: string) => {
    if (!searchAddress.trim()) return
    setIsSearchingAddress(true)
    try {
      if (allTraders.length === 0) {
        const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json')
        if (!response.ok) throw new Error('Failed to fetch data')
        setAllTraders(await response.json())
      }

      const found = allTraders.find(t => (t.address || '').toLowerCase() === searchAddress.toLowerCase())
      if (found) {
        const vol = typeof found.vol === 'string' ? parseFloat(found.vol) : found.vol || 0
        const pnl = typeof found.pnl === 'string' ? parseFloat(found.pnl) : found.pnl || 0

        // Check if address fits in THIS bracket only
        let bracketMatch = null
        if (bracketId && distributionResults) {
          const bracket = brackets.find(b => b.id === bracketId)
          if (bracket) {
            const volMin = bracket.volMin ? parseFloat(bracket.volMin) : -Infinity
            const volMax = bracket.volMax ? parseFloat(bracket.volMax) : Infinity
            const pnlMin = bracket.pnlMin ? parseFloat(bracket.pnlMin) : -Infinity
            const pnlMax = bracket.pnlMax ? parseFloat(bracket.pnlMax) : Infinity
            bracketMatch = vol >= volMin && vol <= volMax && pnl >= pnlMin && pnl <= pnlMax
          }
        }

        setSearchAddressResult({ ...found, vol, pnl, matchesBracket: bracketMatch })
      } else {
        setSearchAddressResult({ notFound: true })
      }
    } catch (error) {
      console.error('[v0] Error searching address:', error)
      setSearchAddressResult(null)
    } finally {
      setIsSearchingAddress(false)
    }
  }

  const handleReverseSearch = async () => {
    if (!reversePrefix || !reverseSuffix) return
    setIsLoadingReverse(true)
    try {
      const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json')
      if (!response.ok) throw new Error('Failed to fetch data')
      const traders: any[] = await response.json()

      const prefix = reversePrefix.toLowerCase()
      const suffix = reverseSuffix.toLowerCase()

      const matched = traders.filter(trader => {
        const addr = (trader.address || '').toLowerCase()
        return addr.length >= 8 && addr.startsWith(prefix) && addr.endsWith(suffix)
      })

      setReverseResults(matched)
    } catch (error) {
      console.error('[v0] Error searching addresses:', error)
      setReverseResults([])
    } finally {
      setIsLoadingReverse(false)
    }
  }

  return (
    <div>
      <div className="border-b border-border bg-card/30 sticky top-0 z-40">
        <div className="px-3 md:px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'distribution'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Distribution Analyzer
          </button>
          <button
            onClick={() => setActiveTab('reverse')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'reverse'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Reverse Search
          </button>
          <button
            onClick={() => setActiveTab('new-traders')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'new-traders'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Active Traders
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {activeTab === 'distribution' && (
          <>
            <Card className="p-4 bg-card border border-border">
              <h2 className="text-sm md:text-lg font-bold mb-4">Distribution Analyzer</h2>
              <div className="space-y-3">
                {brackets.map((bracket, idx) => (
                  <div key={bracket.id} className="p-3 bg-secondary/30 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold">Bracket {idx + 1}</span>
                      {brackets.length > 1 && (
                        <button
                          onClick={() => removeBracket(bracket.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Vol Min</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={bracket.volMin}
                          onChange={(e) => updateBracket(bracket.id, 'volMin', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Vol Max</label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={bracket.volMax}
                          onChange={(e) => updateBracket(bracket.id, 'volMax', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">PnL Min</label>
                        <Input
                          type="number"
                          placeholder="-∞"
                          value={bracket.pnlMin}
                          onChange={(e) => updateBracket(bracket.id, 'pnlMin', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">PnL Max</label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={bracket.pnlMax}
                          onChange={(e) => updateBracket(bracket.id, 'pnlMax', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <Button onClick={addBracket} variant="outline" className="text-xs h-8 bg-transparent flex-1 md:flex-none">
                    + Add Bracket
                  </Button>
                  <Button onClick={handleApply} disabled={isLoadingDistribution} className="text-xs h-8 flex-1 md:flex-none">
                    {isLoadingDistribution ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
              </div>
            </Card>

            {distributionResults && Array.isArray(distributionResults) && (
              <div className="space-y-4">
                {distributionResults.map((bracketResult, idx) => (
                  <Card key={bracketResult.bracketId} className="p-4 bg-card border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: Stats */}
                      <div>
                        <h3 className="text-xs md:text-sm font-bold mb-3">Bracket {idx + 1}</h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Traders</span>
                            <span className="font-bold">{bracketResult.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Volume</span>
                            <span className="font-bold text-accent">${(bracketResult.totalVolume / 1e6).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total PnL</span>
                            <span className={`font-bold ${bracketResult.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${(bracketResult.totalPnl / 1e6).toFixed(1)}M
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profitable</span>
                            <span className="font-bold text-green-400">{bracketResult.profitCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Loss</span>
                            <span className="font-bold text-red-400">{bracketResult.lossCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Donut Chart */}
                      <div className="flex justify-center items-center">
                        <style>{`
                          .donut-segment {
                            filter: drop-shadow(0 0 4px currentColor);
                          }
                          .recharts-tooltip-wrapper {
                            outline: none !important;
                          }
                          .recharts-default-tooltip {
                            background-color: #1a1a1a !important;
                            border: 1px solid #333 !important;
                            border-radius: 4px !important;
                          }
                          .recharts-tooltip-label {
                            color: #ffffff !important;
                          }
                          .recharts-tooltip-item {
                            color: #ffffff !important;
                          }
                        `}</style>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={bracketResult.donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {bracketResult.donutData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color}
                                  className="donut-segment"
                                  style={{
                                    filter: `drop-shadow(0 0 4px ${entry.color})`,
                                  }}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1a1a1a', 
                                border: '1px solid #333',
                                color: '#ffffff'
                              }}
                              labelStyle={{ color: '#ffffff' }}
                              formatter={(value) => [`${value} traders`, ''], (name) => name}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Right: Search Box */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Search Address</p>
                        <Input
                          placeholder="Enter wallet address"
                          value={searchAddress}
                          onChange={(e) => setSearchAddress(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress(bracketResult.bracketId)}
                        />
                        <Button 
                          onClick={() => handleSearchAddress(bracketResult.bracketId)} 
                          disabled={isSearchingAddress}
                          size="sm"
                          className="w-full h-8 text-xs"
                        >
                          {isSearchingAddress ? 'Checking...' : 'Check'}
                        </Button>
                        {searchAddressResult && (
                          <div className="text-xs p-2 bg-secondary/30 rounded border border-border">
                            {searchAddressResult.notFound ? (
                              <p className="text-red-400">Not found</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-mono text-xs truncate">{searchAddressResult.address}</p>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Vol:</span>
                                  <span className="font-bold">${searchAddressResult.vol.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">PnL:</span>
                                  <span className={`font-bold ${searchAddressResult.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${searchAddressResult.pnl.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Fits:</span>
                                  <span className={`font-bold ${searchAddressResult.matchesBracket ? 'text-green-400' : 'text-red-400'}`}>
                                    {searchAddressResult.matchesBracket ? '✓' : '✗'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'reverse' && (
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-sm md:text-xl font-bold mb-6">Reverse Search</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">First 4 Characters</label>
                  <Input
                    placeholder="e.g., 0x1a"
                    maxLength={4}
                    value={reversePrefix}
                    onChange={(e) => setReversePrefix(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Last 4 Characters</label>
                  <Input
                    placeholder="e.g., a2f4"
                    maxLength={4}
                    value={reverseSuffix}
                    onChange={(e) => setReverseSuffix(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
              </div>
              <Button onClick={handleReverseSearch} disabled={isLoadingReverse} className="w-full md:w-auto">
                {isLoadingReverse ? 'Searching...' : 'Search'}
              </Button>

              {reverseResults.length > 0 && (
                <div className="mt-8 space-y-3">
                  <p className="text-sm text-muted-foreground">Found {reverseResults.length} matching addresses</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-3 py-2 font-semibold">Address</th>
                          <th className="px-3 py-2 font-semibold">Volume</th>
                          <th className="px-3 py-2 font-semibold">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reverseResults.map((trader, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                            <td className="px-3 py-2 font-mono text-xs">{trader.address || 'N/A'}</td>
                            <td className="px-3 py-2">${typeof trader.vol === 'string' ? parseFloat(trader.vol).toFixed(0) : trader.vol || 0}</td>
                            <td className={`px-3 py-2 ${(trader.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${typeof trader.pnl === 'string' ? parseFloat(trader.pnl).toFixed(0) : trader.pnl || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'new-traders' && (
          <NewTradersTracker />
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { theme, toggleTheme, mounted } = useTheme()
  const [currentPage, setCurrentPage] = useState<'dex-status' | 'tracker' | 'portfolio' | 'leaderboard' | 'analyzer'>('dex-status')
  const [searchAddressInput, setSearchAddressInput] = useState('')
  const [trackerSearchAddress, setTrackerSearchAddress] = useState('')

  // Pre-load leaderboard data on mount
  useEffect(() => {
    // Trigger leaderboard data fetch by switching to it briefly or by fetching directly
    setCurrentPage('leaderboard');
    // Then switch back to dex-status
    const timer = setTimeout(() => {
      setCurrentPage('dex-status');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSearchBarSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchAddressInput.trim()) {
      setTrackerSearchAddress(searchAddressInput)
      setCurrentPage('tracker')
      setSearchAddressInput('')
    }
  }
  
  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-3 md:px-6 gap-2 md:gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img
              src={theme === 'dark' ? 'https://sodex.com/_next/image?url=%2Flogo%2Flogo.webp&w=256&q=75' : 'https://testnet.sodex.com/assets/SoDEX-Dh5Mk-Pl.svg'}
              alt="Sodex Logo"
              className="h-7 w-auto object-contain"
              loading="eager"
              decoding="async"
            />
            <span className="hidden sm:inline text-xs md:text-sm font-semibold text-foreground">Tracker</span>
          </div>

          <div className="flex-1 max-w-xs md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search address"
                className="pl-10 bg-secondary border-border focus:border-accent text-xs md:text-sm"
                value={searchAddressInput}
                onChange={(e) => setSearchAddressInput(e.target.value)}
                onKeyDown={handleSearchBarSubmit}
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setCurrentPage('dex-status')}
              className={`text-xs md:text-sm border-b-2 transition-all pb-1 font-semibold ${
                currentPage === 'dex-status'
                  ? 'text-foreground border-b-orange-400'
                  : 'text-foreground border-transparent hover:text-orange-400 hover:border-b-orange-400'
              }`}
            >
              Dex Status
            </button>
            <button
              onClick={() => setCurrentPage('tracker')}
              className={`text-xs md:text-sm border-b-2 transition-all pb-1 ${
                currentPage === 'tracker'
                  ? 'text-foreground border-b-orange-400'
                  : 'text-foreground border-transparent hover:text-orange-400 hover:border-b-orange-400'
              }`}
            >
              Tracker
            </button>
            <button
              onClick={() => setCurrentPage('portfolio')}
              className={`text-xs md:text-sm border-b-2 transition-all pb-1 ${
                currentPage === 'portfolio'
                  ? 'text-foreground border-b-orange-400'
                  : 'text-foreground border-transparent hover:text-orange-400 hover:border-b-orange-400'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setCurrentPage('leaderboard')}
              className={`text-xs md:text-sm border-b-2 transition-all pb-1 ${
                currentPage === 'leaderboard'
                  ? 'text-foreground border-b-orange-400'
                  : 'text-foreground border-transparent hover:text-orange-400 hover:border-b-orange-400'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setCurrentPage('analyzer')}
              className={`text-xs md:text-sm border-b-2 transition-all pb-1 ${
                currentPage === 'analyzer'
                  ? 'text-foreground border-b-orange-400'
                  : 'text-foreground border-transparent hover:text-orange-400 hover:border-b-orange-400'
              }`}
            >
              Analyzer
            </button>
          </div>

          <MobileNavMenu currentPage={currentPage} onNavigate={setCurrentPage} />

          <div className="flex items-center gap-2 md:gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground h-9 w-9"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
            )}
            <a href="https://sodex.com/join/TRADING" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="hidden md:flex items-center gap-2 text-foreground hover:bg-secondary px-3 h-9">
                <img 
                  src="https://ssi.sosovalue.com/_next/image?url=%2Fimages%2Fwhat-is-soso%2F%24soso.png&w=256&q=75" 
                  alt="SOSO" 
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold text-accent">Trade</span>
              </Button>
            </a>
            <Button
              variant="ghost"
              className="hidden md:flex items-center gap-2 text-foreground hover:bg-secondary px-2 h-9"
            >
              <span className="text-xs font-semibold text-accent">v1.01</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Only render active tab */}
      {currentPage === 'dex-status' && (
        <div className="flex flex-col lg:flex-row overflow-y-auto w-full">
          {/* Top Stats - Mobile Only */}
          <div className="w-full lg:hidden p-3 order-0 border-b border-border">
            <DashboardStats variant="compact" />
          </div>

          {/* Left Sidebar */}
          <div className="w-full lg:w-64 lg:border-r border-border p-3 md:p-4 space-y-4 lg:flex-shrink-0 order-2 lg:order-1">
            {/* Key Metrics */}
            <div className="hidden lg:block">
              <DashboardStats />
            </div>

            {/* Overall Profit Efficiency */}
            <OverallProfitEfficiencyCard />

            {/* Top Pairs */}
            <TodayTopPairs />

            {/* Top Traders (Perps) */}
            <TopTradersCard />
          </div>

          {/* Center Content */}
          <div className="flex-1 lg:border-r border-border p-2 md:p-6 space-y-2 md:space-y-4 lg:flex-shrink-0 order-1 lg:order-2">
            {/* Chart Area */}
            <VolumeChart />

            {/* Volume Range Analysis */}
            <VolumeRangeCard />

            {/* Top Trading Pairs */}
            <TopPairsWidget />
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-72 lg:border-l border-border p-2 md:p-4 space-y-2 md:space-y-4 lg:flex-shrink-0 order-3">
            {/* Announcements */}
            <AnnouncementsPanel />

            {/* Top Gainers */}
            <TopGainersCard />

            {/* Top Losers */}
            <TopLosersCard />

              {/* SoDex Promo Card */}
            <div className="relative overflow-hidden rounded-lg border border-border hover:border-accent/50 transition-all duration-300 group">
              {/* Background Image */}
              <img
                src="https://sodex.com/_next/image?url=%2Fimg%2Fhome%2Fcontent1-inner.webp&w=1920&q=75"
                alt="Trade on SoDex"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
                <a
                  href="https://sodex.com/join/TRADING"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <button
                    type="button"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 font-sans"
                  >
                    Trade on SoDex
                  </button>
                </a>
              </div>
            </div>

            {/* Top Traders Spot */}
            <TopSpotTradersCard />
          </div>
        </div>
      )}

      {currentPage === 'tracker' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6 overflow-y-auto w-full">
            <TrackerSection initialSearchAddress={trackerSearchAddress} />
          </div>
        </Suspense>
      )}

      {currentPage === 'portfolio' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6 overflow-y-auto w-full space-y-6">
            <PortfolioSection />
            <OpenPositions />
          </div>
        </Suspense>
      )}

      {currentPage === 'leaderboard' && (
        <Suspense fallback={<LoadingCard />}>
          <LeaderboardPage />
        </Suspense>
      )}

      {currentPage === 'analyzer' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6">
            <DistributionAnalyzerPage onBack={() => setCurrentPage('dex-status')} />
          </div>
        </Suspense>
      )}

      {/* Announcement Side Panel */}
      <AnnouncementSidePanel />
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
