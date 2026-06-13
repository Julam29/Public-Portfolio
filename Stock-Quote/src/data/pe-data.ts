import { getHistoricalPrices } from './stock-data'
import type { priceHistory, earningsReport } from './stock-data'

export interface peHistory {
  date: string
  pe: number
}

const getTTMeps = (date: string, earnings: earningsReport[]): number => {
  const priorEarnings = earnings
    .filter(e => new Date(e.period) <= new Date(date))
    .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
    .slice(0, 4)

  // ✅ add these logs
  console.log(`Date: ${date} — Prior earnings found: ${priorEarnings.length}`)
  console.log('Earnings periods:', priorEarnings.map(e => e.period))

  if (priorEarnings.length < 4) return 0
  return priorEarnings.reduce((sum, e) => sum + e.actual, 0)
}

export const getPEHistory = async (
  ticker: string,
  earnings: earningsReport[],
  interval: string = '1week',
  outputsize: number = 52
): Promise<peHistory[]> => {
  console.log('All earnings periods:', earnings.map(e => e.period))  // ✅ add this
  console.log('Total earnings quarters:', earnings.length)

  const prices = await getHistoricalPrices(ticker, interval, outputsize)
  const sortedPrices = [...prices].reverse()

  return sortedPrices
    .map(price => {
      const ttmEPS = getTTMeps(price.date, earnings)
      return {
        date: price.date,
        pe: ttmEPS !== 0 ? parseFloat((price.close / ttmEPS).toFixed(2)) : 0
      }
    })
    .filter(p => p.pe !== 0)
}