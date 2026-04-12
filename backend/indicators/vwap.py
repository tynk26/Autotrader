# backend/indicators/vwap.py

def anchored_vwap(candles, anchor_time):
    filtered = [c for c in candles if c["time"] >= anchor_time]

    pv = sum(c["close"] * c["volume"] for c in filtered)
    vol = sum(c["volume"] for c in filtered)

    if vol == 0:
        return None

    return pv / vol