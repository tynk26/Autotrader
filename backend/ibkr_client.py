# backend/ibkr_client.py

from ib_insync import IB, Stock, Forex
from datetime import datetime


class IBKRClient:

    def __init__(self, host="127.0.0.1", port=4002, client_id=1):
        self.ib = IB()
        self.host = host
        self.port = port
        self.client_id = client_id

    # -------------------------
    # Connect
    # -------------------------
    def connect(self):
        if not self.ib.isConnected():
            print("[ibkr_client] Connecting...")
            self.ib.connect(self.host, self.port, clientId=self.client_id)
            print("[ibkr_client] Connected ✔")

    def disconnect(self):
        if self.ib.isConnected():
            print("[ibkr_client] Disconnecting...")
            self.ib.disconnect()

    # -------------------------
    # Contract
    # -------------------------
    def resolve_contract(self, symbol: str):
        if "." in symbol:
            base, quote = symbol.split(".")
            return Forex(base + quote)
        return Stock(symbol, "SMART", "USD")

    # -------------------------
    # Snapshot
    # -------------------------
    def get_snapshot(self, symbol: str):
        self.connect()

        contract = self.resolve_contract(symbol)
        self.ib.qualifyContracts(contract)

        ticker = self.ib.reqMktData(contract)

        self.ib.sleep(2)

        result = {
            "symbol": symbol,
            "bid": ticker.bid,
            "ask": ticker.ask,
            "last": ticker.last,
            "time": datetime.utcnow().isoformat(),
        }

        print("[ibkr_client] Snapshot:", result)

        self.ib.cancelMktData(contract)

        return result

    # -------------------------
    # Historical
    # -------------------------
    def get_historical(self, symbol: str):
        self.connect()

        contract = self.resolve_contract(symbol)
        self.ib.qualifyContracts(contract)

        bars = self.ib.reqHistoricalData(
            contract,
            endDateTime="",
            durationStr="2 D",
            barSizeSetting="5 mins",
            whatToShow="MIDPOINT",
            useRTH=False,
        )

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


# -----------------------------------
# Standalone Test (NO asyncio)
# -----------------------------------
if __name__ == "__main__":

    client = IBKRClient()

    print("\n--- Snapshot Test ---")
    snap = client.get_snapshot("AAPL")
    print(snap)

    print("\n--- Historical Test ---")
    bars = client.get_historical("AAPL")
    print(bars[:3])

    client.disconnect()
