from ib_insync import IB

ib = IB()
ib.connect('127.0.0.1', 4002, clientId=17)

results = ib.reqMatchingSymbols('AAPL')

if not results:
    print("⚠️ No matches returned from IBKR.")
else:
    for r in results:
        print(f"✅ {r.contract.symbol} | {r.contract.secType} | {r.contract.exchange}")
