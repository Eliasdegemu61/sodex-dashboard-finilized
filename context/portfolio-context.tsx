'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { EnrichedPosition } from '@/lib/sodex-api';
import { fetchAllPositions, enrichPositions } from '@/lib/sodex-api';

interface PortfolioContextType {
  walletAddress: string | null;
  userId: string | null;
  positions: EnrichedPosition[];
  isLoading: boolean;
  error: string | null;
  setWalletAddress: (address: string, userId: string, positions: EnrichedPosition[]) => Promise<void>;
  clearWalletAddress: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ 
  children, 
  initialUserId, 
  initialPositions 
}: { 
  children: React.ReactNode;
  initialUserId?: string | null;
  initialPositions?: EnrichedPosition[];
}) {
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(initialUserId || null);
  const [positions, setPositions] = useState<EnrichedPosition[]>(initialPositions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage and fetch positions
  useEffect(() => {
    if (initialUserId) {
      // Use initial data provided (for tracker)
      return;
    }
    
    const loadPortfolioData = async () => {
      if (typeof window !== 'undefined') {
        const savedAddress = localStorage.getItem('portfolio_wallet_address');
        const savedUserId = localStorage.getItem('portfolio_user_id');

        if (savedAddress && savedUserId) {
          setWalletAddressState(savedAddress);
          setUserIdState(savedUserId);
          
          try {
            // Fetch and enrich positions for the saved userId
            const positions = await fetchAllPositions(parseInt(savedUserId));
            const enrichedPos = await enrichPositions(positions);
            setPositions(enrichedPos);
          } catch (err) {
            console.error('[v0] Failed to load saved portfolio:', err);
          }
        }
      }
    };
    
    loadPortfolioData();
  }, [initialUserId]);

  const setWalletAddress = useCallback(
    async (address: string, userId: string, enrichedPositions: EnrichedPosition[]) => {
      try {
        console.log('[v0] Setting wallet address:', address);
        console.log('[v0] With userId:', userId);
        console.log('[v0] And positions count:', enrichedPositions.length);

        // Save only address and userId to localStorage
        localStorage.setItem('portfolio_wallet_address', address);
        localStorage.setItem('portfolio_user_id', userId);

        setWalletAddressState(address);
        setUserIdState(userId);
        setPositions(enrichedPositions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save portfolio';
        console.error('[v0] Error setting wallet address:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const clearWalletAddress = useCallback(() => {
    localStorage.removeItem('portfolio_wallet_address');
    localStorage.removeItem('portfolio_user_id');
    setWalletAddressState(null);
    setUserIdState(null);
    setPositions([]);
    setError(null);
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        walletAddress,
        userId,
        positions,
        isLoading,
        error,
        setWalletAddress,
        clearWalletAddress,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
}
