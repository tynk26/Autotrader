# <inserted above from final version># backend/strategy_engine.py

from indicators.fractals import detect_fractals
from indicators.vwap import anchored_vwap
from indicators.macd import macd
from indicators.fibonacci import fib_levels


class StrategyEngine:
    def __init__(self):
        self.data = {
            "1m": [],
            "5m": [],
            "15m": [],
            "1h": [],
        }

    def update_candle(self, tf, candle):
        self.data[tf].append(candle)

        if len(self.data[tf]) > 500:
            self.data[tf] = self.data[tf][-500:]

    def compute(self, tf):
        candles = self.data[tf]

        if len(candles) < 30:
            return None

        fractals = detect_fractals(candles)

        if len(fractals) < 2:
            return None

        last_high = next(f for f in reversed(fractals) if f["type"] == "high")
        last_low = next(f for f in reversed(fractals) if f["type"] == "low")

        anchor = fractals[-1]
        vwap = anchored_vwap(candles, anchor["time"])

        closes = [c["close"] for c in candles]
        macd_val, signal_val = macd(closes)

        fibs = fib_levels(last_high["price"], last_low["price"])

        trend = "bullish" if macd_val > signal_val else "bearish"

        return {
            "timeframe": tf,
            "fractals": fractals[-10:],
            "anchor_vwap": vwap,
            "macd": macd_val,
            "signal": signal_val,
            "fib_levels": fibs,
            "trend": trend
        }