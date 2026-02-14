// App.tsx
import Dashboard from './components/Dashboard'

export default function App() {
  return <Dashboard />
}

// import { useCallback, useEffect, useState } from 'react'
// import TVChart from './components/TVChart'
// import TopNav from './components/TopNav'
// import LeftToolbar from './components/LeftToolbar'
// import RightWatchlist from './components/RightWatchlist'
// import { TopBar } from './components/TopBar'// ✅ FIXED IMPORT

// import type { Timeframe } from './lib/timeframes'
// import type { Candle } from './types/indicatorTypes'
// import { Snp5 } from './data/snp5'
// import type { Tool } from './lib/drawingManager'
// import { IBKRFeed, Tick } from './lib/ibkrFeed'

// export default function App() {
//   const [symbol, setSymbol] = useState<string>(Snp5[0].symbol)
//   const [timeframe, setTimeframe] = useState<Timeframe>('1m')
//   const [showVolume, setShowVolume] = useState<boolean>(true)
//   const [last, setLast] = useState<Candle|undefined>(undefined)
//   const [firstClose, setFirstClose] = useState<number|undefined>(undefined)
//   const [tool, setTool] = useState<Tool>('cursor')
//   const [currentCandles, setCurrentCandles] = useState<Candle[]>([])
//   const [feed] = useState(() => new IBKRFeed('ws://localhost:8000/ws/stream'))
//   const [lastTick, setLastTick] = useState<Tick | null>(null)
//   const [chartType, setChartType] = useState<'candles'|'ohlc'|'volume_candles'|'volume_ohlc'>('ohlc')

//   const onStats = useCallback((s: { last?: Candle, firstClose?: number }) => {
//     if (s.last) setLast(s.last)
//     if (s.firstClose !== undefined) setFirstClose(s.firstClose)
//   }, [])

//   useEffect(() => {
//     feed.connect((ticks) => {
//       const t = ticks.find(x => x.symbol === symbol)
//       if (t) setLastTick(t)
//     })
//   }, [])

//   useEffect(() => {
//     feed.subscribe(symbol)
//     return () => feed.unsubscribe(symbol)
//   }, [symbol])

//   const callAPI = (path: string, body?: any) => {
//     console.log('API call ->', path, body || {})
//   }

//   return (
//     <div className="h-screen w-screen bg-neutral-950">
//       <TopNav
//         symbol={symbol}
//         timeframe={timeframe}
//         last={last}
//         firstClose={firstClose}
//         chartType={chartType}
//         showVolume={showVolume}
//         onTimeframe={setTimeframe}
//         onChartType={setChartType}
//         onVolume={setShowVolume}
//         onSearch={() => callAPI('/api/search/open')}
//         onIndicators={() => callAPI('/api/indicators/open')}
//         onAlert={() => callAPI('/api/alerts/open')}
//         onReplay={() => callAPI('/api/replay/open')}
//       />

//       {/* ✅ Insert TopBar below TopNav */}
//       <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800">
//         <TopBar
//           onSymbolSelect={(symbol) => {
//             console.log("[App] Chart load requested for:", symbol);
//             setSymbol(symbol);
//           }}
//           timeframe={timeframe}
//           chartType={chartType}
//           showVolume={showVolume}
//           onTimeframeChange={(tf) => setTimeframe(tf as Timeframe)}
//           onChartTypeChange={(type) => setChartType(type as typeof chartType)}
//           onVolumeToggle={() => setShowVolume((prev) => !prev)}
//         />


//       </div>

//       <div className="flex">
//         <LeftToolbar onTool={(t)=>{ setTool(t); callAPI('/api/drawings/select', { tool: t }) }} />
//         <div className="flex-1">
//           <TVChart
//             symbol={symbol}
//             timeframe={timeframe}
//             chartType={chartType}
//             showVolume={showVolume}
//             tool={tool}
//             liveTick={lastTick || undefined}
//             onStats={onStats}
//             onCandles={setCurrentCandles}
//           />
//         </div>
//         <RightWatchlist active={symbol} timeframe={timeframe} candles={currentCandles} onPick={setSymbol} />
//       </div>
//     </div>
//   )
// }
