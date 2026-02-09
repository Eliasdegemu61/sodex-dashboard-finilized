'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Footer() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <footer className="border-t border-border bg-card/30 mt-12">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* X (Twitter) Link */}
          <a
            href="https://x.com/eliasing__"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-6 h-6 rounded bg-secondary hover:bg-secondary/80 transition-colors"
            title="Follow on X"
            aria-label="Follow on X"
          >
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694-5.829 6.694h-3.328l7.71-8.835L.424 2.25h6.679l4.882 6.268L17.75 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117l12.926 15.644z" />
            </svg>
          </a>

          {/* Telegram Link */}
          <a
            href="https://t.me/fallphile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-6 h-6 rounded bg-secondary hover:bg-secondary/80 transition-colors"
            title="Chat on Telegram"
            aria-label="Chat on Telegram"
          >
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.501-1.359 8.627-.168.927-.496 1.235-.814 1.266-.692.063-1.218-.454-1.887-.89-1.048-.681-1.639-1.105-2.664-1.77-1.182-.766-.415-1.187.258-1.876.177-.185 3.247-2.977 3.305-3.23.007-.032.014-.15-.056-.212-.069-.062-.171-.041-.244.007-.103.087-1.657 1.045-4.677 3.074-.442.298-.844.445-1.212.438-.399-.007-.116-.06-2.851-.617-1.447-.314-2.723-.481-2.612-1.016.055-.265.418-.427 1.158-.591 4.531-1.424 7.566-2.094 9.061-2.539.847-.27 1.605-.42 2.186-.42.058 0 .119.002.18.006z" />
            </svg>
          </a>

          <span className="text-muted-foreground">•</span>

          <p className="text-xs text-muted-foreground">
            Built by <span className="font-semibold text-foreground">Elias</span>
          </p>

          <span className="text-muted-foreground">•</span>

          <button
            onClick={() => setShowDisclaimer(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            title="View disclaimer"
          >
            Disclaimer
          </button>
        </div>
      </div>

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Disclaimer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              This dashboard is an independent, community built analytics tool created for tracking on-chain activity related to SoDEX. It is not affiliated with, endorsed by, or operated by the SoDEX team. All data is provided for informational purposes only and should not be considered financial advice. Always verify transactions and contract addresses directly on the blockchain before making any decisions.
            </p>
            <p className="pt-2 border-t border-border">
              - Elias (SoDex OG)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
