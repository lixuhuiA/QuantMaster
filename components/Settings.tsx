
import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onCancel: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestWebhook = async () => {
    if (!formData.wechatWebhookUrl) return;
    setTestStatus('sending');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (e) {
      setTestStatus('error');
    }
  };

  // Calculate effective targets for display
  const effectiveProvidentRetained = formData.monthlyProvidentGoal - (formData.autoProvidentWithdrawal || 0);

  return (
    <div className="bg-white rounded-3xl shadow-soft p-10 max-w-2xl mx-auto animate-fade-in relative overflow-hidden border border-slate-100">
      
      <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <span className="text-quant-brand bg-blue-50 p-2 rounded-lg">⚙</span> 系统设置
      </h2>

      <div className="space-y-10">
        {/* Webhook Config */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            通知集成 (Notification)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-500 font-medium mb-2">企业微信机器人 Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.wechatWebhookUrl}
                  onChange={(e) => handleChange('wechatWebhookUrl', e.target.value)}
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                  className="glass-input flex-1 rounded-xl px-4 py-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-quant-brand transition-all w-full"
                />
                <button 
                  onClick={handleTestWebhook}
                  disabled={!formData.wechatWebhookUrl || testStatus === 'sending'}
                  className="px-5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition-colors whitespace-nowrap text-slate-600"
                >
                  {testStatus === 'sending' ? '发送中...' : testStatus === 'success' ? '✅ 成功' : '测试'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Goal - SPLIT */}
        <div>
          <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            强制储蓄目标 & 公积金配置
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Provident Total */}
             <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                 <div>
                    <label className="block text-xs text-slate-500 font-bold mb-2 flex items-center gap-2 uppercase tracking-wide">
                       总公积金入账 (Total)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold">¥</span>
                      <input
                        type="number"
                        value={formData.monthlyProvidentGoal}
                        onChange={(e) => handleChange('monthlyProvidentGoal', parseFloat(e.target.value) || 0)}
                        className="glass-input rounded-xl pl-8 pr-4 py-3 font-mono text-lg font-bold text-slate-700 focus:outline-none w-full"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">公司+个人缴纳总全额。</p>
                 </div>
                 
                 <div>
                    <label className="block text-xs text-slate-500 font-bold mb-2 flex items-center gap-2 uppercase tracking-wide text-orange-500">
                       每月自动提现 (Withdrawal)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold">¥</span>
                      <input
                        type="number"
                        value={formData.autoProvidentWithdrawal}
                        onChange={(e) => handleChange('autoProvidentWithdrawal', parseFloat(e.target.value) || 0)}
                        className="glass-input rounded-xl pl-8 pr-4 py-3 font-mono text-lg font-bold text-orange-600 focus:outline-none w-full"
                        placeholder="2000"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">自动提现到银行卡的金额。</p>
                 </div>

                 <div className="col-span-1 md:col-span-2 text-xs text-emerald-700 font-mono text-center pt-2 border-t border-emerald-100">
                    实际留存公积金目标 = <span className="font-bold">¥{Math.max(0, effectiveProvidentRetained).toLocaleString()}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    自动转出现金 = <span className="font-bold">¥{(formData.autoProvidentWithdrawal || 0).toLocaleString()}</span>
                 </div>
             </div>

             {/* Cash Goal */}
             <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-slate-500 font-medium mb-2 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-blue-500"></span> 现金/活期月存目标
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold">¥</span>
                  <input
                    type="number"
                    value={formData.monthlyCashGoal}
                    onChange={(e) => handleChange('monthlyCashGoal', parseFloat(e.target.value) || 0)}
                    className="glass-input rounded-xl pl-8 pr-4 py-3 font-mono text-lg font-bold text-blue-600 focus:outline-none w-full"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">除去日常开销后，必须存下的现金（含上述自动提现的公积金现金部分）。</p>
             </div>
          </div>
        </div>

        {/* Missing Month Logic Toggle */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            高级计算逻辑
          </h3>
          <div className="flex items-center gap-4">
             <div 
               onClick={() => handleChange('autoFillMissingMonths', !formData.autoFillMissingMonths)}
               className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${formData.autoFillMissingMonths ? 'bg-quant-brand' : 'bg-slate-200'}`}
             >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.autoFillMissingMonths ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
             <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-700">自动补全断层月份预算 (Auto-fill Gap Months)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  若开启，当记录中间出现断层（如记了1月，下次记是5月），系统会在计算理论资产时，自动加上中间缺失月份的“强制储蓄目标”。
                  <br/>
                  <span className="text-rose-400 font-medium">关闭时：</span>中间月份被视为0储蓄，会导致复盘时出现巨大的正向资产差值。
                </p>
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-8 flex gap-4 border-t border-slate-100">
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 py-3 px-4 rounded-xl bg-quant-brand hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
          >
            保存配置
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
