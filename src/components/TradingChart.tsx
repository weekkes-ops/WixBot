import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PricePoint } from '../types';

interface TradingChartProps {
  data: PricePoint[];
}

export default function TradingChart({ data }: TradingChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F0B90B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            tick={{ fill: '#848E9C', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val?.toLocaleString() ?? '0'}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B2F36', borderRadius: '4px' }}
            itemStyle={{ color: '#F0B90B' }}
            labelStyle={{ display: 'none' }}
            formatter={(value: number) => [`$${value?.toLocaleString() ?? '0'}`, 'Price']}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#F0B90B" 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            strokeWidth={2}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
