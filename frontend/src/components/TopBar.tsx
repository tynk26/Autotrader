// FILE: web/src/components/TopBar.tsx

import React, { useState, useEffect } from 'react';
import { Search } from 'react-feather';

const API_URL = 'http://localhost:8000/api/search';

interface TopBarProps {
  onSymbolSelect: (symbol: string) => void;
  timeframe: string;
  chartType: string;
  showVolume: boolean;
  onTimeframeChange: (tf: string) => void;
  onChartTypeChange: (type: string) => void;
  onVolumeToggle: () => void;
}

type SymbolInfo = {
  symbol: string;
  name: string;
  secType: string;
  exchange: string;
};

export const TopBar: React.FC<TopBarProps> = ({
  onSymbolSelect,
  timeframe,
  chartType,
  showVolume,
  onTimeframeChange,
  onChartTypeChange,
  onVolumeToggle,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SymbolInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchSuggestions = async (q: string) => {
    if (q.length < 1) return;
    try {
      const res = await fetch(`${API_URL}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results: SymbolInfo[] = data.results || [];

      const filtered = results
        .filter((s) => s.symbol.startsWith(q.toUpperCase()))
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
        .slice(0, 15);

      setSuggestions(filtered);
      setShowDropdown(true);
    } catch (err) {
      console.error('[TopBar] search fetch error:', err);
      setSuggestions([]);
    }
  };

  const handleSelect = (symbol: string) => {
    setQuery(symbol);
    setSuggestions([]);
    setShowDropdown(false);
    onSymbolSelect(symbol);
  };

  useEffect(() => {
    if (query.trim() === '') {
      setSuggestions([]);
      setShowDropdown(false);
    } else {
      fetchSuggestions(query);
    }
  }, [query, timeframe]);

  return (
    <div
      className="topbar"
      style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '16px',
        padding: '8px 16px',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    >
      {/* 🔍 Left: Search box (30%) */}
      <div
        className="search-container"
        style={{
          flexBasis: '30%',
          minWidth: '260px',
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          gap: '8px',
          background: '#f8f8f8',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      >
        <input
          type="text"
          placeholder="Search symbol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          style={{
            flex: 1,
            fontSize: '14px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#000',
          }}
        />
        <Search
          onClick={() => fetchSuggestions(query)}
          style={{ cursor: 'pointer', color: '#333' }}
        />
        {showDropdown && (
          <button
            onClick={() => {
              setShowDropdown(false);
              setSuggestions([]);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#666',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        )}
      </div>


      {/* 🔧 Right: Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* ⏱️ Timeframe */}
        <select
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value)}
          style={{ padding: '4px 8px', fontSize: '13px' }}
        >
        {[
          '1s', '5s', '10s', '15s', '30s',
          '1m', '2m', '3m', '5m', '10m', '15m', '30m',
          '1h', '2h', '3h', '4h',
          '1d', '1w', '1M',
        ].map((tf) => (
          <option key={tf} value={tf}>{tf}</option>
        ))}

        </select>

        {/* 🪙 Chart Type */}
        <select
          value={chartType}
          onChange={(e) => onChartTypeChange(e.target.value)}
          style={{ padding: '4px 8px', fontSize: '13px' }}
        >
          <option value="candles">Candles</option>
          <option value="ohlc">OHLC</option>
          <option value="volume_candles">Volume Candles</option>
          <option value="volume_ohlc">Volume OHLC</option>
        </select>

        {/* 📊 Volume Toggle */}
        <button
          onClick={onVolumeToggle}
          style={{
            padding: '4px 12px',
            fontSize: '13px',
            backgroundColor: showVolume ? '#007aff' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showVolume ? 'Volume ON' : 'Volume OFF'}
        </button>
      </div>

      {/* 🔽 Autocomplete dropdown (absolute position) */}
      {showDropdown && suggestions.length > 0 && (
        <div
          className="autocomplete-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: '16px',
            zIndex: 100,
            background: '#fff',
            border: '1px solid #ccc',
            width: '30%',
            minWidth: '260px',
            maxHeight: '250px',
            overflowY: 'auto',
            marginTop: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        >
          <table
            style={{
              width: '100%',
              fontSize: '13px',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              color: '#000',
            }}
          >
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Symbol</th>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Type</th>
                <th style={{ padding: '8px' }}>Exchange</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleSelect(s.symbol)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#fff',
                    color: '#000',
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{s.symbol}</td>
                  <td style={{ padding: '8px' }}>{s.name}</td>
                  <td style={{ padding: '8px' }}>{s.secType}</td>
                  <td style={{ padding: '8px' }}>{s.exchange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
