export interface User {
  id: number;
  email: string;
  name: string;
  balance: number;
}

export interface BotConfig {
  user_id: number;
  is_active: boolean;
  strategy: string;
  risk_level: string;
  stop_loss: number;
  take_profit: number;
  leverage: number;
}

export interface Trade {
  id: number;
  user_id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  amount: number;
  profit: number | null;
  timestamp: string;
  status: 'OPEN' | 'CLOSED';
}

export interface PricePoint {
  price: number;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
