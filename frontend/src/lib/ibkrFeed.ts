
export type Tick = { symbol: string; last?: number; bid?: number; ask?: number; volume?: number; time?: number };


export class IBKRFeed {
  private ws?: WebSocket
  private queue: string[] = []
  private connected = false
  private onTickHandler?: (ticks: Tick[]) => void

  constructor(private url = 'ws://localhost:8000/ws/stream') {}

  connect(onTick: (ticks: Tick[]) => void) {
    this.onTickHandler = onTick
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      this.connected = true
      while (this.queue.length > 0) {
        this.ws!.send(this.queue.shift()!)
      }
    }

    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'tick' && this.onTickHandler) {
        this.onTickHandler(msg.data)
      }
    }

    this.ws.onclose = () => {
      this.connected = false
      console.warn('[IBKRFeed] WebSocket closed')
    }

    this.ws.onerror = (e) => {
      this.connected = false
      console.error('[IBKRFeed] WebSocket error:', e)
    }
  }

  subscribe(symbol: string) {
    const msg = JSON.stringify({ op: 'subscribe', symbol })
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg)
    } else {
      this.queue.push(msg)
    }
  }

  unsubscribe(symbol: string) {
    const msg = JSON.stringify({ op: 'unsubscribe', symbol })
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg)
    } else {
      this.queue.push(msg)
    }
  }

  close() {
    this.ws?.close()
    this.connected = false
  }
}

// export class IBKRFeed {
//   private ws?: WebSocket
//   constructor(private url = 'ws://localhost:8000/ws/stream') {}
//   connect(onTick: (ticks: Tick[]) => void) {
//     this.ws = new WebSocket(this.url)
//     this.ws.onmessage = (ev) => {
//       const msg = JSON.parse(ev.data)
//       if (msg.type === 'tick') onTick(msg.data)
//     }
//   }
//   subscribe(symbol: string) { this.ws?.send(JSON.stringify({ op: 'subscribe', symbol })) }
//   unsubscribe(symbol: string) { this.ws?.send(JSON.stringify({ op: 'unsubscribe', symbol })) }
//   close() { this.ws?.close() }
// }
