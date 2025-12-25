from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from database import init_db, get_db_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models (严格对应前端 types.ts) ---

class ExtraItem(BaseModel):
    id: str
    name: str
    value: float

class LiquidAssetItem(BaseModel):
    id: str
    name: str
    amount: float

class LoanRecord(BaseModel):
    id: str
    borrower: str
    date: str
    amount: float
    status: str
    repaidAmount: float
    notes: Optional[str] = ""

class MonthlyRecord(BaseModel):
    id: str
    month: str
    recordDate: str
    targetProvident: float
    targetCash: float
    incomeHand: float
    incomeSide: float
    incomeProvident: float
    expRent: float
    expCreditCard: float
    expBaiTiao: float
    expHuabei: float
    expDaily: float
    balanceProvident: float
    balanceInvestments: float
    balanceLiquid: float
    balanceLent: float
    note: Optional[str] = ""
    # 嵌套数组
    sideIncomeDetail: Optional[List[ExtraItem]] = []
    extraIncome: Optional[List[ExtraItem]] = []
    extraExpenses: Optional[List[ExtraItem]] = []
    liquidAssets: Optional[List[LiquidAssetItem]] = []
    lentItems: Optional[List[LoanRecord]] = [] # 历史快照

class AppSettings(BaseModel):
    wechatWebhookUrl: str
    monthlyProvidentGoal: float
    autoProvidentWithdrawal: float
    monthlyCashGoal: float
    autoFillMissingMonths: bool

# --- 初始化 ---
@app.on_event("startup")
def on_startup():
    init_db()

# --- Routes ---

@app.get("/api/settings")
def get_settings():
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    conn.close()
    return {
        "wechatWebhookUrl": row["wechat_webhook_url"] or "",
        "monthlyProvidentGoal": row["monthly_provident_goal"],
        "autoProvidentWithdrawal": row["auto_provident_withdrawal"],
        "monthlyCashGoal": row["monthly_cash_goal"],
        "autoFillMissingMonths": bool(row["auto_fill_missing_months"]),
    }

@app.put("/api/settings")
def update_settings(settings: AppSettings):
    conn = get_db_connection()
    conn.execute("""
        UPDATE settings SET 
        wechat_webhook_url = ?, 
        monthly_provident_goal = ?, 
        auto_provident_withdrawal = ?, 
        monthly_cash_goal = ?, 
        auto_fill_missing_months = ?
        WHERE id = 1
    """, (
        settings.wechatWebhookUrl,
        settings.monthlyProvidentGoal,
        settings.autoProvidentWithdrawal,
        settings.monthlyCashGoal,
        1 if settings.autoFillMissingMonths else 0
    ))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/api/loans")
def get_loans():
    # 获取全局借款台账 (LoanManager 使用)
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM loans").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "borrower": r["borrower"],
            "date": r["date"],
            "amount": r["amount"],
            "status": r["status"],
            "repaidAmount": r["repaid_amount"], # 注意数据库下划线转驼峰
            "notes": r["notes"]
        }
        for r in rows
    ]

@app.post("/api/loans")
def save_loans(loans: List[LoanRecord]):
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM loans")
        for l in loans:
            conn.execute("""
                INSERT INTO loans (id, borrower, date, amount, status, repaid_amount, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (l.id, l.borrower, l.date, l.amount, l.status, l.repaidAmount, l.notes))
        conn.commit()
    finally:
        conn.close()
    return {"status": "ok"}

@app.get("/api/records")
def get_records():
    conn = get_db_connection()
    records_rows = conn.execute("SELECT * FROM monthly_records ORDER BY month ASC").fetchall()
    
    results = []
    for r in records_rows:
        rid = r["id"]
        
        # 辅助函数：读取子表
        def get_extras(cat):
            rows = conn.execute("SELECT id, name, value FROM record_extra_items WHERE record_id = ? AND category = ?", (rid, cat)).fetchall()
            return [{"id": row["id"], "name": row["name"], "value": row["value"]} for row in rows]

        def get_liquids():
            rows = conn.execute("SELECT id, name, amount FROM liquid_asset_snapshots WHERE record_id = ?", (rid,)).fetchall()
            return [{"id": row["id"], "name": row["name"], "amount": row["amount"]} for row in rows]
        
        # 修正：读取历史借款快照
        def get_loan_snapshots():
            rows = conn.execute("SELECT * FROM monthly_loan_snapshots WHERE record_id = ?", (rid,)).fetchall()
            return [{
                "id": row["id"],
                "borrower": row["borrower"],
                "date": row["date"],
                "amount": row["amount"],
                "status": row["status"],
                "repaidAmount": row["repaid_amount"],
                "notes": row["notes"]
            } for row in rows]

        rec = {
            "id": r["id"],
            "month": r["month"],
            "recordDate": r["record_date"],
            "targetProvident": r["target_provident"],
            "targetCash": r["target_cash"],
            "incomeHand": r["income_hand"],
            "incomeSide": r["income_side"],
            "incomeProvident": r["income_provident"],
            "expRent": r["exp_rent"],
            "expCreditCard": r["exp_credit_card"],
            "expBaiTiao": r["exp_baitiao"],
            "expHuabei": r["exp_huabei"],
            "expDaily": r["exp_daily"],
            "balanceProvident": r["balance_provident"],
            "balanceInvestments": r["balance_investments"],
            "balanceLiquid": r["balance_liquid"],
            "balanceLent": r["balance_lent"],
            "note": r["note"],
            "sideIncomeDetail": get_extras("SIDE_INCOME"),
            "extraIncome": get_extras("EXTRA_INCOME"),
            "extraExpenses": get_extras("EXTRA_EXPENSE"),
            "liquidAssets": get_liquids(),
            "lentItems": get_loan_snapshots() # 这里现在返回真实数据了
        }
        results.append(rec)
    
    conn.close()
    return results

@app.post("/api/records")
def save_record(record: MonthlyRecord):
    conn = get_db_connection()
    try:
        # 1. 插入/更新主记录
        conn.execute("""
            INSERT INTO monthly_records (
                id, month, record_date, target_provident, target_cash,
                income_hand, income_side, income_provident,
                exp_rent, exp_credit_card, exp_baitiao, exp_huabei, exp_daily,
                balance_provident, balance_investments, balance_liquid, balance_lent, note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                month=excluded.month,
                record_date=excluded.record_date,
                target_provident=excluded.target_provident,
                target_cash=excluded.target_cash,
                income_hand=excluded.income_hand,
                income_side=excluded.income_side,
                income_provident=excluded.income_provident,
                exp_rent=excluded.exp_rent,
                exp_credit_card=excluded.exp_credit_card,
                exp_baitiao=excluded.exp_baitiao,
                exp_huabei=excluded.exp_huabei,
                exp_daily=excluded.exp_daily,
                balance_provident=excluded.balance_provident,
                balance_investments=excluded.balance_investments,
                balance_liquid=excluded.balance_liquid,
                balance_lent=excluded.balance_lent,
                note=excluded.note
        """, (
            record.id, record.month, record.recordDate, record.targetProvident, record.targetCash,
            record.incomeHand, record.incomeSide, record.incomeProvident,
            record.expRent, record.expCreditCard, record.expBaiTiao, record.expHuabei, record.expDaily,
            record.balanceProvident, record.balanceInvestments, record.balanceLiquid, record.balanceLent, record.note
        ))

        # 2. 更新子表 (采用先删后插策略，简单稳妥)
        
        # Liquid Assets
        conn.execute("DELETE FROM liquid_asset_snapshots WHERE record_id = ?", (record.id,))
        if record.liquidAssets:
            for l in record.liquidAssets:
                conn.execute("INSERT INTO liquid_asset_snapshots (id, record_id, name, amount) VALUES (?, ?, ?, ?)",
                             (l.id, record.id, l.name, l.amount))

        # 修正：处理 Loan Snapshots
        conn.execute("DELETE FROM monthly_loan_snapshots WHERE record_id = ?", (record.id,))
        if record.lentItems:
            for l in record.lentItems:
                conn.execute("""
                    INSERT INTO monthly_loan_snapshots 
                    (id, record_id, borrower, date, amount, status, repaid_amount, notes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (l.id, record.id, l.borrower, l.date, l.amount, l.status, l.repaidAmount, l.notes))

        # Extra Items
        conn.execute("DELETE FROM record_extra_items WHERE record_id = ?", (record.id,))
        def insert_extras(items, cat):
            if items:
                for i in items:
                    conn.execute("INSERT INTO record_extra_items (id, record_id, category, name, value) VALUES (?, ?, ?, ?, ?)",
                                 (i.id, record.id, cat, i.name, i.value))

        insert_extras(record.sideIncomeDetail, "SIDE_INCOME")
        insert_extras(record.extraIncome, "EXTRA_INCOME")
        insert_extras(record.extraExpenses, "EXTRA_EXPENSE")

        conn.commit()
    except Exception as e:
        conn.rollback()
        # 打印错误方便 Docker logs 调试
        print(f"Error saving record: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    
    return {"status": "saved", "id": record.id}

@app.delete("/api/records/{record_id}")
def delete_record(record_id: str):
    conn = get_db_connection()
    # 因为设置了 ON DELETE CASCADE，删除主记录会自动删除所有子表关联数据
    conn.execute("DELETE FROM monthly_records WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}