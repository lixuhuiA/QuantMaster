import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, trend, icon, className }) => {
  return (
    <div className={`bg-white border border-quant-border p-5 rounded-2xl shadow-soft relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${className}`}>
      
      <div className="flex justify-between items-start mb-3 relative z-10">
        <h3 className="text-quant-muted text-[11px] uppercase tracking-widest font-bold">{title}</h3>
        {icon && <div className="text-slate-300 group-hover:text-quant-brand transition-colors">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2 relative z-10">
        <span className="text-2xl font-bold font-mono text-quant-text tracking-tight">{value}</span>
      </div>
      
      {subValue && (
        <div className={`text-[11px] mt-2 font-medium flex items-center gap-1 ${
          trend === 'up' ? 'text-quant-success bg-emerald-50 px-2 py-0.5 rounded-full w-fit' : 
          trend === 'down' ? 'text-quant-danger bg-rose-50 px-2 py-0.5 rounded-full w-fit' : 
          'text-quant-muted'
        }`}>
          {trend === 'up' && '▲'}
          {trend === 'down' && '▼'}
          {subValue}
        </div>
      )}
    </div>
  );
};