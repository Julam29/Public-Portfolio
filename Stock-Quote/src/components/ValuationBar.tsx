import { sectorAverages } from "../data/sector-averages"
import "./ValuationBar.css"

export default function ValuationBar({ industry, measure, value, flip }: { 
  industry: string
  measure: string
  value: number 
  flip: boolean
}) {
  let min = 0
  let max = 0

  if (measure === "PE") {
    min = 0
    max = 80
    if (value > max) max = value * 1.5
  } else if (measure === "Growth") {
    min = -100
    max = 100
    if (value > max) max = value * 1.5
  }

  const zones = sectorAverages(measure, industry) ?? { low: 0, high: 100 }
  const { low, high } = zones
  console.log(`ValuationBar: industry=${industry}, measure=${measure}, value=${value}, low=${low}, high=${high}, min=${min}, max=${max}`)

  const range = max - min
  const undervaluePct = (low - min)  / range * 100
  const fairPct       = (high - low) / range * 100
  const overvaluePct  = (max - high) / range * 100
  const markerPct     = (value - min) / range * 100
  const displayMarkerPct = flip ? 100 - markerPct : markerPct
  return (
    <div className="track">
      {flip ? (
        <>
          <div className="ovSection"  style={{ width: `${overvaluePct}%` }} />
          <div className="fairSection" style={{ width: `${fairPct}%` }} />
          <div className="uvSection"  style={{ width: `${undervaluePct}%` }} />
        </>
      ) : (
        <>
          <div className="uvSection"  style={{ width: `${undervaluePct}%` }} />
          <div className="fairSection" style={{ width: `${fairPct}%` }} />
          <div className="ovSection"  style={{ width: `${overvaluePct}%` }} />
        </>
      )}
      <div className="arrow-marker"     style={{ left: `${displayMarkerPct}%` }} />
    </div>
  )
}