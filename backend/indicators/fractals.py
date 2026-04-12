# backend/indicators/fractals.py

def detect_fractals(candles):
    fractals = []

    if len(candles) < 5:
        return fractals

    for i in range(2, len(candles) - 2):
        c = candles[i]

        highs = [candles[j]["high"] for j in range(i - 2, i + 3)]
        lows = [candles[j]["low"] for j in range(i - 2, i + 3)]

        if c["high"] == max(highs):
            fractals.append({
                "type": "high",
                "time": c["time"],
                "price": c["high"]
            })

        if c["low"] == min(lows):
            fractals.append({
                "type": "low",
                "time": c["time"],
                "price": c["low"]
            })

    return fractals