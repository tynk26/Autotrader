# backend/indicators/fibonacci.py

def fib_levels(high, low):
    diff = high - low

    return {
        "0.382": high - diff * 0.382,
        "0.5": high - diff * 0.5,
        "0.618": high - diff * 0.618,
    }