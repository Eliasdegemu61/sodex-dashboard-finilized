'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface TraderData {
  userId: string;
  address: string;
  pnl: string;
  vol: string;
  pnl_float: number;
  vol_float: number;
}

interface ActiveTrader {
  userId: string;
  address: string;
  volChange: number;
  oldVol: number;
  newVol: number;
}

export function NewTradersTracker() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'custom'>('today');
  const [activeTraders, setActiveTraders] = useState<ActiveTrader[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<ActiveTrader | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const fetchTraderData = async (dateStr: string) => {
    try {
      const url = `https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/history/daily/${dateStr}.json`;
      console.log(`[v0] Fetching from URL: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[v0] API returned ${response.status} for date ${dateStr}`);
        return null;
      }
      
      const data = await response.json();
      
      // Validate and parse data
      if (!Array.isArray(data)) {
        console.error(`[v0] API response is not an array for ${dateStr}`);
        return null;
      }
      
      // Ensure vol_float and pnl_float are numbers
      const validData = data.map((item: any) => ({
        userId: item.userId,
        address: item.address,
        pnl: item.pnl,
        vol: item.vol,
        pnl_float: Number(item.pnl_float) || 0,
        vol_float: Number(item.vol_float) || 0,
      }));
      
      console.log(`[v0] Successfully fetched ${validData.length} traders for ${dateStr}`);
      return validData;
    } catch (error) {
      console.error(`[v0] Failed to fetch data for ${dateStr}:`, error);
      return null;
    }
  };

  const compareData = (oldData: TraderData[], newData: TraderData[]) => {
    if (!oldData || !newData || oldData.length === 0 || newData.length === 0) {
      console.error('[v0] Invalid data for comparison');
      return [];
    }

    const oldMap = new Map(oldData.map((t) => [t.address.toLowerCase(), t]));
    const active: ActiveTrader[] = [];

    for (const trader of newData) {
      const oldTrader = oldMap.get(trader.address.toLowerCase());
      if (!oldTrader) continue;

      // Parse vol strings to numbers
      const oldVol = parseFloat(oldTrader.vol) || 0;
      const newVol = parseFloat(trader.vol) || 0;
      
      // Volume change = Today's volume - Yesterday's volume
      const volChange = newVol - oldVol;

      console.log(`[v0] ${trader.address} | Yesterday: ${oldVol} | Today: ${newVol} | Change: ${volChange}`);

      // If volume changed, user is active
      if (volChange !== 0) {
        active.push({
          userId: trader.userId,
          address: trader.address,
          volChange,
          oldVol,
          newVol,
        });
      }
    }

    console.log(`[v0] Found ${active.length} active traders`);
    return active.sort((a, b) => Math.abs(b.volChange) - Math.abs(a.volChange));
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setActiveTraders([]);

      let startDateStr: string;
      let endDateStr = getDateString(new Date());

      if (timeRange === 'today') {
        startDateStr = getDateString(getDaysAgo(1));
      } else if (timeRange === 'week') {
        startDateStr = getDateString(getDaysAgo(7));
      } else if (timeRange === 'custom') {
        // Validate custom dates
        if (!customStartDate || !customEndDate) {
          setErrorMessage('Please select both start and end dates');
          return;
        }

        // Calculate difference in days
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
          setErrorMessage('Date range cannot exceed 30 days');
          return;
        }

        if (start > end) {
          setErrorMessage('Start date must be before end date');
          return;
        }

        startDateStr = customStartDate;
        endDateStr = customEndDate;
      }

      // Store the date range for display
      setDateRange({ start: startDateStr, end: endDateStr });

      console.log(`[v0] Fetching data from ${startDateStr} to ${endDateStr}`);

      const oldData = await fetchTraderData(startDateStr);
      const newData = await fetchTraderData(endDateStr);

      if (!oldData) {
        setErrorMessage(`No data available for ${startDateStr}`);
        return;
      }

      if (!newData) {
        setErrorMessage(`No data available for ${endDateStr}`);
        return;
      }

      const active = compareData(oldData, newData);
      console.log(`[v0] Found ${active.length} active traders`);
      setActiveTraders(active);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('[v0] Error analyzing traders:', error);
      setErrorMessage('Failed to fetch trader data');
      setActiveTraders([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(activeTraders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTraders = activeTraders.slice(startIndex, endIndex);

  const handleSearchAddress = () => {
    const result = activeTraders.find((t) => t.address.toLowerCase() === searchAddress.toLowerCase());
    setSearchResult(result || null);
  };

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <Card className="p-4 bg-card border border-border">
        <h2 className="text-sm md:text-lg font-bold mb-4">Active Traders</h2>
        <div className="space-y-4">
          {/* Button Group */}
          <div className="flex flex-wrap gap-2">
            {(['today', 'week'] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? 'default' : 'outline'}
                className="text-xs md:text-sm h-8 hover:bg-accent/20 dark:hover:bg-accent/20 transition-colors"
              >
                {range === 'today' ? 'Today' : 'This Week'}
              </Button>
            ))}
            <Button
              onClick={() => setTimeRange('custom')}
              variant={timeRange === 'custom' ? 'default' : 'outline'}
              className="text-xs md:text-sm h-8 hover:bg-accent/20 dark:hover:bg-accent/20 transition-colors"
            >
              Custom
            </Button>
          </div>

          {/* Custom Date Picker */}
          {timeRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-lg border border-border">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">Max range: 30 days</p>
            </div>
          )}

          {/* Apply Button */}
          <Button onClick={handleApply} disabled={loading} className="w-full h-8 text-xs">
            {loading ? 'Analyzing...' : 'Apply'}
          </Button>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">{errorMessage}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Date Range Display */}
      {(activeTraders.length > 0 || errorMessage) && (
        <div className="text-xs text-muted-foreground p-3 bg-secondary/20 rounded-lg border border-border">
          <p>
            {timeRange === 'today' ? 'Today vs Yesterday' : timeRange === 'week' ? 'This Week Range' : 'Custom Range'}
            : {dateRange.start} to {dateRange.end}
          </p>
        </div>
      )}

      {/* Results */}
      {activeTraders.length > 0 && (
        <Card className="p-4 bg-card border border-border">
          <div className="mb-4">
            <p className="text-xs md:text-sm font-semibold text-accent">
              Active Traders: {activeTraders.length}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-4 space-y-2">
            <label className="text-xs text-muted-foreground block">Search Address</label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste wallet address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
              />
              <Button onClick={handleSearchAddress} size="sm" className="h-8 text-xs">
                Check
              </Button>
            </div>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs font-mono text-muted-foreground mb-2 truncate">{searchResult.address}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Old Volume:</p>
                  <p className="font-bold">${searchResult.oldVol.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">New Volume:</p>
                  <p className="font-bold">${searchResult.newVol.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Volume Change:</p>
                  <p className="font-bold text-green-400">${searchResult.volChange.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Traders List */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Active Traders ({activeTraders.length} total)</p>
            <div className="space-y-2">
              {paginatedTraders.map((trader, idx) => (
                <div key={trader.address} className="p-2 bg-secondary/20 rounded border border-border">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-muted-foreground truncate flex-1">{trader.address}</span>
                    <span className="text-xs font-bold text-foreground ml-2">#{startIndex + idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Vol Δ:</span>
                      <span className="font-bold text-accent ml-1">
                        ${trader.volChange.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">New Vol:</span>
                      <span className="font-bold text-accent ml-1">
                        ${trader.newVol.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="space-y-3 pt-3 border-t border-border">
                {/* Rows Per Page Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page:</span>
                  <div className="flex gap-2">
                    {[10, 20, 50, 100].map((rows) => (
                      <Button
                        key={rows}
                        onClick={() => {
                          setRowsPerPage(rows);
                          setCurrentPage(1);
                        }}
                        variant={rowsPerPage === rows ? 'default' : 'outline'}
                        className="text-xs h-7 px-2"
                      >
                        {rows}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="text-xs h-7"
                  >
                    Previous
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="text-xs h-7"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {!loading && activeTraders.length === 0 && searchAddress === '' && (
        <Card className="p-4 bg-card border border-border text-center">
          <p className="text-xs text-muted-foreground">Select a time range and click Apply to view active traders</p>
        </Card>
      )}
    </div>
  );
}
