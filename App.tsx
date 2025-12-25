
import React, { useState, useEffect } from 'react';
import { MOCK_HISTORY, MOCK_LOANS, DEFAULT_SETTINGS } from './constants';
import { MonthlyRecord, AppSettings, LoanRecord } from './types';
import { Dashboard } from './components/Dashboard';
import { InputForm } from './components/InputForm';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { LoanManager } from './components/LoanManager';

// Helper icons
const Icons = {
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  Table: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Handshake: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<'DASHBOARD' | 'TABLE' | 'ENTRY' | 'SETTINGS' | 'LOANS'>('DASHBOARD');
  const [editingRecord, setEditingRecord] = useState<MonthlyRecord | undefined>(undefined);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('quantMasterData');
    if (savedData) setRecords(JSON.parse(savedData));
    else setRecords(MOCK_HISTORY);

    const savedLoans = localStorage.getItem('quantMasterLoans');
    if (savedLoans) setLoans(JSON.parse(savedLoans));
    else setLoans(MOCK_LOANS);

    const savedSettings = localStorage.getItem('quantMasterSettings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    if (records.length > 0) localStorage.setItem('quantMasterData', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('quantMasterLoans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('quantMasterSettings', JSON.stringify(settings));
  }, [settings]);

  // Enterprise Wechat Notification (Mock Implementation)
  const sendNotification = async (record: MonthlyRecord) => {
    if (!settings.wechatWebhookUrl) return;
    try {
      const totalAssets = record.balanceProvident + record.balanceInvestments + record.balanceLiquid + (record.balanceLent || 0);
      console.log(`Sending notification to ${settings.wechatWebhookUrl}: Saved record for ${record.month}, Total Assets: ${totalAssets}`);
    } catch (e) {
      console.error("Failed to send notification");
    }
  };

  const handleSaveRecord = (record: MonthlyRecord) => {
    setRecords(prev => {
      const exists = prev.find(r => r.id === record.id);
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r);
      } else {
        return [...prev, record].sort((a, b) => a.month.localeCompare(b.month));
      }
    });
    sendNotification(record);
    setView('DASHBOARD');
    setEditingRecord(undefined);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm("确定要删除这条记录吗？此操作不可恢复。")) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleEditRecord = (record: MonthlyRecord) => {
    setEditingRecord(record);
    setView('ENTRY');
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setView('DASHBOARD');
  };

  // GRANULAR EXPORT
  const handleExport = () => {
    // 1. Identify all unique keys for dynamic columns (Banks, Extra Income, Extra Expenses, Loans)
    const allLiquidNames = new Set<string>();
    const allExtraIncomeNames = new Set<string>();
    const allExtraExpenseNames = new Set<string>();

    records.forEach(r => {
      r.liquidAssets?.forEach(a => allLiquidNames.add(a.name));
      r.extraIncome?.forEach(a => allExtraIncomeNames.add(a.name));
      r.extraExpenses?.forEach(a => allExtraExpenseNames.add(a.name));
    });

    const liquidCols = Array.from(allLiquidNames).sort();
    const incomeCols = Array.from(allExtraIncomeNames).sort();
    const expenseCols = Array.from(allExtraExpenseNames).sort();

    // 2. Build Header
    const header = [
      '月份', '记录时间', 
      '到手工资', '公积金收入', '副业/奖金', ...incomeCols.map(c => `收入_${c}`),
      '房租', '信用卡', '京东白条', '支付宝花呗', '零花钱预算', ...expenseCols.map(c => `支出_${c}`),
      '公积金余额', '基金理财', ...liquidCols.map(c => `资产_${c}`), '借出款项(资产)', '备注'
    ];

    // 3. Build Rows
    const rows = records.map(r => {
      // Helpers to find values
      const getLiquidVal = (name: string) => r.liquidAssets?.find(a => a.name === name)?.amount || 0;
      const getIncVal = (name: string) => r.extraIncome?.find(a => a.name === name)?.value || 0;
      const getExpVal = (name: string) => r.extraExpenses?.find(a => a.name === name)?.value || 0;

      return [
        r.month, r.recordDate,
        r.incomeHand, r.incomeProvident, r.incomeSide, ...incomeCols.map(c => getIncVal(c)),
        r.expRent, r.expCreditCard, r.expBaiTiao, r.expHuabei, r.expDaily, ...expenseCols.map(c => getExpVal(c)),
        r.balanceProvident, r.balanceInvestments, ...liquidCols.map(c => getLiquidVal(c)), r.balanceLent, 
        `"${(r.note || '').replace(/"/g, '""')}"` // CSV escape quotes
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [header.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuantMaster_Detailed_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const NavButton = ({ id, label, icon, colorClass = 'bg-blue-50 text-blue-700' }: any) => (
    <button 
      onClick={() => { setView(id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${view === id ? colorClass : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
    >
      {icon} {label}
    </button>
  );

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md">Q</div>
            <span className="font-bold text-slate-800">QuantMaster</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
           {isMobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
         </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Responsive */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col shadow-xl md:shadow-sm z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 hidden md:flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg mr-3 shadow-lg shadow-blue-500/30">Q</div>
          <div>
             <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-none">QuantMaster</h1>
             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Finance Pro</span>
          </div>
        </div>
        
        {/* Mobile Header Spacer inside drawer */}
        <div className="h-16 md:hidden flex items-center px-6 border-b border-slate-100 bg-slate-50">
           <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Menu Navigation</span>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <NavButton id="DASHBOARD" label="资产看板" icon={<Icons.Chart />} />
          <NavButton id="TABLE" label="历史明细" icon={<Icons.Table />} />
          <NavButton id="LOANS" label="借款管理" icon={<span className="flex items-center justify-center w-4 h-4 text-sm font-bold">¥</span>} colorClass="bg-orange-50 text-orange-600" />
          
          <div className="my-6 border-t border-slate-100 mx-2"></div>
          
          <button 
            onClick={() => { setEditingRecord(undefined); setView('ENTRY'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md transform active:scale-95 ${view === 'ENTRY' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-200'}`}
          >
            <Icons.Plus /> 记一笔
          </button>

          <button 
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 mt-2"
          >
            <Icons.Download /> 导出明细(CSV)
          </button>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
           <NavButton id="SETTINGS" label="设置" icon={<Icons.Settings />} colorClass="bg-white text-slate-800 shadow-sm" />
           <button onClick={() => { setIsAuthenticated(false); setView('DASHBOARD'); }} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
              <Icons.LogOut /> 退出登录
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar p-4 md:p-6 bg-[#f1f5f9] mt-16 md:mt-0">
        
        <div className="max-w-7xl mx-auto relative z-10">
          {view === 'DASHBOARD' && (
            <Dashboard data={records} settings={settings} />
          )}

          {view === 'LOANS' && (
             <LoanManager loans={loans} onUpdateLoans={setLoans} onClose={() => setView('DASHBOARD')} />
          )}

          {view === 'ENTRY' && (
            <div className="animate-fade-in pb-20 md:pb-0">
              <InputForm 
                initialData={editingRecord}
                lastRecord={records[records.length - 1]} 
                globalLoans={loans}
                settings={settings}
                onSave={handleSaveRecord}
                onCancel={() => setView('DASHBOARD')}
              />
            </div>
          )}

          {view === 'SETTINGS' && (
            <Settings 
              settings={settings}
              onSave={handleSaveSettings}
              onCancel={() => setView('DASHBOARD')}
            />
          )}

          {view === 'TABLE' && (
            <div className="animate-fade-in space-y-4 pb-20">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-6 rounded-3xl shadow-soft border border-slate-200/60 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">历史稽核记录</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">查看每月的 理论资产 vs 实际资产 及其差值</p>
                  </div>
                  <div className="flex gap-2">
                     {settings.autoFillMissingMonths && (
                        <span className="text-xs font-mono bg-quant-brand/10 text-quant-brand px-3 py-1.5 rounded-lg font-bold border border-quant-brand/20">
                          ⚡ 自动补全
                        </span>
                     )}
                     <span className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-bold">{records.length} 条记录</span>
                  </div>
               </div>

              <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-slate-200/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 min-w-[140px]">月份/时间</th>
                        <th className="px-6 py-4 text-center">达标状态</th>
                        <th className="px-6 py-4 text-right">理论总资产</th>
                        <th className="px-6 py-4 text-right text-blue-700">实际总资产</th>
                        <th className="px-6 py-4 text-right">差值</th>
                        <th className="px-6 py-4 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {/* Calculate derived data for table */}
                      {[...records].reverse().map((record, index, arr) => {
                        const originalIndex = arr.length - 1 - index; // because we reversed map but need access to prev record
                        const prevRecord = originalIndex > 0 ? records[originalIndex - 1] : null;

                        const extraIncome = record.extraIncome?.reduce((a, b) => a + b.value, 0) || 0;
                        const extraExpense = record.extraExpenses?.reduce((a, b) => a + b.value, 0) || 0;
                        
                        const totalIncome = record.incomeHand + record.incomeSide + record.incomeProvident + extraIncome;
                        const totalExpense = record.expRent + record.expCreditCard + record.expBaiTiao + record.expHuabei + record.expDaily + extraExpense;
                        
                        // Actual Assets
                        const actualTotalAssets = record.balanceProvident + record.balanceInvestments + record.balanceLiquid + (record.balanceLent || 0);
                        
                        // Theoretical Logic
                        let theoreticalAssets = 0;
                        let missingMonthsInfo = null;

                        if (prevRecord) {
                           const prevTotal = prevRecord.balanceProvident + prevRecord.balanceInvestments + prevRecord.balanceLiquid + (prevRecord.balanceLent || 0);
                           
                           let missingSavingsToAdd = 0;
                           if (settings.autoFillMissingMonths) {
                              const [prevY, prevM] = prevRecord.month.split('-').map(Number);
                              const [currY, currM] = record.month.split('-').map(Number);
                              const monthDiff = (currY - prevY) * 12 + (currM - prevM);
                              
                              if (monthDiff > 1) {
                                const missingCount = monthDiff - 1;
                                const monthlyGoal = (record.targetProvident || settings.monthlyProvidentGoal) + (record.targetCash || settings.monthlyCashGoal);
                                missingSavingsToAdd = missingCount * monthlyGoal;
                                missingMonthsInfo = missingCount;
                              }
                           }
                           theoreticalAssets = prevTotal + totalIncome - totalExpense + missingSavingsToAdd;
                        } else {
                           theoreticalAssets = actualTotalAssets; // First record assumes balance
                        }

                        const discrepancy = actualTotalAssets - theoreticalAssets;
                        const isExpanded = expandedRow === record.id;
                        const dateObj = new Date(record.recordDate);
                        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                        
                        // Savings Goals Logic (Backfill defaults if missing in old records)
                        const targetCash = record.targetCash || settings.monthlyCashGoal;
                        const targetProvident = record.targetProvident || settings.monthlyProvidentGoal;
                        
                        const cashSaved = (totalIncome - record.incomeProvident) - (totalExpense);
                        const providentSaved = record.incomeProvident;

                        const isCashMet = cashSaved >= targetCash;
                        const isProvidentMet = providentSaved >= targetProvident;
                        const isAllMet = isCashMet && isProvidentMet;

                        return (
                          <React.Fragment key={record.id}>
                            <tr 
                              className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                              onClick={() => toggleRow(record.id)}
                            >
                              <td className="px-6 py-4 font-mono font-medium text-slate-700 flex flex-col gap-1 min-w-[140px]">
                                <div className="flex items-center gap-2">
                                   <span className={`transform transition-transform text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}><Icons.ChevronDown /></span>
                                   <span className="font-bold text-lg">{record.month}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 pl-6">{dateStr}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {isAllMet ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-200">
                                    ✅ 达标
                                  </span>
                                ) : (
                                  <div className="flex flex-col items-center gap-1">
                                     {!isProvidentMet && <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-1 rounded">公积金未达标</span>}
                                     {!isCashMet && <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-1 rounded">现金未达标</span>}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-slate-500 font-medium">
                                {prevRecord ? (
                                    <div className="flex flex-col items-end">
                                      <span>¥{theoreticalAssets.toLocaleString()}</span>
                                      {missingMonthsInfo && (
                                        <span className="text-[9px] text-quant-brand bg-blue-50 px-1 rounded mt-0.5">
                                          含{missingMonthsInfo}个月自动补全
                                        </span>
                                      )}
                                    </div>
                                ) : '-'}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-blue-700 font-bold bg-blue-50/30">
                                ¥{actualTotalAssets.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold">
                                <span className={discrepancy === 0 ? 'text-emerald-500' : discrepancy > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {discrepancy > 0 ? '+' : ''}{discrepancy === 0 ? '-' : discrepancy.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center flex justify-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEditRecord(record); }}
                                  className="p-2 rounded-lg hover:bg-blue-100 hover:text-blue-700 text-slate-400 transition-all"
                                  title="编辑"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }}
                                  className="p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-all"
                                  title="删除"
                                >
                                  <Icons.Trash />
                                </button>
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr className="bg-slate-50/50 animate-fade-in">
                                <td colSpan={6} className="px-6 py-6 border-b border-slate-100 shadow-inner">
                                  {/* HEADER SUMMARY OF MONTH */}
                                  <div className="flex flex-col md:flex-row gap-4 mb-6 text-xs border-b border-slate-200 pb-4">
                                     <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                                        <span className="font-bold text-slate-500 uppercase">目标情况:</span>
                                        <div className="flex gap-3 font-mono">
                                           <span className={isProvidentMet ? 'text-emerald-600' : 'text-rose-500'}>
                                              公: ¥{targetProvident} {isProvidentMet ? '✓' : '✗'}
                                           </span>
                                           <span className="text-slate-300">|</span>
                                           <span className={isCashMet ? 'text-blue-600' : 'text-rose-500'}>
                                              现: ¥{targetCash} {isCashMet ? '✓' : '✗'}
                                           </span>
                                        </div>
                                     </div>
                                     <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                                        <span className="font-bold text-emerald-600">总收入: +{totalIncome.toLocaleString()}</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="font-bold text-rose-500">总支出: -{totalExpense.toLocaleString()}</span>
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-xs">
                                    {/* Assets Breakdown (Split logic) */}
                                    <div className="col-span-1 md:col-span-2 bg-white p-4 rounded-xl border border-blue-100">
                                      <h4 className="font-bold text-blue-600 mb-2 uppercase tracking-wider border-b border-blue-50 pb-2">实际资产构成</h4>
                                      <div className="space-y-3 font-mono">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">流动资金 (现金/卡/投资)</span>
                                            <span className="font-bold text-slate-800">
                                              ¥{(record.balanceLiquid + record.balanceInvestments).toLocaleString()}
                                            </span>
                                        </div>
                                        {/* Nested liquid breakdown */}
                                        <div className="pl-2 border-l-2 border-slate-100 ml-1 space-y-1 text-[10px] text-slate-500">
                                            {(record.liquidAssets || []).map(l => (
                                                <div key={l.id} className="flex justify-between"><span>{l.name}</span><span>{l.amount.toLocaleString()}</span></div>
                                            ))}
                                            <div className="flex justify-between"><span>基金理财</span><span>{record.balanceInvestments.toLocaleString()}</span></div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                            <span className="text-emerald-600 font-bold">公积金 (Provident)</span>
                                            <span className="font-bold text-emerald-600">¥{record.balanceProvident.toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-orange-500 font-bold">借出/应收 (Lent)</span>
                                            <span className="font-bold text-orange-500">¥{(record.balanceLent || 0).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Income Details */}
                                    <div>
                                      <h4 className="font-bold text-emerald-600 mb-2 uppercase tracking-wider border-b border-emerald-100 pb-1">收入</h4>
                                      <div className="space-y-1.5 text-slate-600 font-mono">
                                        <div className="flex justify-between"><span>到手工资</span> <span>{record.incomeHand.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>公积金</span> <span>{record.incomeProvident.toLocaleString()}</span></div>
                                        {record.incomeSide > 0 && <div className="flex justify-between"><span>副业/奖金</span> <span>{record.incomeSide.toLocaleString()}</span></div>}
                                        {record.extraIncome?.map(i => (
                                          <div key={i.id} className="flex justify-between text-emerald-600"><span>{i.name}</span> <span>{i.value.toLocaleString()}</span></div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Expense Details */}
                                    <div>
                                      <h4 className="font-bold text-rose-500 mb-2 uppercase tracking-wider border-b border-rose-100 pb-1">支出</h4>
                                      <div className="space-y-1.5 text-slate-600 font-mono">
                                        <div className="flex justify-between"><span>房租</span> <span>{record.expRent.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>信用卡</span> <span>{record.expCreditCard.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>京东白条</span> <span>{record.expBaiTiao.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>花呗</span> <span>{record.expHuabei.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>零花钱预算</span> <span>{record.expDaily.toLocaleString()}</span></div>
                                        {record.extraExpenses?.map(i => (
                                          <div key={i.id} className="flex justify-between text-rose-500"><span>{i.name}</span> <span>{i.value.toLocaleString()}</span></div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Loans Snapshot */}
                                    <div>
                                      <h4 className="font-bold text-orange-500 mb-2 uppercase tracking-wider border-b border-orange-100 pb-1">借出明细(快照)</h4>
                                      <div className="space-y-1.5 text-slate-600 font-mono mb-4">
                                        {(record.lentItems || []).map(item => (
                                           <div key={item.id} className="flex justify-between text-[10px]"><span className="truncate max-w-[80px]">{item.borrower}</span> <span className="text-orange-500">{item.amount.toLocaleString()}</span></div>
                                        ))}
                                        {(record.lentItems?.length === 0 && record.balanceLent > 0) && <div className="text-[10px] text-slate-400">无明细记录</div>}
                                      </div>
                                      {record.note && (
                                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-500 italic text-xs leading-relaxed shadow-sm">
                                          "{record.note}"
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
