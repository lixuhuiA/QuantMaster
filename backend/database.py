import sqlite3
from pathlib import Path

# 数据卷挂载路径，确保 Docker 部署时数据不丢失
DB_FILE = Path("/data/quantmaster.db")

DDL_SCRIPT = """
-- 1. 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    wechat_webhook_url TEXT,
    monthly_provident_goal REAL DEFAULT 5000,
    auto_provident_withdrawal REAL DEFAULT 2000,
    monthly_cash_goal REAL DEFAULT 10000,
    auto_fill_missing_months BOOLEAN DEFAULT 0
);

-- 2. 月度快照主表
CREATE TABLE IF NOT EXISTS monthly_records (
    id TEXT PRIMARY KEY,
    month TEXT NOT NULL,
    record_date DATETIME NOT NULL,
    target_provident REAL,
    target_cash REAL,
    income_hand REAL DEFAULT 0,
    income_side REAL DEFAULT 0,
    income_provident REAL DEFAULT 0,
    exp_rent REAL DEFAULT 0,
    exp_credit_card REAL DEFAULT 0,
    exp_baitiao REAL DEFAULT 0,
    exp_huabei REAL DEFAULT 0,
    exp_daily REAL DEFAULT 0,
    balance_provident REAL DEFAULT 0,
    balance_investments REAL DEFAULT 0,
    balance_liquid REAL DEFAULT 0,
    balance_lent REAL DEFAULT 0,
    note TEXT
);

-- 3. 额外项目明细表 (用于存储 extraIncome, extraExpenses, sideIncomeDetail)
CREATE TABLE IF NOT EXISTS record_extra_items (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL,
    category TEXT NOT NULL, -- 枚举值: 'SIDE_INCOME', 'EXTRA_INCOME', 'EXTRA_EXPENSE'
    name TEXT NOT NULL,
    value REAL DEFAULT 0,
    FOREIGN KEY (record_id) REFERENCES monthly_records(id) ON DELETE CASCADE
);

-- 4. 流动资金账户明细表 (用于存储 liquidAssets)
CREATE TABLE IF NOT EXISTS liquid_asset_snapshots (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL DEFAULT 0,
    FOREIGN KEY (record_id) REFERENCES monthly_records(id) ON DELETE CASCADE
);

-- 5. 月度借款快照表 (新增！用于存储 monthlyRecord.lentItems)
-- 这确保了历史记录里的借款状态是当时的状态，而不是现在的状态
CREATE TABLE IF NOT EXISTS monthly_loan_snapshots (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL,
    borrower TEXT NOT NULL,
    date TEXT,
    amount REAL DEFAULT 0,
    status TEXT,
    repaid_amount REAL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (record_id) REFERENCES monthly_records(id) ON DELETE CASCADE
);

-- 6. 全局借款管理台账 (用于 LoanManager 组件)
CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    borrower TEXT NOT NULL,
    date TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'UNPAID',
    repaid_amount REAL DEFAULT 0,
    notes TEXT
);

-- 初始化默认设置
INSERT OR IGNORE INTO settings (id, wechat_webhook_url, monthly_provident_goal, auto_provident_withdrawal, monthly_cash_goal, auto_fill_missing_months)
VALUES (1, '', 5000, 2000, 10000, 0);
"""

def get_db_connection():
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executescript(DDL_SCRIPT)
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_FILE}")