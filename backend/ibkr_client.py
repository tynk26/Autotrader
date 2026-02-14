# backend/ibkr_client.py

from ib_insync import IB, Stock, Forex
from datetime import datetime, timezone
from typing import List, Dict, Optional
import math


class IBKRClient:
    """
    Production-safe IBKR client for:
    - Snapshot quotes
    - Historical bars
    - FastAPI threadpool usage
    """

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 4002,  # 7497 = Paper, 7496 = Live
        client_id: int = 1,
    ):
        self.ib = IB()
        self.host = host
        self.port = port
        self.client_id = client_id

    # --------------------------------------------------
    # Connection
    # --------------------------------------------------
    def connect(self):
        if not self.ib.isConnected():
            print("[ibkr_client] Connecting...")
            self.ib.connect(self.host, self.port, clientId=self.client_id)

            # 🔥 Force Delayed Data Mode (important for no-subscription accounts)
            self.ib.reqMarketDataType(3)

            print("[ibkr_client] Connected ✔ (Delayed Mode)")

    def disconnect(self):
        if self.ib.isConnected():
            print("[ibkr_client] Disconnecting...")
            self.ib.disconnect()

    # --------------------------------------------------
    # Contract Resolver
    # --------------------------------------------------
    def resolve_contract(self, symbol: str):
        """
        Stock: AAPL
        Forex: EUR.USD
        """

        if "." in symbol:
            base, quote = symbol.split(".")
            return Forex(base + quote)

        # NASDAQ routing reduces permission errors vs SMART
        return Stock(symbol, "NASDAQ", "USD")

    # --------------------------------------------------
    # Snapshot
    # --------------------------------------------------
    def get_snapshot(self, symbol: str) -> Dict:

        self.connect()

        contract = self.resolve_contract(symbol)
        self.ib.qualifyContracts(contract)

        ticker = self.ib.reqMktData(contract)

        # Wait for delayed data
        self.ib.sleep(2)

        def safe(v):
            return None if (v is None or isinstance(v, float) and math.isnan(v)) else v

        result = {
            "symbol": symbol,
            "bid": safe(ticker.bid),
            "ask": safe(ticker.ask),
            "last": safe(ticker.last),
            "time": datetime.now(timezone.utc).isoformat(),
        }

        print("[ibkr_client] Snapshot:", result)

        self.ib.cancelMktData(contract)

        return result

    # --------------------------------------------------
    # Historical Data
    # --------------------------------------------------
    def get_historical(
        self,
        symbol: str,
        duration: str = "1 D",
        bar_size: str = "5 mins",
        what_to_show: str = "TRADES",
    ) -> List[Dict]:

        self.connect()

        contract = self.resolve_contract(symbol)
        self.ib.qualifyContracts(contract)

        bars = self.ib.reqHistoricalData(
            contract,
            endDateTime="",
            durationStr=duration,
            barSizeSetting=bar_size,
            whatToShow=what_to_show,
            useRTH=False,
        )

        if not bars:
            print("[ibkr_client] No historical bars returned.")
            return []

        result = [
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

        print(f"[ibkr_client] Retrieved {len(result)} bars")

        return result


# --------------------------------------------------
# Standalone Test
# --------------------------------------------------
if __name__ == "__main__":

    client = IBKRClient()

    print("\n--- Snapshot Test ---")
    snapshot = client.get_snapshot("AAPL")
    print(snapshot)

    print("\n--- Historical Test ---")
    bars = client.get_historical("AAPL")
    print(bars[:3])

    client.disconnect()
