import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Menu, X, Zap, Activity, History, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { AuthState } from "../types";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ user: null, token: null });
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      setAuth(JSON.parse(storedAuth));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setAuth({ user: null, token: null });
    navigate("/login");
    window.location.reload();
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-trading-bg border-b border-trading-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-trading-gold p-1.5 rounded">
            <Zap size={20} className="text-black" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase font-mono">Aura<span className="text-trading-gold">Scalper</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-xs uppercase tracking-widest hover:text-trading-gold transition-colors flex items-center gap-2">
            <Activity size={14} /> Dashboard
          </Link>
          <Link to="/history" className="text-xs uppercase tracking-widest hover:text-trading-gold transition-colors flex items-center gap-2">
            <History size={14} /> History
          </Link>
          <Link to="/settings" className="text-xs uppercase tracking-widest hover:text-trading-gold transition-colors flex items-center gap-2">
            <Settings size={14} /> Settings
          </Link>
          
          {auth.user ? (
            <div className="flex items-center space-x-6 border-l border-trading-border pl-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase text-gray-500">Balance</span>
                <span className="text-xs font-mono text-trading-gold">${auth.user.balance?.toLocaleString() ?? '0'}</span>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="trading-button-primary">Login</Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-400" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-trading-card border-b border-trading-border p-6 flex flex-col space-y-6">
          <Link to="/" className="text-xs uppercase tracking-widest" onClick={() => setIsOpen(false)}>Dashboard</Link>
          <Link to="/history" className="text-xs uppercase tracking-widest" onClick={() => setIsOpen(false)}>History</Link>
          <Link to="/settings" className="text-xs uppercase tracking-widest" onClick={() => setIsOpen(false)}>Settings</Link>
          {auth.user ? (
            <button onClick={handleLogout} className="text-xs uppercase tracking-widest text-left text-trading-red">Logout</button>
          ) : (
            <Link to="/login" className="trading-button-primary text-center" onClick={() => setIsOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
