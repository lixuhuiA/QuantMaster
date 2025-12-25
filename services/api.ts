import { MonthlyRecord, LoanRecord, AppSettings } from '../types';

// 自动判断 API 地址：
// 1. 开发环境 (npm run dev): 会走 vite.config.ts 配置的代理
// 2. 生产环境 (Docker): 会走 Nginx 的 /api 转发
const API_BASE = '/api';

export const QuantApi = {
  // --- 月度记录 (Records) ---
  // 获取所有历史月份的记录（包含明细、借款快照、理财收益等）
  async fetchRecords(): Promise<MonthlyRecord[]> {
    const res = await fetch(`${API_BASE}/records`);
    if (!res.ok) throw new Error('Failed to fetch records');
    return res.json();
  },

  // 保存单月记录（包含该月所有的固定收支、流动资金详情、副业明细、借款快照）
  async saveRecord(record: MonthlyRecord): Promise<void> {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to save record');
  },

  // 删除某月记录
  async deleteRecord(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete record');
  },

  // --- 全局借款台账 (Loans) ---
  // 获取“借款管理”页面需要的全局借条
  async fetchLoans(): Promise<LoanRecord[]> {
    const res = await fetch(`${API_BASE}/loans`);
    if (!res.ok) throw new Error('Failed to fetch loans');
    return res.json();
  },

  // 保存全局借条状态更新
  async saveLoans(loans: LoanRecord[]): Promise<void> {
    const res = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loans),
    });
    if (!res.ok) throw new Error('Failed to save loans');
  },

  // --- 系统设置 (Settings) ---
  async fetchSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
  }
};