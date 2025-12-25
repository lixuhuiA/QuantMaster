
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MonthlyRecord, ExtraItem, LiquidAssetItem, LoanRecord, AppSettings } from '../types';
import { DEFAULT_LIQUID_ACCOUNTS } from '../constants';

interface InputFormProps {
  initialData?: MonthlyRecord;
  lastRecord?: MonthlyRecord;
  globalLoans: LoanRecord[]; 
  settings: AppSettings; 
  onSave: (record: MonthlyRecord, newLoans?: LoanRecord[]) => void;
  onCancel: () => void;
}

// Enhanced Number Input with Formatted Preview
const NumberInput = React.memo(({ 
  label, 
  value, 
  onChange, 
  placeholder = "0",
  showPreview = true,
  className = "",
  disabled = false
}: { 
  label: string, 
  value: number, 
  onChange: (val: number) => void, 
  placeholder?: string,
  showPreview?: boolean,
  className?: string,
  disabled?: boolean
}) => {
  return (
    <div className={`flex flex-col gap-2 group relative ${className}`}>
      <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-quant-brand transition-colors">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`glass-input w-full rounded-xl p-3 font-mono text-sm font-semibold tracking-tight focus:shadow-md transition-all ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
          placeholder={placeholder}
          disabled={disabled}
        />
        {/* Formatted Preview for large numbers */}
        {showPreview && value > 0 && (
           <div className="absolute right-3 top-3.5 pointer-events-none text-[10px] font-bold font-mono text-slate-400 bg-white/90 px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm border border-slate-100 max-w-[60%] truncate">
             ¥{value.toLocaleString()}
           </div>
        )}
      </div>
    </div>
  );
});

const SectionHeader = ({ title, colorClass, icon }: { title: string, colorClass: string, icon?: string }) => (
  <div className="flex items-center gap-3 mb-6 mt-8 pb-3 border-b border-slate-100">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${colorClass} shadow-md text-white font-bold text-sm transform -rotate-3`}>
      {icon || title[0]}
    </div>
    <h3 className="font-bold uppercase tracking-wide text-sm text-slate-800">{title}</h3>
  </div>
);

export const InputForm: React.FC<InputFormProps> = ({ initialData, lastRecord, globalLoans, settings, onSave, onCancel }) => {
  const activeGlobalLoans = useMemo(() => globalLoans.filter(l => l.status === 'UNPAID'), [globalLoans]);
  const [showAuditMobile, setShowAuditMobile] = useState(false); // Mobile collapsible state

  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [recordDateInput, setRecordDateInput] = useState(
    initialData?.recordDate ? formatDateTimeLocal(initialData.recordDate) : formatDateTimeLocal(new Date().toISOString())
  );

  // Auto-calculate default provident income based on settings (Total - Withdrawal)
  const defaultProvidentIncome = Math.max(0, settings.monthlyProvidentGoal - (settings.autoProvidentWithdrawal || 0));

  const [formData, setFormData] = useState<MonthlyRecord>(
    initialData || {
      id: crypto.randomUUID(),
      month: new Date().toISOString().slice(0, 7),
      recordDate: new Date().toISOString(),
      targetProvident: defaultProvidentIncome, // Goal snapshot matches the net retention
      targetCash: settings.monthlyCashGoal,           
      incomeHand: 0,
      incomeSide: 0,
      sideIncomeDetail: [], // Initialize details list
      incomeProvident: defaultProvidentIncome, // Auto-fill Remaining Provident
      extraIncome: [],
      expRent: 0,
      expCreditCard: 0,
      expBaiTiao: 0,
      expHuabei: 0,
      expDaily: 0,
      extraExpenses: [],
      balanceProvident: lastRecord ? lastRecord.balanceProvident + defaultProvidentIncome : 0, // Auto-add expected income
      balanceInvestments: lastRecord?.balanceInvestments || 0,
      balanceLiquid: 0, 
      liquidAssets: DEFAULT_LIQUID_ACCOUNTS.map((name, idx) => ({ 
        id: `def_${idx}`, name, amount: 0 
      })),
      balanceLent: 0,
      lentItems: activeGlobalLoans,
      note: ''
    }
  );

  const handleDateChange = (val: string) => {
    setRecordDateInput(val);
    handleChange('recordDate', new Date(val).toISOString());
  };

  useEffect(() => {
    const totalLiquid = formData.liquidAssets?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const totalLent = formData.lentItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
    
    // Auto-sum side income if details exist
    const totalSide = formData.sideIncomeDetail && formData.sideIncomeDetail.length > 0 
      ? formData.sideIncomeDetail.reduce((sum, item) => sum + item.value, 0)
      : formData.incomeSide; // Fallback to manual value if list is empty (but we sync state below)

    // Sync logic: If list is not empty, force incomeSide to be sum
    const syncedIncomeSide = (formData.sideIncomeDetail && formData.sideIncomeDetail.length > 0) ? totalSide : formData.incomeSide;

    setFormData(prev => ({
      ...prev,
      balanceLiquid: totalLiquid,
      balanceLent: totalLent,
      incomeSide: syncedIncomeSide
    }));
  }, [formData.liquidAssets, formData.lentItems, formData.sideIncomeDetail]);

  const sumExtras = (items?: ExtraItem[]) => items?.reduce((acc, curr) => acc + curr.value, 0) || 0;

  const theoreticalStats = useMemo(() => {
    if (!lastRecord) return null;
    const prevNet = lastRecord.balanceProvident + lastRecord.balanceInvestments + lastRecord.balanceLiquid + (lastRecord.balanceLent || 0);

    const totalIncome = Number(formData.incomeHand) + Number(formData.incomeSide) + Number(formData.incomeProvident) + sumExtras(formData.extraIncome);
    const totalExpense = Number(formData.expRent) + Number(formData.expCreditCard) + Number(formData.expBaiTiao) + Number(formData.expHuabei) + Number(formData.expDaily) + sumExtras(formData.extraExpenses);
    
    return {
      prevNet,
      totalIncome,
      totalExpense,
      shouldBeNet: prevNet + totalIncome - totalExpense
    };
  }, [formData, lastRecord]);

  const actualStats = useMemo(() => {
    // Assets: Liquid + Provident + Invest + Lent
    const assets = Number(formData.balanceProvident) + Number(formData.balanceInvestments) + Number(formData.balanceLiquid) + Number(formData.balanceLent);
    return {
      assets,
      netWorth: assets 
    };
  }, [formData]);

  // --- SPLIT SAVINGS ANALYSIS ---
  const savingsAnalysis = useMemo(() => {
    // 1. Provident Analysis (Net Remaining in Account)
    const providentSaved = Number(formData.incomeProvident);
    const providentGoal = formData.targetProvident || (settings.monthlyProvidentGoal - (settings.autoProvidentWithdrawal || 0));
    const isProvidentMet = providentSaved >= providentGoal;

    // 2. Cash Analysis (UPDATED: EXCLUDE INVESTMENT INCOME from "Mandatory Savings Check")
    const cashIncomeForGoal = Number(formData.incomeHand) + sumExtras(formData.extraIncome);
    const cashExpenses = Number(formData.expRent) + Number(formData.expCreditCard) + Number(formData.expBaiTiao) + Number(formData.expHuabei) + Number(formData.expDaily) + sumExtras(formData.extraExpenses);
    
    const cashSaved = cashIncomeForGoal - cashExpenses; // Strictly salary savings
    const cashGoal = formData.targetCash || settings.monthlyCashGoal;
    const isCashMet = cashSaved >= cashGoal;

    return {
        providentSaved,
        providentGoal,
        isProvidentMet,
        cashSaved,
        cashGoal,
        isCashMet,
        investmentIncome: Number(formData.incomeSide), // The bonus part
        totalSavedIncludingInvest: cashSaved + Number(formData.incomeSide) + providentSaved,
        cashExpenses
    };
  }, [formData, settings]);

  const discrepancy = theoreticalStats ? actualStats.netWorth - theoreticalStats.shouldBeNet : 0;

  const handleChange = useCallback((field: keyof MonthlyRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update generic lists
  const updateListItem = (listKey: 'extraIncome' | 'extraExpenses' | 'liquidAssets' | 'lentItems' | 'sideIncomeDetail', id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [listKey]: (prev[listKey] as any[])?.map(item => item.id === id ? { ...item, [field]: value } : item) || []
    }));
  };

  const addListItem = (listKey: 'extraIncome' | 'extraExpenses' | 'liquidAssets' | 'sideIncomeDetail', defaultItem: any) => {
    setFormData(prev => ({
      ...prev,
      [listKey]: [...(prev[listKey] as any[] || []), { ...defaultItem, id: crypto.randomUUID() }]
    }));
  };
  
  const addNewLoan = () => {
    const newLoan: LoanRecord = {
        id: crypto.randomUUID(),
        borrower: '',
        date: new Date().toISOString().slice(0,10),
        amount: 0,
        status: 'UNPAID',
        repaidAmount: 0
    };
    setFormData(prev => ({
        ...prev,
        lentItems: [...(prev.lentItems || []), newLoan]
    }));
  };

  const removeListItem = (listKey: 'extraIncome' | 'extraExpenses' | 'liquidAssets' | 'lentItems' | 'sideIncomeDetail', id: string) => {
    setFormData(prev => ({
      ...prev,
      [listKey]: (prev[listKey] as any[])?.filter(item => item.id !== id) || []
    }));
  };

  const handleSave = () => {
    const recordToSave = {
        ...formData,
        targetProvident: formData.targetProvident,
        targetCash: formData.targetCash
    };
    onSave(recordToSave);
  };

  // Helper to add side income with tag
  const addSideIncomeTag = (tagName: string) => {
    addListItem('sideIncomeDetail', { name: tagName, value: 0 });
  };

  return (
    <div className="bg-white rounded-3xl shadow-soft flex flex-col lg:flex-row h-full lg:h-[calc(100vh-80px)] overflow-hidden animate-slide-up border border-slate-200">
      
      {/* LEFT: Scrollable Form - Flex Grow */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar pb-32 lg:pb-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
          <div>
             <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-50 text-quant-brand flex items-center justify-center text-lg md:text-xl">❖</div>
              {initialData ? '编辑月度记录' : '新月度入账'}
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-mono pl-12 md:pl-14">Record ID: {formData.id.slice(0,8)}...</p>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                 <label className="text-[10px] uppercase font-bold text-slate-400">月份</label>
                 <input
                   type="month"
                   value={formData.month}
                   onChange={(e) => handleChange('month', e.target.value)}
                   className="bg-white border border-slate-200 shadow-sm rounded-lg px-2 md:px-3 py-1.5 font-mono text-xs md:text-sm font-bold text-slate-700 focus:outline-none focus:border-quant-brand"
                 />
               </div>
             </div>
             
             <div className="flex items-center gap-2 mt-2">
               <label className="text-[10px] uppercase font-bold text-slate-400">时间</label>
               <input
                 type="datetime-local"
                 value={recordDateInput}
                 onChange={(e) => handleDateChange(e.target.value)}
                 className="bg-white border border-slate-200 shadow-sm rounded-lg px-2 md:px-3 py-1.5 font-mono text-[10px] md:text-xs font-medium text-slate-500 focus:outline-none focus:border-quant-brand w-32 md:w-auto"
               />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-16 gap-y-8">
          
          {/* COLUMN 1: Flows */}
          <div>
            {/* 1. INCOME (SALARY) */}
            <SectionHeader title="工资/公积金 (Salary)" colorClass="from-emerald-400 to-emerald-600" icon="¥" />
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              <NumberInput label="到手工资" value={formData.incomeHand} onChange={(v) => handleChange('incomeHand', v)} />
              <NumberInput label="公积金收入(留存)" value={formData.incomeProvident} onChange={(v) => handleChange('incomeProvident', v)} />
            </div>
            
            <div className="bg-emerald-50/50 p-2 rounded-lg mt-2 text-[10px] text-emerald-700 border border-emerald-100/50 mb-4">
               ℹ️ 公积金留存已自动减去提现额度 (¥{(settings.autoProvidentWithdrawal || 0).toLocaleString()})
            </div>

            {/* 2. INVESTMENT INCOME (SIDE MODULE) - UPDATED WITH AUTO TAGS */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-2xl border border-purple-100 mb-6 relative group overflow-hidden transition-all duration-300">
               <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
               <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                 <span className="bg-purple-200 text-purple-700 px-1.5 rounded text-[10px]">EXTRA</span> 副业/理财收益
               </h4>
               <p className="text-[10px] text-purple-400/80 mb-3 leading-snug">此部分为额外增值，不计入“强制储蓄”达标考核。</p>
               
               <NumberInput 
                 label={`净收益总额 ${formData.sideIncomeDetail?.length ? '(自动计算)' : ''}`}
                 value={formData.incomeSide} 
                 onChange={(v) => handleChange('incomeSide', v)} 
                 className="bg-white/60 mb-3"
                 placeholder="0"
                 disabled={formData.sideIncomeDetail && formData.sideIncomeDetail.length > 0}
               />

               {/* AUTO TAGS */}
               <div className="flex gap-2 flex-wrap mb-2">
                  {['股票', '理财', '基金', '闲鱼'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => addSideIncomeTag(tag)}
                      className="px-2 py-1 rounded-md bg-white border border-purple-200 text-purple-600 text-[10px] font-bold hover:bg-purple-100 transition-colors shadow-sm"
                    >
                      +{tag}
                    </button>
                  ))}
               </div>

               {/* Detail Items */}
               {formData.sideIncomeDetail && formData.sideIncomeDetail.length > 0 && (
                 <div className="space-y-2 bg-white/50 p-2 rounded-lg border border-purple-100/50">
                    {formData.sideIncomeDetail.map(item => (
                      <div key={item.id} className="flex gap-2 items-center animate-fade-in">
                        <input type="text" value={item.name} onChange={(e) => updateListItem('sideIncomeDetail', item.id, 'name', e.target.value)} className="flex-1 glass-input rounded-md p-1.5 text-xs bg-white" />
                        <input type="number" value={item.value || ''} onChange={(e) => updateListItem('sideIncomeDetail', item.id, 'value', parseFloat(e.target.value)||0)} className="w-20 glass-input rounded-md p-1.5 text-xs text-right font-mono bg-white" placeholder="0" />
                        <button onClick={() => removeListItem('sideIncomeDetail', item.id)} className="text-purple-300 hover:text-purple-600">×</button>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            {/* Custom Income List */}
            <div className="mt-4 space-y-3">
              {(formData.extraIncome || []).map(item => (
                <div key={item.id} className="flex gap-2 items-center animate-fade-in">
                  <input type="text" value={item.name} onChange={(e) => updateListItem('extraIncome', item.id, 'name', e.target.value)} placeholder="收入项名称" className="flex-1 glass-input rounded-lg p-2 text-xs" />
                  <input type="number" value={item.value || ''} onChange={(e) => updateListItem('extraIncome', item.id, 'value', parseFloat(e.target.value)||0)} placeholder="0" className="w-24 glass-input rounded-lg p-2 text-xs text-right font-mono" />
                  <button onClick={() => removeListItem('extraIncome', item.id)} className="text-slate-300 hover:text-rose-500">×</button>
                </div>
              ))}
              <button onClick={() => addListItem('extraIncome', {name:'', value:0})} className="text-xs text-quant-brand font-medium hover:underline">+ 添加其他收入</button>
            </div>

            {/* 3. EXPENSE (HARD) */}
            <SectionHeader title="硬性支出 (Fixed Expense)" colorClass="from-rose-400 to-rose-600" icon="-" />
            <div className="grid grid-cols-2 gap-3 md:gap-5 mb-6">
              <NumberInput label="房租" value={formData.expRent} onChange={(v) => handleChange('expRent', v)} />
              <NumberInput label="信用卡还款" value={formData.expCreditCard} onChange={(v) => handleChange('expCreditCard', v)} />
              <NumberInput label="京东白条" value={formData.expBaiTiao} onChange={(v) => handleChange('expBaiTiao', v)} />
              <NumberInput label="支付宝花呗" value={formData.expHuabei} onChange={(v) => handleChange('expHuabei', v)} />
            </div>

             {/* 4. BUDGET (POCKET MONEY MODULE) */}
             <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 mb-6 relative group overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
               <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                 <span className="bg-amber-200 text-amber-700 px-1.5 rounded text-[10px]">NEXT</span> 下月预算 / 零花钱
               </h4>
               <p className="text-[10px] text-amber-400/80 mb-3 leading-snug">预留给下个月的日常开销资金 (计入本月支出)。</p>
               <NumberInput 
                 label="预算金额 (Budget)" 
                 value={formData.expDaily} 
                 onChange={(v) => handleChange('expDaily', v)} 
                 className="bg-white/60"
                 placeholder="0"
               />
            </div>

             <div className="mt-4 space-y-3">
              {(formData.extraExpenses || []).map(item => (
                <div key={item.id} className="flex gap-2 items-center animate-fade-in">
                  <input type="text" value={item.name} onChange={(e) => updateListItem('extraExpenses', item.id, 'name', e.target.value)} placeholder="支出项名称" className="flex-1 glass-input rounded-lg p-2 text-xs" />
                  <input type="number" value={item.value || ''} onChange={(e) => updateListItem('extraExpenses', item.id, 'value', parseFloat(e.target.value)||0)} placeholder="0" className="w-24 glass-input rounded-lg p-2 text-xs text-right font-mono" />
                  <button onClick={() => removeListItem('extraExpenses', item.id)} className="text-slate-300 hover:text-rose-500">×</button>
                </div>
              ))}
              <button onClick={() => addListItem('extraExpenses', {name:'', value:0})} className="text-xs text-quant-brand font-medium hover:underline">+ 添加其他支出</button>
            </div>
          </div>

          {/* COLUMN 2: Assets & Loans */}
          <div>
            {/* LIQUID ASSETS */}
            <SectionHeader title="流动资金/账户 (Liquid Assets)" colorClass="from-blue-500 to-indigo-600" icon="$" />
            <div className="bg-slate-50 rounded-2xl p-4 md:p-5 border border-slate-100 space-y-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="col-span-6">账户名称</span>
                <span className="col-span-6 text-right pr-6">余额</span>
              </div>
              {(formData.liquidAssets || []).map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input 
                    type="text" 
                    value={item.name} 
                    onChange={(e) => updateListItem('liquidAssets', item.id, 'name', e.target.value)} 
                    className="col-span-6 bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:border-quant-brand focus:outline-none"
                    placeholder="账户名"
                  />
                  <div className="col-span-5 relative">
                    <span className="absolute left-2 md:left-3 top-2.5 text-slate-400 text-xs">¥</span>
                    <input 
                      type="number" 
                      value={item.amount || ''} 
                      onChange={(e) => updateListItem('liquidAssets', item.id, 'amount', parseFloat(e.target.value)||0)} 
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-5 md:pl-6 text-sm font-mono font-bold text-slate-800 text-right focus:border-quant-brand focus:outline-none" 
                      placeholder="0"
                    />
                  </div>
                   <button onClick={() => removeListItem('liquidAssets', item.id)} className="col-span-1 text-slate-300 hover:text-rose-500 flex justify-center">×</button>
                </div>
              ))}
              <button 
                onClick={() => addListItem('liquidAssets', {name:'', amount:0})} 
                className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500 hover:border-quant-brand hover:text-quant-brand transition-colors font-medium mt-2"
              >
                + 添加账户
              </button>
              
              <div className="pt-3 mt-2 border-t border-slate-200 flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500">总流动资金</span>
                 <span className="text-lg font-mono font-bold text-blue-600">¥{formData.balanceLiquid.toLocaleString()}</span>
              </div>
            </div>

            {/* OTHER ASSETS */}
            <div className="mt-6 space-y-4">
               <NumberInput label="公积金余额 (Provident Fund)" value={formData.balanceProvident} onChange={(v) => handleChange('balanceProvident', v)} />
               <NumberInput label="基金/理财 (Investments)" value={formData.balanceInvestments} onChange={(v) => handleChange('balanceInvestments', v)} />
            </div>

            {/* LOANS */}
            <SectionHeader title="借出/应收账款 (Money Lent)" colorClass="from-orange-400 to-amber-600" icon="🤝" />
            <div className="bg-orange-50/50 rounded-2xl p-4 md:p-5 border border-orange-100/50 space-y-4">
              <p className="text-[10px] text-orange-400 mb-2 leading-relaxed">
                此处列出截至本月末，别人依然欠您的钱（也是您的资产）。
              </p>
              
              {(formData.lentItems || []).map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input 
                    type="text" 
                    value={item.borrower} 
                    onChange={(e) => updateListItem('lentItems', item.id, 'borrower', e.target.value)} 
                    className="col-span-4 bg-white border border-orange-200 rounded-lg p-2 text-xs text-slate-700"
                    placeholder="谁?"
                  />
                  <input 
                    type="date" 
                    value={item.date} 
                    onChange={(e) => updateListItem('lentItems', item.id, 'date', e.target.value)} 
                    className="col-span-3 bg-white border border-orange-200 rounded-lg p-2 text-[10px] md:text-xs text-slate-500"
                  />
                  <input 
                    type="number" 
                    value={item.amount || ''} 
                    onChange={(e) => updateListItem('lentItems', item.id, 'amount', parseFloat(e.target.value)||0)} 
                    className="col-span-4 bg-white border border-orange-200 rounded-lg p-2 text-xs font-mono text-right text-orange-600 font-bold"
                    placeholder="0"
                  />
                  <button onClick={() => removeListItem('lentItems', item.id)} className="col-span-1 text-orange-300 hover:text-orange-600 flex justify-center">×</button>
                </div>
              ))}

              <button 
                onClick={addNewLoan}
                className="w-full py-2 border-2 border-dashed border-orange-200 rounded-xl text-xs text-orange-500 hover:bg-orange-50 transition-colors font-medium mt-2"
              >
                + 登记新借出
              </button>

              <div className="pt-3 mt-2 border-t border-orange-200 flex justify-between items-center">
                 <span className="text-xs font-bold text-orange-500">总待收资产</span>
                 <span className="text-lg font-mono font-bold text-orange-600">¥{formData.balanceLent.toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-10">
           <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">本月备注</label>
           <textarea 
             className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 min-h-[100px] focus:outline-none focus:border-quant-brand transition-colors"
             value={formData.note}
             onChange={(e) => handleChange('note', e.target.value)}
             placeholder="记录本月的重要财务变动、大额支出原因或投资心得..."
           />
        </div>
      </div>

      {/* RIGHT/BOTTOM: Real-time Audit (Fixed Footer Layout) */}
      <div className={`
        bg-slate-50 border-t border-slate-200 flex flex-col transition-all duration-300
        lg:w-[400px] lg:border-t-0 lg:border-l lg:h-full lg:relative
        fixed bottom-0 left-0 right-0 z-40
        ${showAuditMobile ? 'h-[80vh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)]' : 'h-[80px]'}
        lg:h-full lg:rounded-none lg:shadow-none lg:bg-slate-50
      `}>
        
        {/* 1. Mobile Toggle / Header (Always Visible) */}
        <div 
          className="flex-none h-[80px] w-full flex items-center justify-between px-6 bg-white border-b border-slate-100 cursor-pointer lg:cursor-default"
          onClick={() => setShowAuditMobile(!showAuditMobile)}
        >
           <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase">当前实际总资产</span>
              <span className="text-xl font-mono font-bold text-slate-800">¥{actualStats.netWorth.toLocaleString()}</span>
           </div>
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${discrepancy === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
              {discrepancy === 0 ? '账平' : `差: ${discrepancy > 0 ? '+' : ''}${discrepancy}`}
              <span className={`lg:hidden transform transition-transform ${showAuditMobile ? 'rotate-180' : ''}`}>▲</span>
           </div>
        </div>

        {/* 2. Scrollable Content Area (Flex-1) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <h3 className="hidden lg:flex text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 实时稽核 (Real-time Audit)
          </h3>
          
          {/* Savings Goal Analysis */}
          <div className={`p-5 rounded-2xl border shadow-sm transition-all ${(savingsAnalysis.isProvidentMet && savingsAnalysis.isCashMet) ? 'bg-emerald-50/60 border-emerald-100' : 'bg-rose-50/60 border-rose-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
                🎯 强制储蓄目标
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(savingsAnalysis.isProvidentMet && savingsAnalysis.isCashMet) ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {(savingsAnalysis.isProvidentMet && savingsAnalysis.isCashMet) ? '完美达标' : '未完全达标'}
              </span>
            </div>
            
            <div className="mb-3 pb-3 border-b border-dashed border-slate-200/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${savingsAnalysis.isProvidentMet ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    公积金储蓄
                  </span>
                  <span className={`font-mono font-bold ${savingsAnalysis.isProvidentMet ? 'text-emerald-700' : 'text-rose-600'}`}>
                    ¥{savingsAnalysis.providentSaved.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] pl-3">
                  <span className="text-slate-400">目标(净): ¥{savingsAnalysis.providentGoal.toLocaleString()}</span>
                  {!savingsAnalysis.isProvidentMet && <span className="text-rose-500">差: -¥{(savingsAnalysis.providentGoal - savingsAnalysis.providentSaved).toLocaleString()}</span>}
                </div>
            </div>

            <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${savingsAnalysis.isCashMet ? 'bg-blue-500' : 'bg-rose-500'}`}></span>
                    现金存钱 (工资)
                  </span>
                  <span className={`font-mono font-bold ${savingsAnalysis.isCashMet ? 'text-blue-700' : 'text-rose-600'}`}>
                    ¥{savingsAnalysis.cashSaved.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] pl-3">
                  <span className="text-slate-400">目标: ¥{savingsAnalysis.cashGoal.toLocaleString()}</span>
                  {!savingsAnalysis.isCashMet && <span className="text-rose-500">差: -¥{(savingsAnalysis.cashGoal - savingsAnalysis.cashSaved).toLocaleString()}</span>}
                </div>
            </div>

            {!savingsAnalysis.isCashMet && (
              <div className="bg-white/50 p-2 rounded-lg text-[10px] text-rose-600 leading-snug border border-rose-100/50">
                ⚠️ <strong>工资结余不足！</strong>
                <br/>
                硬支出+预算 (¥{savingsAnalysis.cashExpenses.toLocaleString()}) 过高，挤占了强制储蓄额度。
              </div>
            )}
          </div>

          {/* Investment Bonus Display */}
          {savingsAnalysis.investmentIncome > 0 && (
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">额外资产增值</span>
                  <span className="text-[9px] text-purple-400">不计入存钱达标考核</span>
               </div>
               <span className="font-mono font-bold text-purple-700 text-lg">+¥{savingsAnalysis.investmentIncome.toLocaleString()}</span>
            </div>
          )}

          {/* Theoretical */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden opacity-90 hidden lg:block">
            <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">理论资产净值 (上月净值 + 收 - 支)</span>
            <span className="text-2xl font-mono text-slate-800 tracking-tight font-semibold">
              {theoreticalStats ? theoreticalStats.shouldBeNet.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' }) : '---'}
            </span>
          </div>

          {/* Actual (Desktop Only Detail) */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white relative overflow-hidden hidden lg:block">
            <span className="text-[10px] text-blue-200 block mb-1 uppercase tracking-wider font-bold">实际资产总值 (当前盘点)</span>
            <span className="text-3xl font-bold font-mono tracking-tight text-white">
              {actualStats.netWorth.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' }) || "¥0.00"}
            </span>
            <div className="mt-4 pt-4 border-t border-blue-500/30 text-xs flex justify-between font-mono text-blue-100">
                <span title="现金+理财">资金: {(Number(formData.balanceLiquid) + Number(formData.balanceInvestments)).toLocaleString()}</span>
                <span title="借出未还">借出: {Number(formData.balanceLent).toLocaleString()}</span>
            </div>
          </div>

          {/* Discrepancy */}
          <div className={`p-6 rounded-2xl border-2 transition-all duration-500 ${discrepancy === 0 ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'}`}>
            <span className="text-[10px] uppercase tracking-wider block mb-2 font-bold opacity-70 text-slate-600">
              资产差值 (Asset Discrepancy)
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-bold tracking-tight ${discrepancy === 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
              </span>
            </div>
            <p className="text-[11px] mt-3 text-slate-600 leading-relaxed font-medium">
              {discrepancy === 0 ? "✨ 完美平衡！账实相符。" : discrepancy > 0 ? "📈 实际 > 理论。可能有额外收益或漏记收入。" : "📉 实际 < 理论。可能漏记消费或借款未登记。"}
            </p>
          </div>
          
          {/* Spacer to ensure last element isn't hidden by scroll/padding on some devices */}
          <div className="h-4"></div>
        </div>

        {/* 3. Footer Action Buttons (Fixed at Bottom of Panel) */}
        <div className="flex-none p-4 lg:p-6 border-t border-slate-100 bg-white lg:bg-slate-50 z-10">
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleSave}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02] active:scale-95 text-sm uppercase tracking-wide"
            >
              确认入账
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors text-xs"
            >
              取消修改
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
