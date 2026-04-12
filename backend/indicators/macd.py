# backend/indicators/macd.py

def ema(values, period):
    alpha = 2 / (period + 1)
    ema_vals = [values[0]]

    for v in values[1:]:
        ema_vals.append(alpha * v + (1 - alpha) * ema_vals[-1])

    return ema_vals


def macd(closes):
    ema12 = ema(closes, 12)
    ema26 = ema(closes, 26)

    macd_line = [a - b for a, b in zip(ema12[-len(ema26):], ema26)]
    signal = ema(macd_line, 9)

    return macd_line[-1], signal[-1]