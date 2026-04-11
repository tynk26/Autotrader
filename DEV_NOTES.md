# VERSION v0.3.4 – GUI ORDER TICKET"

# =================== DEV NOTES =======================

# 1. GITHUB & CMDS

- Github Email: nkty0926@gmail.com
- Github Username: skarn26

# 1. Push local changes to GitHub with version tag

# Stage all changes

git add .

# Commit with descriptive message

git commit -m "ALGO v0.3.5 – TO WORK ON STRATEGY ENGINE"

# Sync with remote safely (avoids push conflicts)

git pull --rebase

# ✅ TAG HERE: Create a tag at the current (latest) commit on main

git tag -a v0.3.5 -m "ALGO v0.3.5 – TO WORK ON STRATEGY ENGINE"

# Push changes to main branch

git push origin main

# Push the tag to remote

git push origin v0.3.4

2. Rollback local repo to a previous tag

# Reset your local repo to previous version tag (e.g., v0.2.2)

git reset --hard v0.3.4

# Force push the rollback to GitHub (with safety)

git push --force-with-lease

3. IN CASE ERROR
   git rebase --continue
   git push origin main
   git tag -a v0.2.4 -m "ALGO v0.2.4 – working search UI"
   git push origin v0.2.4

============================================================

# 3. Initialize New Repo

git add .
git commit -m "feat: short description of change"
git pull --rebase origin main # sync w/ remote if needed
git push origin main

---

# Initialize & first push

cd C:\Users\taeyo\Desktop\ALGOTRADE\ALGO_V1
git init
git add .
git commit -m "chore: import ALGO_V1 base"
git tag -a v0.1.0-algo_v1 -m "Base import"
git branch -M main
git remote add origin https://github.com/tynk26/GUAP.git
git push -u origin main
git push --tags

# You want to keep both your local and GitHub changes

git pull --rebase origin main
git push origin main

# New feature → PR → tag

git switch -c feat/topbar-fuzzy-ibkr
git add .
git commit -m "feat(search): TopBar fuzzy autocomplete + cache + chart load"
git push -u origin feat/topbar-fuzzy-ibkr

# (open PR, merge)

git switch main && git pull
git tag -a v0.2.0-search -m "TopBar fuzzy"
git push origin main --follow-tags

# Roll back to stable (if needed)

git switch --detach v0.2.0-search # test
git switch -c hotfix/from-v020 v0.2.0-search # fix from that state

# OR: git reset --hard v0.2.0-search && git push --force-with-lease

curl -X POST http://localhost:8000/api/history \
 -H "Content-Type: application/json" \
 -d '{"symbol": "AAPL", "durationStr": "1 D", "barSize": "5 mins", "whatToShow": "TRADES", "useRTH": false}'

taeyo@tae-zephyrus MINGW64 ~/Desktop/autotrader/tvibkr-full-v5
$ wscat -c ws://localhost:8000/ws/stream
Connected (press CTRL+C to quit)

> {"op": "subscribe", "symbol": "AAPL"}
> {"op": "subscribe", "symbol": "EUR.USD"}

---

Error 10089, reqId 4: Requested market data requires additional subscription for API. See link in 'Market Data Connections' dialog for more details.Delayed market data is available.AAPL NASDAQ.NMS/TOP/ALL, contract: Stock(conId=265598, symbol='AAPL', exchange='SMART', primaryExchange='NASDAQ', currency='USD', localSymbol='AAPL', tradingClass='NMS')

# How to get real-time data (optional)

If you want real-time prices for stocks like AAPL:

Log in to your IB Client Portal

Go to Settings → User Settings → Market Data Subscriptions

Subscribe to:

NASDAQ (Network A/B/C)

US Equity & Options Add-On Streaming Bundle

💳 Real-time data is ~$1.50 to $15/month depending on package
