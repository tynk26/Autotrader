# backend/ibkr_client.py

import asyncio
from ib_insync import IB, Stock, Forex, util
from typing import Optional, List, Dict
from datetime import datetime

# 컬러 로그용
class Log:
    GREEN = "\033[92m"
    BLUE = "\033[94m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    END = "\033[0m"


class IBKRClient:
    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 4002,  # 7497 = Paper, 7496 = Live
        client_id: int = 1,
    ):
        self.host = host
        self.port = port
        self.client_id = client_id

        self.ib = IB()
        self._lock = asyncio.Lock()

    # ---------------------------------------
    # Connection Management
    # ---------------------------------------
    async def ensure_connected(self):
        async with self._lock:
            if not self.ib.isConnected():
                print(f"{Log.BLUE}[ibkr_client] Connecting to IBKR...{Log.END}")
                await self.ib.connectAsync(
                    self.host,
                    self.port,
                    clientId=self.client_id,
                    timeout=5
                )
                print(f"{Log.GREEN}[ibkr_client] Connected ✔{Log.END}")

    async def disconnect(self):
        if self.ib.isConnected():
            print(f"{Log.YELLOW}[ibkr_client] Disconnecting...{Log.END}")
            self.ib.disconnect()

    # ---------------------------------------
    # Contract Resolution
    # ---------------------------------------
    def resolve_contract(self, symbol: str):
        """
        Stock: AAPL
        Forex: EUR.USD
        """
        if "." in symbol:
            base, quote = symbol.split(".")
            contract = Forex(base + quote)
        else:
            contract = Stock(symbol, "SMART", "USD")

        return contract

    # ---------------------------------------
    # Snapshot Quote
    # ---------------------------------------
    async def get_snapshot(self, symbol: str) -> Dict:
        await self.ensure_connected()

        contract = self.resolve_contract(symbol)
        ticker = await self.ib.reqMktDataAsync(contract, "", False, False)

        await asyncio.sleep(2)  # snapshot wait

        result = {
            "symbol": symbol,
            "bid": ticker.bid,
            "ask": ticker.ask,
            "last": ticker.last,
            "time": datetime.utcnow().isoformat(),
        }

        print(f"{Log.GREEN}[ibkr_client] Snapshot: {result}{Log.END}")

        self.ib.cancelMktData(contract)

        return result

    # ---------------------------------------
    # Historical Data
    # ---------------------------------------
    async def get_historical_bars(
        self,
        symbol: str,
        duration: str = "2 D",
        bar_size: str = "5 mins",
        what_to_show: str = "MIDPOINT",
    ) -> List[Dict]:

        await self.ensure_connected()

        contract = self.resolve_contract(symbol)

        bars = await self.ib.reqHistoricalDataAsync(
            contract,
            endDateTime="",
            durationStr=duration,
            barSizeSetting=bar_size,
            whatToShow=what_to_show,
            useRTH=False,
            formatDate=1,
        )

        formatted = [
            {
                "time": bar.date.isoformat(),
                "open": bar.open,
                "high": bar.high,
                "low": bar.low,
                "close": bar.close,
                "volume": bar.volume,
            }
            for bar in bars
        ]

        print(f"{Log.GREEN}[ibkr_client] Retrieved {len(formatted)} bars{Log.END}")

        return formatted


# ---------------------------------------
# Standalone Test
# ---------------------------------------
if __name__ == "__main__":

    async def main():
        client = IBKRClient()

        print("\n--- Testing Snapshot ---")
        snapshot = await client.get_snapshot("AAPL")
        print(snapshot)

        print("\n--- Testing Historical ---")
        bars = await client.get_historical_bars("AAPL")
        print(bars[:3])  # preview first 3 bars

        await client.disconnect()

    asyncio.run(main())
