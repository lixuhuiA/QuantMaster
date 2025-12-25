

export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY'
}

export interface ExtraItem {
  id: string;
  name: string;
  value: number;
}

// Global Loan Tracking (The "Ledger" separate from monthly snapshots)
export interface LoanRecord {
  id: string;
  borrower: string; // 借款人 (谁借了我的钱)
  date: string;     // 借出日期
  amount: number;   // 金额
  status: 'UNPAID' | 'PARTIAL' | 'PAID'; // 状态
  repaidAmount: number; // 已还金额
  notes?: string;
}

// Detailed Liquid Asset Tracking
export interface LiquidAssetItem {
  id: string;
  name: string; // 账户名称 (e.g., 招商银行)
  amount: number; // 余额
}

export interface AppSettings {
  wechatWebhookUrl: string;
  monthlyProvidentGoal: number; // The FULL Provident Income (Company + Personal)
  autoProvidentWithdrawal: number; // Amount automatically withdrawn to cash (e.g., 2000)
  monthlyCashGoal: number;      // Specific Goal for Cash Savings
  autoFillMissingMonths: boolean; // New: Logic to auto-add goals for missing gap months
}

// The snapshot of a specific month
export interface MonthlyRecord {
  id: string;
  month: string; // YYYY-MM
  recordDate: string; // ISO String
  
  // Snapshotted Goals (To track history accuracy)
  targetProvident: number;
  targetCash: number;

  // Income Flows
  incomeHand: number; // 到手工资
  incomeSide: number; // 副业/奖金 (Total calculated from details or manual input)
  sideIncomeDetail?: ExtraItem[]; // New: Detailed list for side income (Stocks, Funds, etc.)
  incomeProvident: number; // 公积金收入 (Net remaining in account)
  extraIncome?: ExtraItem[]; // Custom income items

  // Expense Flows (Cash Out)
  expRent: number; // 房租
  expCreditCard: number; // 信用卡还款
  expBaiTiao: number; // 白条 (JD)
  expHuabei: number; // 花呗 (Alipay)
  expDaily: number; // Pocket Money Budget (零花钱)
  extraExpenses?: ExtraItem[]; // Custom expense items

  // Asset Snapshots
  balanceProvident: number; // 公积金余额
  balanceInvestments: number; // 基金/理财
  
  // Detailed Liquid Assets (Cash in accounts)
  liquidAssets?: LiquidAssetItem[]; 
  balanceLiquid: number; 

  // Money Lent Out (Asset)
  balanceLent: number; 
  lentItems?: LoanRecord[]; 

  note: string;
}

export interface ComputedMetrics {
  totalAssets: number;
  netWorth: number;
  theoreticalAssets: number; 
  actualAssets: number;
  discrepancy: number;
}