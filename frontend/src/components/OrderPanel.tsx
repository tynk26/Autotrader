// FILE: web/src/components/OrdersPanel.tsx

import { useState } from 'react';
import { format } from 'date-fns';

type OrderStatus = 'open' | 'filled' | 'cancelled';

type Order = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  status: OrderStatus;
  name: string;
  exchange: string;
  createdAt: string;
};

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    symbol: 'AAPL',
    side: 'buy',
    qty: 100,
    price: 190.5,
    status: 'open',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    symbol: 'MSFT',
    side: 'sell',
    qty: 50,
    price: 320.25,
    status: 'filled',
    name: 'Microsoft Corp.',
    exchange: 'NASDAQ',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    symbol: 'GOOG',
    side: 'buy',
    qty: 25,
    price: 125.0,
    status: 'cancelled',
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    createdAt: new Date().toISOString(),
  },
];

export default function OrderPanel() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const handleCancel = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o))
    );
  };

  return (
    <div className="p-3 border-t border-neutral-800 text-white text-sm bg-[#0f1115]">
      <div className="font-semibold text-base mb-2">Orders</div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_1fr] text-xs text-[#9ca3af] mb-1 px-1">
        <div>Symbol</div>
        <div className="text-right">Side</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Price</div>
        <div className="text-right">Status</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Order rows */}
      {orders.map((order) => {
        const timestamp = format(new Date(order.createdAt), 'yyyy-MM-dd_HH:mm:ss');
        const statusColor =
          order.status === 'filled'
            ? 'text-green-500'
            : order.status === 'cancelled'
            ? 'text-gray-400'
            : 'text-yellow-400';

        return (
          <div
            key={order.id}
            className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_1fr] items-center py-1 px-1 border-b border-[#1f2430] relative group"
          >
            <div className="truncate">{order.symbol}</div>
            <div className={`text-right ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
              {order.side.toUpperCase()}
            </div>
            <div className="text-right">{order.qty}</div>
            <div className="text-right">{order.price.toFixed(2)}</div>
            <div className={`text-right ${statusColor}`}>{order.status}</div>
            <div className="text-right">
              {order.status === 'open' && (
                <button
                  className="text-red-500 hover:underline text-xs"
                  onClick={() => handleCancel(order.id)}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Hover popup */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-neutral-800 text-xs text-white p-2 rounded shadow-md border border-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200 w-64">
              <div><strong>{order.symbol}</strong> — {order.name}</div>
              <div className="text-[#9ca3af]">Exchange: {order.exchange}</div>
              <div className="text-[#9ca3af]">Status: {order.status}</div>
              <div className="text-[#9ca3af]">Created: {timestamp}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
