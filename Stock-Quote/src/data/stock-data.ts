import { DefaultApi, Configuration } from "finnhub-ts";

const api = new DefaultApi(
  new Configuration({
    apiKey: import.meta.env.VITE_FINNHUB_API_KEY,
  })
);


export interface earningsReport {
  actual: number
  estimate: number
  period: string
  quarter: number
  surprise: number
}

export interface priceHistory {
  date: string
  close: number
}

export interface futureEPS {
  forwardEPS: number
  twoYearForwardEPS: number
}

export interface basicData {
  revenuePerShare: number
  grossMargin: number
  operatingMargin: number
  netMargin: number
  evEBITDA: number
  pbRatio: number
  pegRatio: number
  revGrowth_5yr: number
  revGrowth_yoy: number 
}

export interface companyProfile {
  country: string
  currency: string
  exchange: string
  industry: string
  marketCap: number
  name: string
  sharesOutstanding: number
  
}

export interface dataFormat {
  ticker: string
  currentPrice: number
  priceChange: number
  priceChangePercent: number
  earnings: earningsReport[]
  historicalPrices?: priceHistory[]
  forwardEPS: futureEPS
  basicData: basicData
  companyInfo: companyProfile
}

export const getHistoricalPrices = async (
  ticker: string,
  interval: string = '1week',
  outputsize: number = 52
): Promise<priceHistory[]> => {
  const response = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${interval}&outputsize=${outputsize}&apikey=${import.meta.env.VITE_TWELVEDATA_API_KEY}`
  )
  const data = await response.json()
  return data.values?.map((entry: any) => ({
    date: entry.datetime,
    close: parseFloat(entry.close)
  })) ?? []
}

export interface futureEPS {
  forwardEPS: number
  twoYearForwardEPS: number
}

export async function getForwardEPS(ticker: string): Promise<futureEPS> {
  const response = await fetch(
    `https://api.twelvedata.com/earnings_estimate?symbol=${ticker}&apikey=${import.meta.env.VITE_TWELVEDATA_API_KEY}`
  )
  const data = await response.json()

  const currentYear = data.earnings_estimate?.find((e: any) => e.period === 'current_year')
  const nextYear = data.earnings_estimate?.find((e: any) => e.period === 'next_year')

  return {
    forwardEPS: currentYear?.avg_estimate ?? 0,
    twoYearForwardEPS: nextYear?.avg_estimate ?? 0
  }
}

export async function getBasicData(ticker: string): Promise<basicData> {
  const { data } = await api.companyBasicFinancials(ticker, 'all');
  const metric = data?.metric as Record<string, unknown>;
  console.log("Raw Basic Financials Data:", data)
  // const revPerShare = metric?.revenuePerShareTTM;
  return {
    revenuePerShare: typeof metric?.revenuePerShareTTM === 'number' ? metric.revenuePerShareTTM : 0,
    grossMargin: typeof metric?.grossMarginTTM === 'number' ? metric.grossMarginTTM : 0,
    operatingMargin: typeof metric?.operatingMarginTTM === 'number' ? metric.operatingMarginTTM : 0,
    netMargin: typeof metric?.netProfitMarginTTM === 'number' ? metric.netProfitMarginTTM : 0,
    evEBITDA: typeof metric?.evEbitdaTTM === 'number' ? metric.evEbitdaTTM : 0,
    pbRatio: typeof metric?.pb === 'number' ? metric.pb : 0,
    pegRatio: typeof metric?.pegTTM === 'number' ? metric.pegTTM : 0,
    revGrowth_5yr: typeof metric?.revenueGrowth5Y === 'number' ? metric.revenueGrowth5Y : 0,
    revGrowth_yoy: typeof metric?.revenueGrowthQuarterlyYoy === 'number' ? metric.revenueGrowthQuarterlyYoy : 0
  }
}

// export async function getKDRatio(ticker: string): Promise<number> {
//   const { data:profile } = await api.companyProfile2(ticker);
//   const marketCap = profile?.marketCapitalization ?? 0
//   console.log("Company Profile Data:", profile)
//   return 0
// }

export async function getCompanyInfo(ticker: string): Promise<companyProfile> {
  const { data:profile } = await api.companyProfile2(ticker)

  
  // const marketCap = profile?.marketCapitalization ?? 0
  console.log("Cash Flow Data:", profile)
  return {
    country: profile?.country ?? '',
    currency: profile?.currency ?? '',
    exchange: profile?.exchange ?? '',
    industry: profile?.finnhubIndustry ?? '',
    marketCap: profile?.marketCapitalization ?? 0,
    name: profile?.name ?? '',
    sharesOutstanding: profile?.shareOutstanding ?? 0
  }
}

export async function stockData(ticker: string): Promise<dataFormat> {

  const today = new Date()
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(today.getFullYear() - 2)

  // const from = twoYearsAgo.toISOString().split('T')[0]
  // const to = today.toISOString().split('T')[0]
  // getKDRatio(ticker)
  const { data: quoteData } = await api.quote(ticker)
  const { data: earningsData } = await api.companyEarnings(ticker, 20)
  const historicalPrices = await getHistoricalPrices(ticker)
  const forwardEPS = await getForwardEPS(ticker)
  const basicData = await getBasicData(ticker)
  const companyInfo = await getCompanyInfo(ticker)
  console.log(companyInfo)
  // getCompanyInfo(ticker)
  // console.log("basicData:", basicData)
  // console.log('revenuePerShare:', revenuePerShare)
  // console.log('Forward EPS:', forwardEPS)




  return {
    ticker,
    currentPrice: quoteData.c ?? 0,
    priceChange: quoteData.d ?? 0,
    priceChangePercent: quoteData.dp ?? 0,
    earnings: earningsData?.map((e: any) => ({
      actual: e.actual ?? 0,
      estimate: e.estimate ?? 0,
      period: e.period ?? '',
      quarter: e.quarter ?? 0,
      surprise: e.surprise ?? 0
    })) ?? [],
    historicalPrices: historicalPrices,
    forwardEPS,
    basicData,
    companyInfo
  }
}