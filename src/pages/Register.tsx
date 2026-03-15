import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Zap } from "lucide-react";
import { motion } from "motion/react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON but got ${contentType}, body: ${text.substring(0, 100)}`);
      }

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("auth", JSON.stringify(data));
        navigate("/");
        window.location.reload();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-trading-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md trading-panel space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="bg-trading-gold w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="text-black" size={24} />
          </div>
          <h1 className="text-2xl font-bold font-mono uppercase tracking-tighter">Join <span className="text-trading-gold">AuraScalper</span></h1>
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Start your automated profit journey</p>
        </div>

        {error && (
          <div className="p-3 bg-trading-red/10 border border-trading-red/20 text-trading-red text-xs text-center rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <User size={12} /> Full Name
              </label>
              <input
                type="text"
                required
                className="trading-input w-full"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Mail size={12} /> Email Address
              </label>
              <input
                type="email"
                required
                className="trading-input w-full"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Lock size={12} /> Password
              </label>
              <input
                type="password"
                required
                className="trading-input w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="trading-button-primary w-full flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            {loading ? "Creating Account..." : "Initialize Account"}
          </button>
        </form>

        <p className="text-center text-[10px] uppercase tracking-widest text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-trading-gold hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
