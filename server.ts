import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("trading.db");
const JWT_SECRET = process.env.JWT_SECRET || "aura-trading-secret-123";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    balance REAL DEFAULT 10000.0
  );

  CREATE TABLE IF NOT EXISTS bot_configs (
    user_id INTEGER PRIMARY KEY,
    is_active BOOLEAN DEFAULT 0,
    strategy TEXT DEFAULT 'RSI_EMA_SCALPER',
    risk_level TEXT DEFAULT 'MEDIUM',
    stop_loss REAL DEFAULT 1.5,
    take_profit REAL DEFAULT 2.0,
    leverage INTEGER DEFAULT 10,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    symbol TEXT,
    type TEXT, -- 'BUY' or 'SELL'
    entry_price REAL,
    exit_price REAL,
    amount REAL,
    profit REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'CLOSED',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    price REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Simulated Market State
let currentPrice = 65000.0;
const symbol = "BTC/USDT";
let wss: WebSocketServer;

// Helper for RSI calculation (simplified)
function calculateRSI(prices: number[], period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[prices.length - i] - prices[prices.length - i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return 100 - 100 / (1 + rs);
}

// Trading Engine Loop
setInterval(() => {
  // Simulate price movement
  const volatility = 0.0008; // Slightly higher volatility for more action
  currentPrice *= 1 + (Math.random() - 0.5) * volatility;

  // Save price to history
  db.prepare("INSERT INTO price_history (symbol, price) VALUES (?, ?)").run(symbol, currentPrice);

  // Broadcast to all WS clients
  if (wss) {
    const message = JSON.stringify({
      type: "price_update",
      data: {
        symbol,
        price: currentPrice,
        timestamp: new Date().toISOString()
      }
    });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // 1. Manage Open Trades (SL/TP)
  const openTrades = db.prepare("SELECT * FROM trades WHERE status = 'OPEN'").all() as any[];
  openTrades.forEach(trade => {
    const config = db.prepare("SELECT * FROM bot_configs WHERE user_id = ?").get(trade.user_id) as any;
    if (!config) return;

    const priceDiff = ((currentPrice - trade.entry_price) / trade.entry_price) * 100;
    const profitPercent = trade.type === 'BUY' ? priceDiff : -priceDiff;
    const leveragedProfitPercent = profitPercent * config.leverage;

    let shouldClose = false;
    let closeReason = "";

    if (leveragedProfitPercent >= config.take_profit) {
      shouldClose = true;
      closeReason = "TAKE_PROFIT";
    } else if (leveragedProfitPercent <= -config.stop_loss) {
      shouldClose = true;
      closeReason = "STOP_LOSS";
    }

    if (shouldClose) {
      const profitAmount = (trade.amount * trade.entry_price) * (leveragedProfitPercent / 100);
      const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(trade.user_id) as any;
      const newBalance = user.balance + profitAmount + (trade.amount * trade.entry_price); // Return margin + profit

      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(newBalance, trade.user_id);
      db.prepare("UPDATE trades SET exit_price = ?, profit = ?, status = 'CLOSED', timestamp = CURRENT_TIMESTAMP WHERE id = ?")
        .run(currentPrice, profitAmount, trade.id);
      
      console.log(`Bot closed trade for user ${trade.user_id} via ${closeReason}. Profit: ${profitAmount}`);
    }
  });

  // 2. Execute Strategy for Active Bots
  const activeBots = db.prepare("SELECT * FROM bot_configs WHERE is_active = 1").all() as any[];
  const prices = db.prepare("SELECT price FROM price_history ORDER BY timestamp DESC LIMIT 50").all().map((p: any) => p.price).reverse();

  if (prices.length > 20) {
    const rsi = calculateRSI(prices);
    const ema20 = prices.reduce((a, b) => a + b, 0) / prices.length;

    activeBots.forEach(bot => {
      // Check if user already has an open trade
      const existingTrade = db.prepare("SELECT id FROM trades WHERE user_id = ? AND status = 'OPEN'").get(bot.user_id);
      if (existingTrade) return;

      let signal: 'BUY' | 'SELL' | null = null;
      if (rsi < 30 && currentPrice > ema20) signal = 'BUY';
      else if (rsi > 70 && currentPrice < ema20) signal = 'SELL';

      if (signal) {
        const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(bot.user_id) as any;
        const tradeAmount = user.balance * 0.1 / currentPrice; // Use 10% of balance
        const cost = tradeAmount * currentPrice;

        if (user.balance >= cost) {
          db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(user.balance - cost, bot.user_id);
          db.prepare("INSERT INTO trades (user_id, symbol, type, entry_price, amount, profit, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .run(bot.user_id, symbol, signal, currentPrice, tradeAmount, 0, 'OPEN');
          console.log(`Bot opened ${signal} trade for user ${bot.user_id} at ${currentPrice}`);
        }
      }
    });
  }
}, 3000);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New WS connection");
    // Send initial price
    ws.send(JSON.stringify({
      type: "price_update",
      data: { symbol, price: currentPrice, timestamp: new Date().toISOString() }
    }));
  });

  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      db.prepare("INSERT INTO bot_configs (user_id) VALUES (?)").run(info.lastInsertRowid);
      const user = { id: info.lastInsertRowid, email, name, balance: 10000.0 };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ token, user });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET);
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/market/price", (req, res) => {
    res.json({ symbol, price: currentPrice, timestamp: new Date().toISOString() });
  });

  app.get("/api/market/history", (req, res) => {
    const history = db.prepare("SELECT price, timestamp FROM price_history ORDER BY timestamp DESC LIMIT 100").all();
    res.json(history.reverse());
  });

  app.get("/api/bot/config", authenticateToken, (req: any, res) => {
    const config = db.prepare("SELECT * FROM bot_configs WHERE user_id = ?").get(req.user.id);
    res.json(config);
  });

  app.post("/api/bot/toggle", authenticateToken, (req: any, res) => {
    const { is_active } = req.body;
    db.prepare("UPDATE bot_configs SET is_active = ? WHERE user_id = ?").run(is_active ? 1 : 0, req.user.id);
    res.json({ success: true, is_active });
  });

  app.post("/api/bot/update", authenticateToken, (req: any, res) => {
    const { strategy, risk_level, stop_loss, take_profit, leverage } = req.body;
    db.prepare(`
      UPDATE bot_configs 
      SET strategy = ?, risk_level = ?, stop_loss = ?, take_profit = ?, leverage = ? 
      WHERE user_id = ?
    `).run(strategy, risk_level, stop_loss, take_profit, leverage, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/trades/history", authenticateToken, (req: any, res) => {
    const trades = db.prepare("SELECT * FROM trades WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50").all(req.user.id);
    res.json(trades);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
