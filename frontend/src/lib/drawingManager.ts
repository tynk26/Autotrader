
import { IChartApi } from 'lightweight-charts'

export type Tool =
  | 'cursor' | 'segment' | 'ray' | 'trendline'
  | 'hline' | 'vline' | 'rect' | 'fib' | 'brush' | 'text' | 'pricerange'

export type Drawing = { id: string, type: Tool, points: { x: number, y: number, data?: any }[] }

export class DrawingManager {
  private chart: IChartApi
  private tool: Tool = 'cursor'
  private drawings: Drawing[] = []
  private active?: Drawing
  private overlay: SVGSVGElement

  constructor(chart: IChartApi, overlaySvg: SVGSVGElement) {
    this.chart = chart
    this.overlay = overlaySvg
    this.overlay.style.pointerEvents = 'none'
    this.render()
  }

  setTool(t: Tool) { this.tool = t; this.active = undefined; this.render() }
  getTool(): Tool { return this.tool }
  getDrawings() { return this.drawings }

  onPointerDown(x: number, y: number) {
    if (this.tool==='cursor') return
    const id = Math.random().toString(36).slice(2)
    this.active = { id, type: this.tool, points: [{x,y}] }
    if (this.tool==='brush') this.active.points.push({x,y})
  }
  onPointerMove(x: number, y: number) {
    if (!this.active) return
    const t = this.active.type
    if (t==='brush') this.active.points.push({x,y})
    else if (this.active.points.length===1) this.active.points[1] = {x,y}
    else this.active.points[1] = {x,y}
    this.render()
  }
  onPointerUp(x: number, y: number) {
    if (!this.active) return
    if (this.active.points.length===1) this.active.points.push({x,y})
    this.drawings.push(this.active)
    this.active = undefined
    this.render()
  }

  private render() {
    const svg = this.overlay
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    const line = (x1:number,y1:number,x2:number,y2:number,color='#60a5fa',dash=false) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg','line')
      el.setAttribute('x1', String(x1)); el.setAttribute('y1', String(y1))
      el.setAttribute('x2', String(x2)); el.setAttribute('y2', String(y2))
      el.setAttribute('stroke', color); el.setAttribute('stroke-width','2')
      if (dash) el.setAttribute('stroke-dasharray','6,4')
      svg.appendChild(el)
    }
    const rect = (x1:number,y1:number,x2:number,y2:number,stroke='#f59e0b',fill='rgba(245,158,11,0.12)') => {
      const r = document.createElementNS('http://www.w3.org/2000/svg','rect')
      const x = Math.min(x1,x2), y = Math.min(y1,y2)
      r.setAttribute('x', String(x)); r.setAttribute('y', String(y))
      r.setAttribute('width', String(Math.abs(x2-x1))); r.setAttribute('height', String(Math.abs(y2-y1)))
      r.setAttribute('stroke', stroke); r.setAttribute('fill', fill); r.setAttribute('stroke-width','1')
      svg.appendChild(r)
    }
    const path = (pts:{x:number,y:number}[], color='#a78bfa') => {
      const p = document.createElementNS('http://www.w3.org/2000/svg','path')
      const d = pts.map((p,i)=> i?`L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`).join(' ')
      p.setAttribute('d', d); p.setAttribute('fill','none'); p.setAttribute('stroke',color); p.setAttribute('stroke-width','2')
      svg.appendChild(p)
    }

    const all = [...this.drawings, ...(this.active?[this.active]:[])]
    for (const d of all) {
      const [p1, p2] = d.points
      if (d.type==='segment' && p1 && p2) line(p1.x,p1.y,p2.x,p2.y)
      if (d.type==='ray' && p1 && p2) {
        const dx=p2.x-p1.x, dy=p2.y-p1.y, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L
        line(p1.x,p1.y,p1.x+ux*5000,p1.y+uy*5000)
      }
      if (d.type==='trendline' && p1 && p2) line(p1.x,p1.y,p2.x,p2.y,'#3b82f6')
      if (d.type==='hline' && p1) line(0,p1.y,5000,p1.y,'#f97316',true)
      if (d.type==='vline' && p1) line(p1.x,0,p1.x,5000,'#f97316',true)
      if (d.type==='rect' && p1 && p2) rect(p1.x,p1.y,p2.x,p2.y)
      if (d.type==='brush') path(d.points)
      if (d.type==='text' && p1?.data?.text) {
        const t = document.createElementNS('http://www.w3.org/2000/svg','text')
        t.setAttribute('x', String(p1.x)); t.setAttribute('y', String(p1.y))
        t.setAttribute('fill', 'white'); t.setAttribute('font-size', '12')
        t.textContent = p1.data.text
        svg.appendChild(t)
      }
      if (d.type==='pricerange' && p1 && p2) rect(p1.x, Math.min(p1.y,p2.y), p2.x, Math.max(p1.y,p2.y), '#10b981','rgba(16,185,129,0.1)')
      if (d.type==='fib' && p1 && p2) {
        const levels = [0,0.236,0.382,0.5,0.618,0.786,1]
        for (const r of levels) {
          const y = p1.y + (p2.y - p1.y)*r
          line(p1.x, y, p2.x, y, '#f59e0b')
        }
      }
    }
  }
}
