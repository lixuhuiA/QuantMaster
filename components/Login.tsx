import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'ddz17259208++') {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 border border-slate-100">
             <span className="text-4xl font-bold text-blue-600">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">QuantMaster</h1>
          <p className="text-slate-500 mt-2 font-medium">个人资产量化管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-white shadow-soft p-10 rounded-3xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">访问密钥 (Access Key)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl px-5 py-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-lg`}
                placeholder="请输入密码..."
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-2 font-medium">密码错误，请重试。</p>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition-all transform hover:scale-[1.01] shadow-lg shadow-blue-600/20 text-sm tracking-wide"
            >
              解锁系统
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-8 font-mono">
            SECURED SYSTEM // UNAUTHORIZED ACCESS PROHIBITED
          </p>
        </form>
      </div>
    </div>
  );
};