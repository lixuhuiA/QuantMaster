
import { MonthlyRecord, AppSettings, LoanRecord } from './types';

export const APP_NAME = "QuantMaster";
export const APP_VERSION = "v3.4.0-Pro";

export const DEFAULT_SETTINGS: AppSettings = {
  wechatWebhookUrl: '',
  monthlyProvidentGoal: 5000,
  autoProvidentWithdrawal: 2000, // Default 2000 withdrawal
  monthlyCashGoal: 10000,
  autoFillMissingMonths: false, // Default off as requested
};

// Default accounts the user requested
export const DEFAULT_LIQUID_ACCOUNTS = [
  "江苏银行",
  "招商银行",
  "农业银行",
  "支付宝 (余额宝)",
  "微信 (零钱通)",
  "股票账户"
];

// Mock Global Loans
export const MOCK_LOANS: LoanRecord[] = [
  { id: 'loan_1', borrower: '老王', date: '2023-11-15', amount: 20000, status: 'UNPAID', repaidAmount: 0, notes: '装修借款' },
  { id: 'loan_2', borrower: '表弟', date: '2023-12-01', amount: 5000, status: 'PAID', repaidAmount: 5000, notes: '临时周转' }
];

// Mock Data
export const MOCK_HISTORY: MonthlyRecord[] = [
  {
    id: 'rec_001',
    month: '2023-12',
    recordDate: '2023-12-24T12:18:39',
    targetProvident: 5000,
    targetCash: 10000,
    incomeHand: 16952,
    incomeSide: 2000,
    incomeProvident: 3938, // Adjusted example
    extraIncome: [],
    expRent: 2565,
    expCreditCard: 3088,
    expBaiTiao: 447,
    expHuabei: 200, 
    expDaily: 1010, // Pocket Money
    extraExpenses: [],
    balanceProvident: 83100,
    balanceInvestments: 50000,
    balanceLiquid: 546483, 
    liquidAssets: [
      { id: 'l1', name: '招商银行', amount: 418000 },
      { id: 'l2', name: '支付宝', amount: 28483 },
      { id: 'l3', name: '股票账户', amount: 100000 }
    ],
    balanceLent: 20000, 
    lentItems: [
      { id: 'loan_1', borrower: '老王', date: '2023-11-15', amount: 20000, status: 'UNPAID', repaidAmount: 0 }
    ],
    note: "年底薪资正常，股票账户收益不错"
  },
  {
    id: 'rec_002',
    month: '2024-01',
    recordDate: '2024-03-17T22:30:33',
    targetProvident: 5000,
    targetCash: 10000,
    incomeHand: 16966,
    incomeSide: 0,
    incomeProvident: 3938,
    extraIncome: [],
    expRent: 1750,
    expCreditCard: 3093,
    expBaiTiao: 753,
    expHuabei: 0,
    expDaily: 4038, // High Pocket Money
    extraExpenses: [],
    balanceProvident: 89038,
    balanceInvestments: 50000,
    balanceLiquid: 558000,
    liquidAssets: [
      { id: 'l1', name: '招商银行', amount: 428000 },
      { id: 'l2', name: '支付宝', amount: 30000 },
      { id: 'l3', name: '股票账户', amount: 100000 }
    ],
    balanceLent: 20000,
    lentItems: [
        { id: 'loan_1', borrower: '老王', date: '2023-11-15', amount: 20000, status: 'UNPAID', repaidAmount: 0 }
    ],
    note: "过年发红包，零花钱预算超支"
  },
  {
    id: 'rec_003',
    month: '2024-02',
    recordDate: '2024-03-17T22:30:34',
    targetProvident: 5938,
    targetCash: 12000,
    incomeHand: 17507,
    incomeSide: 0,
    incomeProvident: 3938,
    extraIncome: [],
    expRent: 1750,
    expCreditCard: 3595,
    expBaiTiao: 829,
    expHuabei: 0,
    expDaily: 800,
    extraExpenses: [],
    balanceProvident: 94976,
    balanceInvestments: 50000,
    balanceLiquid: 574000,
    liquidAssets: [
      { id: 'l1', name: '招商银行', amount: 439000 },
      { id: 'l2', name: '支付宝', amount: 35000 },
      { id: 'l3', name: '股票账户', amount: 100000 }
    ],
    balanceLent: 20000,
    lentItems: [
        { id: 'loan_1', borrower: '老王', date: '2023-11-15', amount: 20000, status: 'UNPAID', repaidAmount: 0 }
    ],
    note: "工资涨幅2K生效，提高现金存钱目标"
  },
];
