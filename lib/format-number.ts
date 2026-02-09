export function formatNumber(num: number): string {
  const absNum = Math.abs(num)
  
  if (absNum >= 1_000_000_000) {
    const billions = absNum / 1_000_000_000
    return `${billions.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}B`
  }
  
  if (absNum >= 1_000_000) {
    const millions = absNum / 1_000_000
    return `${millions.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}M`
  }
  
  if (absNum >= 1_000) {
    const thousands = absNum / 1_000
    return `${thousands.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}K`
  }
  
  return absNum.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}
