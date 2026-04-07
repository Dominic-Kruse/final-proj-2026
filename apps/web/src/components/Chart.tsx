// import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// 1. Define the shape of your sales data
interface WeeklySales {
  day: string;
  revenue: number;
}

// 2. Mock data following the interface
const salesData: WeeklySales[] = [
  { day: 'Mon', revenue: 4200 },
  { day: 'Tue', revenue: 3800 },
  { day: 'Wed', revenue: 5100 },
  { day: 'Thu', revenue: 4600 },
  { day: 'Fri', revenue: 6200 },
  { day: 'Sat', revenue: 3100 },
  { day: 'Sun', revenue: 2400 },
];

export function Chart() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
      <div className="flex flex-col mb-6">
        <h2 className="text-lg font-bold text-slate-800">Weekly Revenue</h2>
        <p className="text-sm text-slate-500">Performance tracking for current week</p>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
              itemStyle={{ color: '#2563eb', fontSize: '12px' }}
            />
            
            <Bar 
              dataKey="revenue" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            >
              {salesData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Use a nice "Pharmacy Blue" for the bars
                  fill={entry.revenue > 5000 ? '#2563eb' : '#cbd5e1'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}