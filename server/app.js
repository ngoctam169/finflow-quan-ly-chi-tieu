import express from 'express';
import cors from 'cors';
import {
  getDbStatus,
  getFullState,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  upsertWallet,
  deleteWallet,
  transferBetweenWallets,
  upsertCategory,
  upsertBudget,
  upsertBulkBudgets,
  upsertGoal,
  deleteGoal,
  contributeToGoal,
  upsertRecurringBill,
  deleteRecurringBill,
  payRecurringBill,
  resetToDemoData
} from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health & Cloud DB Status
app.get('/api/health', async (_req, res) => {
  try {
    const db = await getDbStatus();
    res.json({
      ok: true,
      service: 'FinFlow VN Personal Finance API',
      runtime: 'Node.js + Express 5',
      database: db,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. Full Application State (Wallets, Categories, Budgets, Goals, Recurring, Transactions)
app.get('/api/state', async (_req, res) => {
  try {
    const state = await getFullState();
    res.json({ ok: true, ...state });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. Create Transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const tx = await createTransaction(req.body || {});
    const state = await getFullState();
    res.status(201).json({ ok: true, transaction: tx, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 4. Update Transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const tx = await updateTransaction(req.params.id, req.body || {});
    const state = await getFullState();
    res.json({ ok: true, transaction: tx, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 5. Delete Transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await deleteTransaction(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6. Upsert Wallet
app.post('/api/wallets', async (req, res) => {
  try {
    const wallet = await upsertWallet(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, wallet, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6b. Delete Wallet
app.delete('/api/wallets/:id', async (req, res) => {
  try {
    await deleteWallet(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6c. Upsert Custom Category
app.post('/api/categories', async (req, res) => {
  try {
    const category = await upsertCategory(req.body || {});
    const state = await getFullState();
    res.status(201).json({ ok: true, category, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 7. Transfer Between Wallets
app.post('/api/wallets/transfer', async (req, res) => {
  try {
    const transfer = await transferBetweenWallets(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, transfer, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 8. Update Category Budget
app.post('/api/budgets', async (req, res) => {
  try {
    const budget = await upsertBudget(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, budget, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 8b. Bulk Apply Smart Allocated Budgets
app.post('/api/budgets/bulk', async (req, res) => {
  try {
    const budgets = await upsertBulkBudgets(req.body?.budgets || []);
    const state = await getFullState();
    res.json({ ok: true, budgets, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 9. Upsert Savings Goal
app.post('/api/goals', async (req, res) => {
  try {
    const goal = await upsertGoal(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, goal, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 9b. Delete Savings Goal
app.delete('/api/goals/:id', async (req, res) => {
  try {
    await deleteGoal(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 10. Contribute to Savings Goal
app.post('/api/goals/:id/contribute', async (req, res) => {
  try {
    const goal = await contributeToGoal(req.params.id, req.body || {});
    const state = await getFullState();
    res.json({ ok: true, goal, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 11. Upsert Recurring Bill
app.post('/api/recurring', async (req, res) => {
  try {
    const bill = await upsertRecurringBill(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, bill, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 11b. Delete Recurring Bill
app.delete('/api/recurring/:id', async (req, res) => {
  try {
    await deleteRecurringBill(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 12. Pay Recurring Bill
app.post('/api/recurring/:id/pay', async (req, res) => {
  try {
    const result = await payRecurringBill(req.params.id, req.body || {});
    const state = await getFullState();
    res.json({ ok: true, ...result, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 13. Reset Demo Data
app.post('/api/reset-demo', async (_req, res) => {
  try {
    const state = await resetToDemoData();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default app;
