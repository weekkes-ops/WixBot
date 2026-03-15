import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthState, PricePoint, BotConfig, Trade } from "../types";
import TradingChart from "../components/TradingChart";
import { Play, Square, TrendingUp, TrendingDown, DollarSign, Percent, Zap, Activity } from "lucide-react";
import { motion } from "motion/react";

export default function TradingDashboard() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (!storedAuth) {
      navigate("/login");
      return;
    }
    const parsedAuth: AuthState = JSON.parse(storedAuth);
    setAuth(parsedAuth);

    // Initial data fetch
    fetchData(parsedAuth.token!);

    // WebSocket setup
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "price_update") {
        const newPoint = message.data;
        setCurrentPrice(newPoint.price);
        setPriceHistory(prev => {
          const updated = [...prev, newPoint];
          if (updated.length > 100) return updated.slice(updated.length - 100);
          return updated;
        });
      }
    };

    ws.onclose = () => console.log("WS connection closed");
    ws.onerror = (err) => console.error("WS error:", err);

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [navigate]);

  const fetchData = async (token: string) => {
    try {
      const [priceRes, historyRes, configRes, tradesRes] = await Promise.all([
        fetch("/api/market/price"),
        fetch("/api/market/history"),
        fetch("/api/bot/config", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/trades/history", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      // Check if all responses are OK and have JSON content type
      const results = await Promise.all([priceRes, historyRes, configRes, tradesRes].map(async (res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("auth");
          navigate("/login");
          throw new Error("Session expired");
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, body: ${text.substring(0, 100)}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON but got ${contentType}, body: ${text.substring(0, 100)}`);
        }
        return res.json();
      }));

      const [priceData, historyData, configData, tradesData] = results;

      setCurrentPrice(priceData.price ?? 0);
      setPriceHistory(historyData || []);
      setBotConfig(configData);
      setRecentTrades(tradesData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const toggleBot = async () => {
    if (!auth || !botConfig) return;
    try {
      const res = await fetch("/api/bot/toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}` 
        },
        body: JSON.stringify({ is_active: !botConfig.is_active })
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth");
        navigate("/login");
        return;
      }
      if (res.ok) {
        setBotConfig({ ...botConfig, is_active: !botConfig.is_active });
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  if (!auth) return null;

  const totalProfit = recentTrades.reduce((acc, trade) => acc + (trade.profit || 0), 0);
  const winningTrades = recentTrades.filter(t => (t.profit || 0) > 0);
  const losingTrades = recentTrades.filter(t => (t.profit || 0) < 0);
  
  const winRate = recentTrades.length > 0 
    ? (winningTrades.length / recentTrades.length) * 100 
    : 0;

  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((acc, t) => acc + (t.profit || 0), 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((acc, t) => acc + (t.profit || 0), 0) / losingTrades.length) 
    : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="trading-panel flex items-center gap-4">
          <div className="bg-trading-gold/10 p-3 rounded-full text-trading-gold">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-500 tracking-widest">Balance</p>
            <p className="text-xl font-mono font-bold">${auth.user?.balance?.toLocaleString() ?? '0'}</p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="trading-panel flex items-center gap-4">
          <div className={`${totalProfit >= 0 ? 'bg-trading-green/10 text-trading-green' : 'bg-trading-red/10 text-trading-red'} p-3 rounded-full`}>
            {totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-500 tracking-widest">Daily PNL</p>
            <p className={`text-xl font-mono font-bold ${totalProfit >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="trading-panel flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-full text-blue-500">
            <Percent size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-500 tracking-widest">Win Rate</p>
            <p className="text-xl font-mono font-bold">{winRate.toFixed(1)}%</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="trading-panel flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`${botConfig?.is_active ? 'bg-trading-green/10 text-trading-green' : 'bg-gray-500/10 text-gray-500'} p-3 rounded-full`}>
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-500 tracking-widest">Bot Status</p>
              <p className={`text-sm font-bold ${botConfig?.is_active ? 'text-trading-green' : 'text-gray-500'}`}>
                {botConfig?.is_active ? 'ACTIVE' : 'INACTIVE'}
              </p>
            </div>
          </div>
          <button 
            onClick={toggleBot}
            className={`p-2 rounded-full transition-all ${botConfig?.is_active ? 'bg-trading-red text-white hover:bg-opacity-80' : 'bg-trading-green text-white hover:bg-opacity-80'}`}
          >
            {botConfig?.is_active ? <Square size={20} /> : <Play size={20} />}
          </button>
        </motion.div>
      </div>

      {/* KPI Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <div className="trading-panel p-4 text-center">
          <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">Total Trades</p>
          <p className="text-lg font-mono font-bold">{recentTrades.length}</p>
        </div>
        <div className="trading-panel p-4 text-center">
          <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">Total P/L</p>
          <p className={`text-lg font-mono font-bold ${totalProfit >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="trading-panel p-4 text-center">
          <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">Winning Trades</p>
          <p className="text-lg font-mono font-bold text-trading-green">{winningTrades.length}</p>
        </div>
        <div className="trading-panel p-4 text-center">
          <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">Losing Trades</p>
          <p className="text-lg font-mono font-bold text-trading-red">{losingTrades.length}</p>
        </div>
        <div className="trading-panel p-4 text-center col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">Avg Win/Loss</p>
          <p className="text-lg font-mono font-bold">{winLossRatio.toFixed(2)}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 trading-panel space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold font-mono">BTC/USDT</h2>
              <span className="text-xs text-gray-500">Perpetual</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-trading-gold">${currentPrice?.toLocaleString() ?? '0'}</p>
              <p className="text-[10px] text-trading-green">+0.42% (24h)</p>
            </div>
          </div>
          <TradingChart data={priceHistory} />
        </div>

        {/* Recent Trades */}
        <div className="trading-panel space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-trading-border pb-4">Live Execution Log</h2>
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
            {recentTrades.length > 0 ? recentTrades.map((trade) => (
              <div key={trade.id} className="flex justify-between items-center text-xs border-b border-trading-border pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`status-badge ${trade.type === 'BUY' ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'}`}>
                    {trade.type}
                  </span>
                  <div>
                    <p className="font-mono font-bold">{trade.symbol}</p>
                    <p className="text-[10px] text-gray-500">{new Date(trade.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono">${trade.entry_price?.toLocaleString() ?? '0'}</p>
                  <p className={`font-mono font-bold ${trade.profit && trade.profit >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                    {trade.profit ? `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}` : 'OPEN'}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-30">
                <Activity size={48} className="mx-auto mb-4" />
                <p className="text-xs uppercase tracking-widest">Waiting for signals...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
