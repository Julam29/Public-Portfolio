import { useState } from 'react'
import { stockData, type earningsReport } from '../data/stock-data'
import { formatMillions } from '../data/number-conversion'
import '../App.css'
import PriceChart from '../components/PriceChart'
import ValuationBar from '../components/ValuationBar'
// import PEChart from '../components/PEChart'

function App() {
  const [ticker, setTicker] = useState<string>('AAPL')
  const [result, setResult] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  

  const handleSearch = async () => {
    if (!ticker) return
    setLoading(true)
    setError(null)

  try {
    const data = await stockData(ticker.toUpperCase())
    setResult(data)

  try {
    const res = await fetch('http://localhost:3000/api/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), companyName: data.companyInfo.name })
    })
    const { description } = await res.json()
    setDescription(description)
    } catch {
      console.log('AI description unavailable')  // fails silently
    }

    } catch (err) {
      setError('Stock not found')  // only triggers if stockData fails
    } finally {
      setLoading(false)
    }
  }
  // console.log('Result:', description)



return (
  
  <div>
    <header>
      <div className="search">
        <input
          type="text"
          placeholder="Search for a stock..."
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      
      <h1> .    S</h1>
    </header>

    {loading && <p>Loading...</p>}
    {error && <p>{error}</p>}

    {result && (() => {
      const totalActualEPS = result.earnings.reduce((sum: number, e: earningsReport) => sum + (e.actual ?? 0), 0)
      const trailingPE = totalActualEPS !== 0 ? result.currentPrice / totalActualEPS : 0
      const forwardPE = result.forwardEPS.forwardEPS !== 0 ? result.currentPrice / result.forwardEPS.forwardEPS : 0
      const twoYearForwardPE = result.forwardEPS.twoYearForwardEPS !== 0 ? result.currentPrice / result.forwardEPS.twoYearForwardEPS : 0
      const trailingPS = result.basicData.revenuePerShare !== 0 ? result.currentPrice / result.basicData.revenuePerShare : 0
      
      return (
        <div>
          <p>
            <span className="companyTitle">{result.companyInfo.name} </span>
            <span className = "currency">{result.companyInfo.currency}</span>
          </p>
          <p className="exchangeTitle">{result.companyInfo.exchange}</p>
          
          <div className="sideBySide">
            <div className="priceChart">
              {result.historicalPrices && (
                  <PriceChart
                    ticker={result.ticker}
                    historicalPrices={result.historicalPrices}
                  />
              )}
            </div>
            <div className="keyData">
              <h2 className="keyTitle">Key Data</h2>
              <p className = "keyDataValues">PE: {trailingPE.toFixed(2)}</p>
              <p className = "keyDataValues">Market Cap: ${formatMillions(result.companyInfo.marketCap)}</p>
            </div>
          </div>
          <div className="aboutCompany">
            <h2 className = "descriptionTitle">About {result.companyInfo.name}</h2>
            {description && <p className="companyDescription">{description}</p>}
          </div>
          {/* <PEChart ticker={result.ticker} earnings={result.earnings} /> */}
          <div className="metricsColumn">
            <h3>Earnings Data</h3>
            <div className="metricsGrid">
              <p>Total EPS: {totalActualEPS.toFixed(2)}</p>
              <p>Trailing P/E: {trailingPE.toFixed(2)}</p>
              <p>Forward P/E: {forwardPE.toFixed(2)}</p>
              {/* <p>2-Year Forward P/E Ratio: {twoYearForwardPE.toFixed(2)}</p> */}
              {/* <p>Trailing P/S Ratio: {trailingPS.toFixed(2)}</p> */}
            </div>  

            <h3>Valuation</h3>
            <div className="metricsGrid">
              <p>Trailing P/E: {trailingPE.toFixed(2)}</p>
              <p>Forward P/E: {forwardPE.toFixed(2)}</p>
              <p>2-Year Forward P/E: {twoYearForwardPE.toFixed(2)}</p>
              <p>Trailing P/S: {trailingPS.toFixed(2)}</p>
              <p>EV/EBITDA: {result.basicData.evEBITDA.toFixed(2)}</p>
              <p>P/B: {result.basicData.pbRatio.toFixed(2)}</p>
              <p>PEG Ratio: {result.basicData.pegRatio.toFixed(2)}</p>
            </div>

            <h3>Profitability</h3>
            <div className="metricsGrid">
              <p>Gross Margins: {result.basicData.grossMargin.toFixed(2)}</p>
              <p>Operating Margins: {result.basicData.operatingMargin.toFixed(2)}</p>
              <p>Net Margins: {result.basicData.netMargin.toFixed(2)}</p>
            </div>

            <h3>Growth</h3>
            <div className="metricsGrid">
              <p>5-Year CAGR: {result.basicData.revGrowth_5yr.toFixed(2)} %</p>
              <p>Yoy Revenue Growth: {result.basicData.revGrowth_yoy.toFixed(2)}%</p>
            </div>
            {/* {description && <p className="companyDescription">{description}</p>} */}
          </div>

          <div className="valuationBarSection">
            <h2>Valuation vs. Sector Averages</h2>
            <div className = "PEValuationBar">
              {/* valuationBar(result.companyInfo.industry, "PE", trailingPE) */}
              <ValuationBar 
              industry={result.companyInfo.industry}
              measure="PE"
              value={trailingPE}
              flip={false} />
            </div>

            <div className = "GrowthValuationBar">
              {/* valuationBar(result.companyInfo.industry, "PE", trailingPE) */}
              <ValuationBar 
              industry={result.companyInfo.industry}
              measure="Growth"
              value={result.basicData.revGrowth_yoy}
              flip={true} />
            </div>

            <div className = "PEValuationBar">
              {/* valuationBar(result.companyInfo.industry, "PE", trailingPE) */}
              <ValuationBar 
              industry={result.companyInfo.industry}
              measure="PE"
              value={trailingPE}
              flip={true} />
            </div>
          </div>
        </div>
      )
    })()}
    {/* <div className="footer"></div> */}
  </div>
)
}

export default App