
import { useState } from 'react'
import type { Tool } from '../lib/drawingManager'

type Props = { onTool: (tool: Tool) => void }
const TOOLS: Tool[] = ['cursor','segment','ray','trendline','hline','vline','rect','fib','brush','text','pricerange']

export default function LeftToolbar({ onTool }: Props) {
  const [active, setActive] = useState<Tool>('cursor')
  function pick(t: Tool) { setActive(t); onTool(t) }

  return (
    <div className="w-12 p-1 bg-[#0f1115] border-r border-[#1f2430]">
      {TOOLS.map(t => (
        <button
          key={t}
          onClick={() => pick(t)}
          className={`w-10 h-10 rounded-lg mb-2 flex items-center justify-center ${active===t?'bg-[#1f2430] text-white':'bg-[#121521] text-[#9ca3af]'}`}
          title={t}
        >
          {t[0].toUpperCase()}
        </button>
      ))}
    </div>
  )
}
