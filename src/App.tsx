import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import TradingDashboard from "./pages/TradingDashboard";
import BotSettings from "./pages/BotSettings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useEffect, useState } from "react";
import { AuthState } from "./types";

function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      setAuth(JSON.parse(storedAuth));
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-trading-bg text-white selection:bg-trading-gold selection:text-black">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<TradingDashboard />} />
            <Route path="/settings" element={<BotSettings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
