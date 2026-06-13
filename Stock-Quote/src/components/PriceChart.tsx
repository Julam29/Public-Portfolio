import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, Title, CategoryScale, Tooltip, Legend
} from 'chart.js'
import { getHistoricalPrices } from '../data/stock-data'
import type { priceHistory } from '../data/stock-data'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

interface Props {
  ticker: string
  historicalPrices: priceHistory[]
}

type Range = '5D' | '1M' | '6M' | '1Y' | '5Y'

const rangeConfig: Record<Range, { interval: string; outputsize: number }> = {
  '5D':  { interval: '1day',   outputsize: 5  },
  '1M':  { interval: '1day',   outputsize: 30 },
  '6M':  { interval: '1week',  outputsize: 26 },
  '1Y':  { interval: '1week',  outputsize: 52 },
  '5Y':  { interval: '1month', outputsize: 60 },
}

const PriceChart = ({ ticker, historicalPrices }: Props) => {
  const [range, setRange] = useState<Range>('1Y')
  const [prices, setPrices] = useState<priceHistory[]>([...historicalPrices].reverse())
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true)
      const { interval, outputsize } = rangeConfig[range]
      const data = await getHistoricalPrices(ticker, interval, outputsize)
      setPrices([...data].reverse())
      setLoading(false)
    }
    fetchPrices()
  }, [range, ticker])

  const data = {
    labels: prices.map(p => p.date),
    datasets: [{
      label: ticker,
      data: prices.map(p => p.close),
      borderColor: 'steelblue',
      backgroundColor: 'rgba(70, 130, 180, 0.2)',
      fill: true
    }]
  }

  const options = {
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items: any) => `Date: ${items[0].label}`,
          label: (item: any) => `Price: $${item.raw.toFixed(2)}`
        }
      }
    }
  }

  const ranges: Range[] = ['5D', '1M', '6M', '1Y', '5Y']

  return (
    <div>
      {loading ? <p>Loading chart...</p> : <Line data={data} options={options} />}
      <div className="chart-styles">
        {ranges.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`range-btn ${range === r ? 'active' : ''}`}
          >
            {r}
          </button>
        ))}
      </div>

    </div>
  )
}

export default PriceChart