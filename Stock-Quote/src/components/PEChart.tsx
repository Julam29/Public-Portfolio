import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, Title, CategoryScale, Tooltip, Legend
} from 'chart.js'
import { getPEHistory } from '../data/pe-data'
import type { earningsReport } from '../data/stock-data'
import type { peHistory } from '../data/pe-data'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

interface Props {
  ticker: string
  earnings: earningsReport[]
}

type Range = '6M' | '1Y' | '5Y'

const rangeConfig: Record<Range, { interval: string; outputsize: number }> = {
  '6M': { interval: '1week',  outputsize: 26 },
  '1Y': { interval: '1week',  outputsize: 52 },
  '5Y': { interval: '1month', outputsize: 60 },
}

const PEChart = ({ ticker, earnings }: Props) => {
  const [range, setRange] = useState<Range>('1Y')
  const [peData, setPEData] = useState<peHistory[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchPE = async () => {
      setLoading(true)
      const { interval, outputsize } = rangeConfig[range]
      const data = await getPEHistory(ticker, earnings, interval, outputsize)
      setPEData(data)
      setLoading(false)
    }
    fetchPE()
  }, [range, ticker])

  const data = {
    labels: peData.map(p => p.date),
    datasets: [{
      label: `${ticker} P/E Ratio`,
      data: peData.map(p => p.pe),
      borderColor: 'tomato',
      backgroundColor: 'rgba(255, 99, 71, 0.2)',
      fill: true
    }]
  }

  const options = {
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items: any) => `Date: ${items[0].label}`,
          label: (item: any) => `P/E: ${item.raw}`
        }
      }
    }
  }

  const ranges: Range[] = ['6M', '1Y', '5Y']

  return (
    <div>
      <div>
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
      {loading
        ? <p>Loading P/E chart...</p>
        : peData.length === 0
          ? <p>Not enough earnings data to calculate P/E history</p>
          : <Line data={data} options={options} />
      }
    </div>
  )
}

export default PEChart