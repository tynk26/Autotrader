# backend/app/db/models.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from datetime import datetime
from .database import Base


# =========================================================
# 1. ORDERS TABLE
# Stores all order lifecycle transactions
# =========================================================
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)   # BUY / SELL
    quantity = Column(Float, nullable=False)
    order_type = Column(String, default="MKT")
    status = Column(String, default="Created")
    ibkr_order_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 2. ORDER EVENTS TABLE
# Tracks order status changes over time
# =========================================================
class OrderEvent(Base):
    __tablename__ = "order_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 3. POSITIONS TABLE
# Stores current open positions
# =========================================================
class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    avg_cost = Column(Float, nullable=False)
    market_price = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 4. ACCOUNT SNAPSHOTS TABLE
# Stores account summary snapshots over time
# =========================================================
class AccountSnapshot(Base):
    __tablename__ = "account_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    net_liquidation = Column(Float, nullable=False)
    cash_balance = Column(Float, nullable=False)
    buying_power = Column(Float, nullable=True)
    excess_liquidity = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 5. HISTORICAL REQUEST LOGS TABLE
# Logs all historical bar requests
# =========================================================
class HistoricalRequestLog(Base):
    __tablename__ = "historical_request_logs"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, nullable=False)
    bars_requested = Column(Integer, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 6. QUOTE SNAPSHOTS TABLE
# Stores quote snapshots retrieved from API
# =========================================================
class QuoteSnapshot(Base):
    __tablename__ = "quote_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    bid = Column(Float, nullable=True)
    ask = Column(Float, nullable=True)
    last = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 7. WATCHLIST TABLE
# Stores tracked symbols in watchlist
# =========================================================
class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, unique=True)
    added_at = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 8. STRATEGY SIGNALS TABLE
# Stores generated VWAP/Fibonacci strategy signals
# =========================================================
class StrategySignal(Base):
    __tablename__ = "strategy_signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, nullable=False)
    signal_type = Column(String, nullable=False)   # BUY / SELL / HOLD
    price = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================
# 9. AUDIT LOGS TABLE
# System-wide backend event logging
# =========================================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)