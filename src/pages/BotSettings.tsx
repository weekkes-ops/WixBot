import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthState, BotConfig } from "../types";
import { Save, Shield, Zap, Target, BarChart3 } from "lucide-react";
import { motion } from "motion/react";

export default function BotSettings() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (!storedAuth) {
      navigate("/login");
      return;
    }
    const parsedAuth: AuthState = JSON.parse(storedAuth);
    setAuth(parsedAuth);

    fetch("/api/bot/config", {
      headers: { "Authorization": `Bearer ${parsedAuth.token}` }
    })
      .then(async res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("auth");
          navigate("/login");
          throw new Error("Session expired");
        }
        if (!res.ok) throw new Error("Failed to fetch config");
        return res.json();
      })
      .then(data => setConfig(data))
      .catch(err => console.error(err));
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !config) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bot/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}` 
        },
        body: JSON.stringify(config)
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth");
        navigate("/login");
        return;
      }
      if (res.ok) {
        setMessage("Configuration updated successfully");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Update error:", err);
    }
    setLoading(false);
  };

  if (!config) return null;

  return (
    <div className="pt-24 pb-12 px-6 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-mono uppercase tracking-tighter">Bot <span className="text-trading-gold">Configuration</span></h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Fine-tune your automated scalping strategy</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="trading-panel space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <Zap size={12} /> Strategy Algorithm
              </label>
              <select 
                className="trading-input w-full"
                value={config.strategy}
                onChange={e => setConfig({...config, strategy: e.target.value})}
              >
                <option value="RSI_EMA_SCALPER">RSI + EMA Scalper</option>
                <option value="MACD_CROSSOVER">MACD Crossover</option>
                <option value="BOLLINGER_REVERSION">Bollinger Mean Reversion</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <Shield size={12} /> Risk Profile
              </label>
              <select 
                className="trading-input w-full"
                value={config.risk_level}
                onChange={e => setConfig({...config, risk_level: e.target.value})}
              >
                <option value="LOW">Conservative (Low Drawdown)</option>
                <option value="MEDIUM">Balanced (Standard)</option>
                <option value="HIGH">Aggressive (High Yield)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <Target size={12} /> Take Profit (%)
              </label>
              <input 
                type="number" step="0.1"
                className="trading-input w-full"
                value={config.take_profit}
                onChange={e => setConfig({...config, take_profit: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <BarChart3 size={12} /> Stop Loss (%)
              </label>
              <input 
                type="number" step="0.1"
                className="trading-input w-full"
                value={config.stop_loss}
                onChange={e => setConfig({...config, stop_loss: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <Zap size={12} /> Leverage (x)
              </label>
              <input 
                type="number"
                className="trading-input w-full"
                value={config.leverage}
                onChange={e => setConfig({...config, leverage: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-trading-border flex items-center justify-between">
            <p className="text-[10px] text-gray-500 italic max-w-xs">
              * Automated trading involves significant risk. Ensure your stop-loss settings are appropriate for your capital.
            </p>
            <button 
              type="submit" 
              disabled={loading}
              className="trading-button-primary flex items-center gap-2"
            >
              <Save size={16} /> {loading ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>
      </form>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-trading-green/10 border border-trading-green text-trading-green text-center text-xs uppercase tracking-widest rounded"
        >
          {message}
        </motion.div>
      )}
    </div>
  );
}
