
import React, { useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart
} from 'recharts';
import { MonthlyRecord, AppSettings } from '../types';
import { StatCard } from './StatCard';

interface DashboardProps {
  data: MonthlyRecord[];
  settings: AppSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, settings }) => {
  const sumExtras = (items: any[]) => items?.reduce((acc, curr) => acc + curr.value, 0) || 0;

  // 1. Prepare Data with Theoretical Calculation
  const sortedData = useMemo(() => {
    const raw = [...data].sort((a, b) => a.month.localeCompare(b.month));
    
    let runningTheoretical = 0;

    return raw.map((d, index) => {
      const prevRecord = index > 0 ? raw[index - 1] : null;
      
      // Actual Logic
      const actualAssets = d.balanceProvident + d.balanceInvestments + d.balanceLiquid + (d.balanceLent || 0);
      
      // Flows
      // Note: incomeSide (Investment) is included in total income flow for theoretical calc
      const totalIncome = d.incomeHand + d.incomeSide + d.incomeProvident + sumExtras(d.extraIncome || []);
      const totalExpense = d.expRent + d.expCreditCard + d.expBaiTiao + d.expHuabei + d.expDaily + sumExtras(d.extraExpenses || []);
      
      // Actual Savings for GOAL Calculation (Excluding Investment Income)
      // Pure Salary Savings = (Hand + Extra) - (Expenses)
      const salaryCashIncome = d.incomeHand + sumExtras(d.extraIncome || []);
      const salaryCashSaved = salaryCashIncome - totalExpense; 
      
      const providentSaved = d.incomeProvident;
      
      // Used for Goal Achievement (Strict)
      const totalSavedForGoal = providentSaved + salaryCashSaved;
      
      // Used for Actual Net Worth Growth (Loose)
      const totalSavedActual = totalSavedForGoal + d.incomeSide; 

      const savingsRate = totalIncome > 0 ? (totalSavedActual / totalIncome) : 0;

      // Goal Logic
      const targetCash = d.targetCash || settings.monthlyCashGoal;
      const targetProvident = d.targetProvident || settings.monthlyProvidentGoal;
      const totalGoal = targetCash + targetProvident;
      
      // Achievement Rate (Strict Mode: Investment Income doesn't help reach the goal)
      const achievementRate = totalGoal > 0 ? (totalSavedForGoal / totalGoal) : 0;
      
      // Logic: Did we meet specific sub-goals?
      const isProvidentMet = providentSaved >= targetProvident;
      const isCashMet = salaryCashSaved >= targetCash;
      const isGoalMet = isProvidentMet && isCashMet;

      // Theoretical Logic
      if (index === 0) {
        runningTheoretical = actualAssets;
      } else {
        const prevActual = prevRecord ? (prevRecord.balanceProvident + prevRecord.balanceInvestments + prevRecord.balanceLiquid + (prevRecord.balanceLent || 0)) : 0;
        // The theoretical asset should grow by the actual total savings (including investment)
        runningTheoretical = prevActual + totalSavedActual;
      }

      const theoreticalDelta = actualAssets - runningTheoretical;

      return {
        ...d,
        monthLabel: d.month.slice(5),
        fullMonth: d.month,
        actualAssets,
        theoreticalAssets: runningTheoretical,
        totalIncome,
        totalExpense,
        savings: totalSavedActual, // For display
        savingsForGoal: totalSavedForGoal,
        savingsRate,
        achievementRate, // The new hero metric (Strict)
        totalGoal,
        isGoalMet,
        providentSaved,
        cashSaved: salaryCashSaved,
        targetCash,
        targetProvident,
        theoreticalDelta,
        investmentIncome: d.incomeSide
      };
    });
  }, [data, settings]);

  const latest = sortedData[sortedData.length - 1];
  const previous = sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;

  // Stats for Cards
  const theoreticalDelta = latest ? latest.theoreticalDelta : 0; 
  const totalInvestmentIncome = sortedData.reduce((acc, curr) => acc + curr.investmentIncome, 0);

  // Colors
  const COLORS = {
    actual: '#3b82f6',    // Blue
    theoretical: '#94a3b8', // Slate (Gray dashed)
    expense: '#f43f5e',   // Rose
    income: '#10b981',    // Emerald
    liquid: '#3b82f6',
    provident: '#10b981',
    invest: '#f59e0b',
    lent: '#f97316'
  };

  const assetAllocation = latest ? [
    { name: '流动资金', value: latest.balanceLiquid, color: COLORS.liquid },
    { name: '公积金', value: latest.balanceProvident, color: COLORS.provident },
    { name: '基金/理财', value: latest.balanceInvestments, color: COLORS.invest },
    { name: '借出款项', value: latest.balanceLent || 0, color: COLORS.lent },
  ].filter(i => i.value > 0) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-slate-100 text-xs z-50 min-w-[180px]">
          <p className="font-bold text-slate-800 mb-2 font-mono border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between mb-1 last:mb-0 gap-4">
               <span className="text-slate-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: entry.color}}></span>
                  {entry.name}
               </span>
               <span className="font-mono text-slate-800 font-bold">
                 {entry.name.includes('率') || entry.name.includes('Rate')
                   ? `${(entry.value * 100).toFixed(1)}%` 
                   : entry.value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
               </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Helper for difference clarity
  const diffLabel = theoreticalDelta > 0 ? "比理论多" : "比理论少";
  const diffColorClass = theoreticalDelta >= 0 ? 'text-emerald-500' : 'text-rose-500';
  const diffSign = theoreticalDelta > 0 ? "+" : ""; // Negative number already has minus sign

  return (
    <div className="space-y-6 animate-slide-up pb-20 lg:pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">资产看板</h2>
            <p className="text-slate-500 text-sm mt-1">财务健康度全景分析</p>
         </div>
         <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit">
           最后更新: <span className="text-slate-800 font-bold">{latest?.fullMonth || '---'}</span>
         </span>
      </div>

      {/* Row 1: Detailed Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* 1. Asset Card (FIXED CLARITY) */}
        <StatCard 
          title="实际总资产 (ACTUAL)" 
          value={(latest?.actualAssets || 0).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
          subValue={
             theoreticalDelta !== 0 
             ? <span className={diffColorClass}>{diffSign}{theoreticalDelta.toLocaleString()} {diffLabel}</span>
             : "✨ 账实相符"
          }
          trend={theoreticalDelta >= 0 ? 'up' : 'down'}
          className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        
        {/* 2. Goal Achievement Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-soft group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
           <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-slate-500 text-[11px] uppercase tracking-widest font-bold">目标达成率 (GOAL)</h3>
            <div className="text-[10px] text-slate-400 font-mono">工资存 / 目标</div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
             <div className={`text-2xl font-bold font-mono tracking-tight ${(latest?.achievementRate || 0) >= 1 ? 'text-emerald-500' : (latest?.achievementRate || 0) >= 0.8 ? 'text-amber-500' : 'text-rose-500'}`}>
                {((latest?.achievementRate || 0) * 100).toFixed(1)}%
             </div>
          </div>
          <div className="mt-2 text-[10px] font-medium text-slate-500 flex flex-col relative z-10">
             <div className="flex justify-between w-full">
               <span>目标: ¥{(latest?.totalGoal||0).toLocaleString()}</span>
               <span>存下: <span className={(latest?.savingsForGoal||0) >= (latest?.totalGoal||0) ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>¥{(latest?.savingsForGoal || 0).toLocaleString()}</span></span>
             </div>
             {/* Progress Bar */}
             <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${(latest?.achievementRate || 0) >= 1 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                  style={{ width: `${Math.min((latest?.achievementRate || 0) * 100, 100)}%` }}
                ></div>
             </div>
          </div>
        </div>

        {/* 3. Income Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-soft group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-[11px] uppercase tracking-widest font-bold">本月总收入 (INCOME)</h3>
            <svg className="text-emerald-500" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800 tracking-tight mb-2">
            {(latest?.totalIncome || 0).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
             <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">含理财: +¥{(latest?.investmentIncome || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* 4. Expense Card */}
        <StatCard 
          title="本月总支出 (EXPENSE)" 
          value={(latest?.totalExpense || 0).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
          subValue={latest?.expDaily > 3000 ? "⚠️ 预算偏高" : "✅ 预算控制良好"}
          trend="neutral"
          icon={<svg className="text-rose-500" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>}
        />
      </div>

      {/* Row 2: Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-4 md:p-6 shadow-soft flex flex-col relative h-[350px] md:h-[420px]">
           <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-2">
              <h3 className="text-slate-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> 资产 vs 支出
              </h3>
              <div className="flex flex-wrap gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">
                 <div className="flex items-center gap-1"><span className="w-3 h-1 bg-blue-500 rounded"></span> 实际(左)</div>
                 <div className="flex items-center gap-1"><span className="w-3 h-1 bg-slate-400 rounded border border-dashed border-slate-400"></span> 理论(左)</div>
                 <div className="flex items-center gap-1"><span className="w-3 h-1 bg-rose-400 rounded opacity-50"></span> 支出(右)</div>
              </div>
           </div>
           
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={sortedData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                 <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                 <XAxis dataKey="fullMonth" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} tickFormatter={v => v.slice(2)} />
                 <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val/10000).toFixed(0)}w`} />
                 <YAxis yAxisId="right" orientation="right" stroke="#fda4af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                 <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                 <Area yAxisId="right" type="monotone" dataKey="totalExpense" name="月支出" fill="url(#colorExpense)" stroke={COLORS.expense} strokeWidth={2} strokeOpacity={0.6} />
                 <Line yAxisId="left" type="monotone" dataKey="theoreticalAssets" name="理论资产" stroke={COLORS.theoretical} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                 <Line yAxisId="left" type="monotone" dataKey="actualAssets" name="实际资产" stroke={COLORS.actual} strokeWidth={3} dot={{ r: 3, fill: COLORS.actual, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
               </ComposedChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft flex flex-col h-[300px] lg:h-auto">
          <h3 className="text-slate-800 font-bold mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-amber-500"></span> 资产分布
          </h3>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">总资产</span>
              <span className="text-sm md:text-base font-bold font-mono text-slate-800">
                {(latest?.actualAssets || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0, notation: 'compact' })}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
             {assetAllocation.map(a => (
               <div key={a.name} className="flex items-center gap-2 text-[10px]">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }}></div>
                 <span className="text-slate-500 font-medium truncate">{a.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Row 3: Goal Achievement Matrix (Heatmap) + Investment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-soft">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h3 className="text-slate-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 目标达成热力图 (Goal Achievement)
              </h3>
              <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
                 <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-600"></div> 超额 (>100%)</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400"></div> 达标 (100%)</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-300"></div> 接近 (>80%)</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-rose-200"></div> 未达标</div>
              </div>
           </div>
           
           {/* The Grid - Responsive */}
           <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {sortedData.slice(-12).map((r) => { 
                 // Coloring based on ACHIEVEMENT RATE
                 const rate = r.achievementRate;
                 const intensity = rate >= 1.05 ? 'bg-emerald-600 text-white' : // Bonus
                                   rate >= 1.0 ? 'bg-emerald-400 text-white' : // Met
                                   rate >= 0.8 ? 'bg-amber-300 text-amber-900' : // Close
                                   'bg-rose-100 text-rose-600 border border-rose-200'; // Fail
                 
                 return (
                   <div key={r.id} className={`relative p-3 md:p-4 rounded-xl transition-all hover:scale-105 hover:shadow-md cursor-default border ${r.isGoalMet ? 'border-transparent' : 'border-slate-100'} ${intensity} flex flex-col justify-between h-[80px] md:h-[90px]`}>
                      <div className="flex justify-between items-start opacity-90">
                         <span className="text-[10px] md:text-xs font-bold font-mono">{r.month.slice(5)}月</span>
                         {rate >= 1 && <span className="text-[10px]">★</span>}
                      </div>
                      
                      <div className="text-center">
                         <div className="text-lg md:text-xl font-bold font-mono tracking-tight leading-none">
                            {(rate * 100).toFixed(0)}<span className="text-xs opacity-70">%</span>
                         </div>
                         <div className="text-[8px] md:text-[9px] mt-1 font-mono opacity-80 uppercase tracking-wide">
                            达成率
                         </div>
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>
        
        {/* New Module: Investment / Bonus Summary with Chart */}
        <div className="lg:col-span-1 bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
           <h3 className="text-purple-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> 副业/理财增值
           </h3>
           
           <div className="space-y-6 relative z-10">
              <div>
                 <span className="text-[10px] text-purple-400 font-bold uppercase block mb-1">历史累计收益 (Total Gains)</span>
                 <span className="text-3xl font-mono font-bold text-purple-700 tracking-tight">
                    +{totalInvestmentIncome.toLocaleString()}
                 </span>
              </div>
              
              <div className="h-24 w-full mt-2 -ml-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={sortedData.slice(-6)}>
                      <defs>
                        <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#7c3aed', fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: any) => [`+¥${value}`, '']}
                      />
                      <Area type="monotone" dataKey="investmentIncome" stroke="#7c3aed" fillOpacity={1} fill="url(#colorInvest)" strokeWidth={2} />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
              
              <div className="pt-2 border-t border-purple-200/50 flex justify-between items-center">
                 <span className="text-[10px] text-purple-400 font-bold uppercase">最近一月</span>
                 <span className="text-sm font-mono font-bold text-purple-600">
                    +{latest?.investmentIncome.toLocaleString() || 0}
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
