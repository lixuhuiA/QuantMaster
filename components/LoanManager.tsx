
import React, { useState } from 'react';
import { LoanRecord } from '../types';

interface LoanManagerProps {
  loans: LoanRecord[];
  onUpdateLoans: (loans: LoanRecord[]) => void;
  onClose: () => void;
}

export const LoanManager: React.FC<LoanManagerProps> = ({ loans, onUpdateLoans, onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLoan, setNewLoan] = useState<Partial<LoanRecord>>({
    borrower: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const handleAddLoan = () => {
    if (!newLoan.borrower || !newLoan.amount) return;
    const loan: LoanRecord = {
      id: crypto.randomUUID(),
      borrower: newLoan.borrower,
      amount: newLoan.amount,
      date: newLoan.date || new Date().toISOString().slice(0, 10),
      status: 'UNPAID',
      repaidAmount: 0,
      notes: newLoan.notes
    };
    onUpdateLoans([...loans, loan]);
    setIsAdding(false);
    setNewLoan({ borrower: '', amount: 0, date: new Date().toISOString().slice(0, 10), notes: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条借款记录吗？')) {
      onUpdateLoans(loans.filter(l => l.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    onUpdateLoans(loans.map(l => {
      if (l.id === id) {
        // Toggle logic: If UNPAID -> PAID, if PAID -> UNPAID
        return l.status === 'PAID' 
          ? { ...l, status: 'UNPAID', repaidAmount: 0 }
          : { ...l, status: 'PAID', repaidAmount: l.amount };
      }
      return l;
    }));
  };

  const totalLent = loans.reduce((acc, l) => acc + l.amount, 0);
  const totalUnpaid = loans.reduce((acc, l) => l.status !== 'PAID' ? acc + (l.amount - l.repaidAmount) : acc, 0);

  return (
    <div className="bg-white rounded-3xl shadow-soft p-8 animate-fade-in border border-slate-200 min-h-[500px] flex flex-col">
      <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="bg-orange-100 text-orange-600 p-2 rounded-lg text-xl">🤝</span>
            借出款项管理 (Loan Ledger)
          </h2>
          <p className="text-slate-500 text-sm mt-2">记录谁借了您的钱，以及当前的还款状态。</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">当前总待收 (Outstanding)</p>
          <p className="text-3xl font-mono font-bold text-orange-600">¥{totalUnpaid.toLocaleString()}</p>
        </div>
      </div>

      {/* Input Area */}
      {isAdding ? (
        <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-200 animate-slide-up">
          <h3 className="text-sm font-bold text-slate-700 mb-4">✍️ 登记新借条</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text" 
              placeholder="借款人姓名" 
              className="glass-input p-3 rounded-xl"
              value={newLoan.borrower}
              onChange={e => setNewLoan({...newLoan, borrower: e.target.value})}
            />
            <input 
              type="number" 
              placeholder="金额" 
              className="glass-input p-3 rounded-xl font-mono"
              value={newLoan.amount || ''}
              onChange={e => setNewLoan({...newLoan, amount: parseFloat(e.target.value)})}
            />
            <input 
              type="date" 
              className="glass-input p-3 rounded-xl"
              value={newLoan.date}
              onChange={e => setNewLoan({...newLoan, date: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="备注 (e.g. 微信转账)" 
              className="glass-input p-3 rounded-xl"
              value={newLoan.notes}
              onChange={e => setNewLoan({...newLoan, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddLoan} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700">确认添加</button>
            <button onClick={() => setIsAdding(false)} className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-50">取消</button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all mb-6 flex items-center justify-center gap-2"
        >
          <span>+</span> 登记一笔新借出
        </button>
      )}

      {/* List */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest sticky top-0">
            <tr>
              <th className="px-6 py-3 rounded-l-lg">借款人</th>
              <th className="px-6 py-3">借出日期</th>
              <th className="px-6 py-3 text-right">金额</th>
              <th className="px-6 py-3 text-center">状态</th>
              <th className="px-6 py-3">备注</th>
              <th className="px-6 py-3 text-center rounded-r-lg">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loans.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 italic">暂无借出记录</td>
              </tr>
            )}
            {loans.map(loan => (
              <tr key={loan.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700">{loan.borrower}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{loan.date}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-orange-600">¥{loan.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span 
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      loan.status === 'PAID' 
                      ? 'bg-slate-100 text-slate-400 border-slate-200' 
                      : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}
                  >
                    {loan.status === 'PAID' ? '已还清' : '未还'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[150px]">{loan.notes}</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(loan.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      loan.status === 'PAID' 
                      ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {loan.status === 'PAID' ? '标为未还' : '标为已还'}
                  </button>
                  <button 
                    onClick={() => handleDelete(loan.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
