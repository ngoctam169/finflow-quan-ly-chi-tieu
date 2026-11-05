import pg from 'pg';
import dotenv from 'dotenv';
import {
  INITIAL_WALLETS,
  INITIAL_CATEGORIES,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_RECURRING,
  INITIAL_TRANSACTIONS,
  QUICK_TEMPLATES
} from './seedData.js';

dotenv.config();

const { Pool } = pg;

// Provisioned Cloud PostgreSQL (Prisma Postgres / Neon Serverless - ap-southeast-1 Singapore)
const DEFAULT_POSTGRES_URL =
  'postgres://2e8dc4ce0f3332db4d1ead7bd23909f4187f0345fabed0f3106ea96cabc3b1f6:sk_fyM_5jZeJ6299mfLvAk4P@db.prisma.io:5432/postgres?sslmode=require';

const connectionString = process.env.DATABASE_URL || DEFAULT_POSTGRES_URL;

let pool = null;
let dbMode = 'initializing';
let initialized = false;

// Safe in-memory fallback store
const memoryStore = {
  wallets: structuredClone(INITIAL_WALLETS),
  categories: structuredClone(INITIAL_CATEGORIES),
  budgets: structuredClone(INITIAL_BUDGETS),
  goals: structuredClone(INITIAL_GOALS),
  recurring: structuredClone(INITIAL_RECURRING),
  transactions: structuredClone(INITIAL_TRANSACTIONS)
};

export async function initDb() {
  if (initialized && dbMode === 'postgresql') return dbMode;

  try {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 8000
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ff_wallets (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        type VARCHAR(40) NOT NULL DEFAULT 'bank',
        balance BIGINT NOT NULL DEFAULT 0,
        color VARCHAR(32) NOT NULL DEFAULT '#059669',
        icon VARCHAR(40) NOT NULL DEFAULT 'Wallet',
        account_number VARCHAR(64) DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS ff_categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        type VARCHAR(24) NOT NULL DEFAULT 'expense',
        icon VARCHAR(40) NOT NULL DEFAULT 'Tag',
        color VARCHAR(32) NOT NULL DEFAULT '#10b981',
        group_rule VARCHAR(32) NOT NULL DEFAULT 'needs',
        keywords JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS ff_budgets (
        category_id VARCHAR(64) PRIMARY KEY,
        monthly_limit BIGINT NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS ff_goals (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        target_amount BIGINT NOT NULL DEFAULT 0,
        current_amount BIGINT NOT NULL DEFAULT 0,
        deadline VARCHAR(32) NOT NULL,
        icon VARCHAR(40) NOT NULL DEFAULT 'Target',
        color VARCHAR(32) NOT NULL DEFAULT '#10b981',
        note TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS ff_recurring (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(160) NOT NULL,
        amount BIGINT NOT NULL DEFAULT 0,
        category_id VARCHAR(64) NOT NULL,
        wallet_id VARCHAR(64) NOT NULL,
        due_day INTEGER NOT NULL DEFAULT 1,
        last_paid_month VARCHAR(16) DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS ff_transactions (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        amount BIGINT NOT NULL,
        type VARCHAR(24) NOT NULL DEFAULT 'expense',
        category_id VARCHAR(64) NOT NULL,
        wallet_id VARCHAR(64) NOT NULL,
        tx_date VARCHAR(20) NOT NULL,
        note TEXT DEFAULT '',
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM ff_wallets');
    if (rows[0].cnt === 0) {
      await seedPostgresData();
    }

    dbMode = 'postgresql';
    initialized = true;
    return dbMode;
  } catch (err) {
    console.warn('⚠️ Cloud PostgreSQL fallback to memory store:', err.message);
    dbMode = 'memory-fallback';
    initialized = true;
    return dbMode;
  }
}

export async function seedPostgresData() {
  for (const w of INITIAL_WALLETS) {
    await pool.query(
      `INSERT INTO ff_wallets (id, name, type, balance, color, icon, account_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         balance = EXCLUDED.balance,
         color = EXCLUDED.color,
         icon = EXCLUDED.icon,
         account_number = EXCLUDED.account_number`,
      [w.id, w.name, w.type, w.balance, w.color, w.icon, w.account_number]
    );
  }

  for (const c of INITIAL_CATEGORIES) {
    await pool.query(
      `INSERT INTO ff_categories (id, name, type, icon, color, group_rule, keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         icon = EXCLUDED.icon,
         color = EXCLUDED.color,
         group_rule = EXCLUDED.group_rule,
         keywords = EXCLUDED.keywords`,
      [c.id, c.name, c.type, c.icon, c.color, c.group_rule, JSON.stringify(c.keywords || [])]
    );
  }

  for (const b of INITIAL_BUDGETS) {
    await pool.query(
      `INSERT INTO ff_budgets (category_id, monthly_limit)
       VALUES ($1, $2)
       ON CONFLICT (category_id) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit`,
      [b.category_id, b.monthly_limit]
    );
  }

  for (const g of INITIAL_GOALS) {
    await pool.query(
      `INSERT INTO ff_goals (id, name, target_amount, current_amount, deadline, icon, color, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         target_amount = EXCLUDED.target_amount,
         current_amount = EXCLUDED.current_amount,
         deadline = EXCLUDED.deadline,
         icon = EXCLUDED.icon,
         color = EXCLUDED.color,
         note = EXCLUDED.note`,
      [g.id, g.name, g.target_amount, g.current_amount, g.deadline, g.icon, g.color, g.note]
    );
  }

  for (const r of INITIAL_RECURRING) {
    await pool.query(
      `INSERT INTO ff_recurring (id, title, amount, category_id, wallet_id, due_day, last_paid_month, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         amount = EXCLUDED.amount,
         category_id = EXCLUDED.category_id,
         wallet_id = EXCLUDED.wallet_id,
         due_day = EXCLUDED.due_day,
         last_paid_month = EXCLUDED.last_paid_month,
         active = EXCLUDED.active`,
      [r.id, r.title, r.amount, r.category_id, r.wallet_id, r.due_day, r.last_paid_month, r.active]
    );
  }

  for (const tx of INITIAL_TRANSACTIONS) {
    await pool.query(
      `INSERT INTO ff_transactions (id, title, amount, type, category_id, wallet_id, tx_date, note, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [
        tx.id,
        tx.title,
        tx.amount,
        tx.type,
        tx.category_id,
        tx.wallet_id,
        tx.tx_date,
        tx.note || '',
        JSON.stringify(tx.tags || [])
      ]
    );
  }
}

export async function getDbStatus() {
  await initDb();
  if (dbMode === 'postgresql' && pool) {
    try {
      const res = await pool.query('SELECT COUNT(*)::int AS tx_count FROM ff_transactions');
      return {
        connected: true,
        mode: 'postgresql',
        provider: 'Prisma Postgres Cloud (Neon Serverless ap-southeast-1)',
        region: 'Singapore (ap-southeast-1)',
        transactionsCount: res.rows[0].tx_count
      };
    } catch (err) {
      return {
        connected: false,
        mode: 'memory-fallback',
        provider: 'In-Memory Store',
        error: err.message
      };
    }
  }
  return {
    connected: false,
    mode: dbMode,
    provider: 'In-Memory Store',
    transactionsCount: memoryStore.transactions.length
  };
}

const normalizeNumberFields = (row, fields) => {
  const copy = { ...row };
  for (const f of fields) {
    if (copy[f] !== undefined && copy[f] !== null) {
      copy[f] = Number(copy[f]);
    }
  }
  return copy;
};

export async function getFullState() {
  await initDb();

  if (dbMode === 'postgresql' && pool) {
    const [walletsRes, catsRes, budgetsRes, goalsRes, recRes, txRes] = await Promise.all([
      pool.query('SELECT * FROM ff_wallets ORDER BY id ASC'),
      pool.query('SELECT * FROM ff_categories ORDER BY id ASC'),
      pool.query('SELECT * FROM ff_budgets'),
      pool.query('SELECT * FROM ff_goals ORDER BY deadline ASC'),
      pool.query('SELECT * FROM ff_recurring ORDER BY due_day ASC'),
      pool.query('SELECT * FROM ff_transactions ORDER BY tx_date DESC, created_at DESC')
    ]);

    return {
      dbMode: 'postgresql',
      provider: 'Cloud PostgreSQL (ap-southeast-1)',
      wallets: walletsRes.rows.map((r) => normalizeNumberFields(r, ['balance'])),
      categories: catsRes.rows,
      budgets: budgetsRes.rows.map((r) => normalizeNumberFields(r, ['monthly_limit'])),
      goals: goalsRes.rows.map((r) => normalizeNumberFields(r, ['target_amount', 'current_amount'])),
      recurring: recRes.rows.map((r) => normalizeNumberFields(r, ['amount', 'due_day'])),
      transactions: txRes.rows.map((r) => normalizeNumberFields(r, ['amount'])),
      quickTemplates: QUICK_TEMPLATES
    };
  }

  return {
    dbMode: 'memory-fallback',
    provider: 'Local Memory Fallback',
    wallets: memoryStore.wallets,
    categories: memoryStore.categories,
    budgets: memoryStore.budgets,
    goals: memoryStore.goals,
    recurring: memoryStore.recurring,
    transactions: memoryStore.transactions,
    quickTemplates: QUICK_TEMPLATES
  };
}

export async function createTransaction(payload) {
  await initDb();
  const tx = {
    id: payload.id || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: String(payload.title || 'Giao dịch mới').trim(),
    amount: Math.max(0, Math.round(Number(payload.amount) || 0)),
    type: payload.type === 'income' ? 'income' : 'expense',
    category_id: payload.category_id || (payload.type === 'income' ? 'cat_salary' : 'cat_food'),
    wallet_id: payload.wallet_id || 'w_cash',
    tx_date: payload.tx_date || '2026-11-05',
    note: String(payload.note || '').trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : []
  };

  const delta = tx.type === 'income' ? tx.amount : -tx.amount;

  if (dbMode === 'postgresql' && pool) {
    await pool.query(
      `INSERT INTO ff_transactions (id, title, amount, type, category_id, wallet_id, tx_date, note, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [tx.id, tx.title, tx.amount, tx.type, tx.category_id, tx.wallet_id, tx.tx_date, tx.note, JSON.stringify(tx.tags)]
    );
    await pool.query(
      `UPDATE ff_wallets SET balance = balance + $1 WHERE id = $2`,
      [delta, tx.wallet_id]
    );
    return tx;
  }

  memoryStore.transactions.unshift(tx);
  const w = memoryStore.wallets.find((item) => item.id === tx.wallet_id);
  if (w) w.balance += delta;
  return tx;
}

export async function updateTransaction(id, payload) {
  await initDb();

  if (dbMode === 'postgresql' && pool) {
    const existingRes = await pool.query('SELECT * FROM ff_transactions WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) throw new Error('Không tìm thấy giao dịch');
    const oldTx = normalizeNumberFields(existingRes.rows[0], ['amount']);

    // Revert old wallet impact
    const oldDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
    await pool.query('UPDATE ff_wallets SET balance = balance + $1 WHERE id = $2', [oldDelta, oldTx.wallet_id]);

    const updated = {
      id,
      title: String(payload.title ?? oldTx.title).trim(),
      amount: Math.max(0, Math.round(Number(payload.amount ?? oldTx.amount))),
      type: (payload.type ?? oldTx.type) === 'income' ? 'income' : 'expense',
      category_id: payload.category_id ?? oldTx.category_id,
      wallet_id: payload.wallet_id ?? oldTx.wallet_id,
      tx_date: payload.tx_date ?? oldTx.tx_date,
      note: String(payload.note ?? oldTx.note ?? '').trim(),
      tags: Array.isArray(payload.tags) ? payload.tags : oldTx.tags || []
    };

    await pool.query(
      `UPDATE ff_transactions
       SET title = $1, amount = $2, type = $3, category_id = $4, wallet_id = $5, tx_date = $6, note = $7, tags = $8::jsonb
       WHERE id = $9`,
      [
        updated.title,
        updated.amount,
        updated.type,
        updated.category_id,
        updated.wallet_id,
        updated.tx_date,
        updated.note,
        JSON.stringify(updated.tags),
        id
      ]
    );

    const newDelta = updated.type === 'income' ? updated.amount : -updated.amount;
    await pool.query('UPDATE ff_wallets SET balance = balance + $1 WHERE id = $2', [newDelta, updated.wallet_id]);

    return updated;
  }

  const idx = memoryStore.transactions.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Không tìm thấy giao dịch');
  const oldTx = memoryStore.transactions[idx];
  const oldWallet = memoryStore.wallets.find((w) => w.id === oldTx.wallet_id);
  if (oldWallet) {
    oldWallet.balance += oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
  }

  const updated = {
    ...oldTx,
    title: String(payload.title ?? oldTx.title).trim(),
    amount: Math.max(0, Math.round(Number(payload.amount ?? oldTx.amount))),
    type: (payload.type ?? oldTx.type) === 'income' ? 'income' : 'expense',
    category_id: payload.category_id ?? oldTx.category_id,
    wallet_id: payload.wallet_id ?? oldTx.wallet_id,
    tx_date: payload.tx_date ?? oldTx.tx_date,
    note: String(payload.note ?? oldTx.note ?? '').trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : oldTx.tags || []
  };
  memoryStore.transactions[idx] = updated;
  const newWallet = memoryStore.wallets.find((w) => w.id === updated.wallet_id);
  if (newWallet) {
    newWallet.balance += updated.type === 'income' ? updated.amount : -updated.amount;
  }
  return updated;
}

export async function deleteTransaction(id) {
  await initDb();
  if (dbMode === 'postgresql' && pool) {
    const existingRes = await pool.query('SELECT * FROM ff_transactions WHERE id = $1', [id]);
    if (existingRes.rows.length > 0) {
      const oldTx = normalizeNumberFields(existingRes.rows[0], ['amount']);
      const revertDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      await pool.query('UPDATE ff_wallets SET balance = balance + $1 WHERE id = $2', [revertDelta, oldTx.wallet_id]);
      await pool.query('DELETE FROM ff_transactions WHERE id = $1', [id]);
    }
    return { deleted: true, id };
  }

  const idx = memoryStore.transactions.findIndex((t) => t.id === id);
  if (idx !== -1) {
    const oldTx = memoryStore.transactions[idx];
    const wallet = memoryStore.wallets.find((w) => w.id === oldTx.wallet_id);
    if (wallet) {
      wallet.balance += oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
    }
    memoryStore.transactions.splice(idx, 1);
  }
  return { deleted: true, id };
}

export async function upsertWallet(payload) {
  await initDb();
  const wallet = {
    id: payload.id || `w_${Date.now()}`,
    name: String(payload.name || 'Ví mới').trim(),
    type: payload.type || 'bank',
    balance: Math.round(Number(payload.balance) || 0),
    color: payload.color || '#059669',
    icon: payload.icon || 'Wallet',
    account_number: String(payload.account_number || '').trim()
  };

  if (dbMode === 'postgresql' && pool) {
    await pool.query(
      `INSERT INTO ff_wallets (id, name, type, balance, color, icon, account_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         balance = EXCLUDED.balance,
         color = EXCLUDED.color,
         icon = EXCLUDED.icon,
         account_number = EXCLUDED.account_number`,
      [wallet.id, wallet.name, wallet.type, wallet.balance, wallet.color, wallet.icon, wallet.account_number]
    );
    return wallet;
  }

  const idx = memoryStore.wallets.findIndex((w) => w.id === wallet.id);
  if (idx !== -1) memoryStore.wallets[idx] = wallet;
  else memoryStore.wallets.push(wallet);
  return wallet;
}

export async function transferBetweenWallets({ from_wallet_id, to_wallet_id, amount, note }) {
  await initDb();
  const value = Math.max(0, Math.round(Number(amount) || 0));
  if (!from_wallet_id || !to_wallet_id || from_wallet_id === to_wallet_id || value <= 0) {
    throw new Error('Thông tin chuyển tiền giữa các ví không hợp lệ');
  }

  if (dbMode === 'postgresql' && pool) {
    await pool.query('UPDATE ff_wallets SET balance = balance - $1 WHERE id = $2', [value, from_wallet_id]);
    await pool.query('UPDATE ff_wallets SET balance = balance + $1 WHERE id = $2', [value, to_wallet_id]);
    return { ok: true, from_wallet_id, to_wallet_id, amount: value, note };
  }

  const fromW = memoryStore.wallets.find((w) => w.id === from_wallet_id);
  const toW = memoryStore.wallets.find((w) => w.id === to_wallet_id);
  if (fromW) fromW.balance -= value;
  if (toW) toW.balance += value;
  return { ok: true, from_wallet_id, to_wallet_id, amount: value, note };
}

export async function upsertBudget({ category_id, monthly_limit }) {
  await initDb();
  const limit = Math.max(0, Math.round(Number(monthly_limit) || 0));

  if (dbMode === 'postgresql' && pool) {
    await pool.query(
      `INSERT INTO ff_budgets (category_id, monthly_limit)
       VALUES ($1, $2)
       ON CONFLICT (category_id) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit`,
      [category_id, limit]
    );
    return { category_id, monthly_limit: limit };
  }

  const existing = memoryStore.budgets.find((b) => b.category_id === category_id);
  if (existing) existing.monthly_limit = limit;
  else memoryStore.budgets.push({ category_id, monthly_limit: limit });
  return { category_id, monthly_limit: limit };
}

export async function upsertGoal(payload) {
  await initDb();
  const goal = {
    id: payload.id || `goal_${Date.now()}`,
    name: String(payload.name || 'Mục tiêu mới').trim(),
    target_amount: Math.max(100000, Math.round(Number(payload.target_amount) || 10000000)),
    current_amount: Math.max(0, Math.round(Number(payload.current_amount) || 0)),
    deadline: payload.deadline || '2027-06-30',
    icon: payload.icon || 'Target',
    color: payload.color || '#10b981',
    note: String(payload.note || '').trim()
  };

  if (dbMode === 'postgresql' && pool) {
    await pool.query(
      `INSERT INTO ff_goals (id, name, target_amount, current_amount, deadline, icon, color, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         target_amount = EXCLUDED.target_amount,
         current_amount = EXCLUDED.current_amount,
         deadline = EXCLUDED.deadline,
         icon = EXCLUDED.icon,
         color = EXCLUDED.color,
         note = EXCLUDED.note`,
      [goal.id, goal.name, goal.target_amount, goal.current_amount, goal.deadline, goal.icon, goal.color, goal.note]
    );
    return goal;
  }

  const idx = memoryStore.goals.findIndex((g) => g.id === goal.id);
  if (idx !== -1) memoryStore.goals[idx] = goal;
  else memoryStore.goals.push(goal);
  return goal;
}

export async function contributeToGoal(id, { amount, wallet_id }) {
  await initDb();
  const addAmount = Math.max(0, Math.round(Number(amount) || 0));
  if (addAmount <= 0) throw new Error('Số tiền nạp vào hũ phải lớn hơn 0');

  if (dbMode === 'postgresql' && pool) {
    const res = await pool.query(
      `UPDATE ff_goals SET current_amount = current_amount + $1 WHERE id = $2 RETURNING *`,
      [addAmount, id]
    );
    if (res.rows.length === 0) throw new Error('Không tìm thấy hũ tiết kiệm');
    const goal = normalizeNumberFields(res.rows[0], ['target_amount', 'current_amount']);

    if (wallet_id) {
      await createTransaction({
        title: `Nạp hũ tiết kiệm: ${goal.name}`,
        amount: addAmount,
        type: 'expense',
        category_id: 'cat_invest_out',
        wallet_id,
        tx_date: '2026-11-05',
        note: `Tích lũy mục tiêu ${goal.name}`,
        tags: ['tiếtkiệm', 'mụctiêu']
      });
    }
    return goal;
  }

  const goal = memoryStore.goals.find((g) => g.id === id);
  if (!goal) throw new Error('Không tìm thấy hũ tiết kiệm');
  goal.current_amount += addAmount;
  if (wallet_id) {
    await createTransaction({
      title: `Nạp hũ tiết kiệm: ${goal.name}`,
      amount: addAmount,
      type: 'expense',
      category_id: 'cat_invest_out',
      wallet_id,
      tx_date: '2026-11-05',
      note: `Tích lũy mục tiêu ${goal.name}`,
      tags: ['tiếtkiệm', 'mụctiêu']
    });
  }
  return goal;
}

export async function payRecurringBill(id, { month = '2026-11', tx_date = '2026-11-05' } = {}) {
  await initDb();

  if (dbMode === 'postgresql' && pool) {
    const recRes = await pool.query('SELECT * FROM ff_recurring WHERE id = $1', [id]);
    if (recRes.rows.length === 0) throw new Error('Không tìm thấy hóa đơn định kỳ');
    const bill = normalizeNumberFields(recRes.rows[0], ['amount', 'due_day']);

    await pool.query('UPDATE ff_recurring SET last_paid_month = $1 WHERE id = $2', [month, id]);
    const tx = await createTransaction({
      title: `Thanh toán định kỳ: ${bill.title}`,
      amount: bill.amount,
      type: 'expense',
      category_id: bill.category_id,
      wallet_id: bill.wallet_id,
      tx_date,
      note: `Hóa đơn định kỳ hàng tháng (Kỳ ${month})`,
      tags: ['địnhkỳ', 'hóađơn']
    });
    return { bill: { ...bill, last_paid_month: month }, transaction: tx };
  }

  const bill = memoryStore.recurring.find((r) => r.id === id);
  if (!bill) throw new Error('Không tìm thấy hóa đơn định kỳ');
  bill.last_paid_month = month;
  const tx = await createTransaction({
    title: `Thanh toán định kỳ: ${bill.title}`,
    amount: bill.amount,
    type: 'expense',
    category_id: bill.category_id,
    wallet_id: bill.wallet_id,
    tx_date,
    note: `Hóa đơn định kỳ hàng tháng (Kỳ ${month})`,
    tags: ['địnhkỳ', 'hóađơn']
  });
  return { bill, transaction: tx };
}

export async function upsertRecurringBill(payload) {
  await initDb();
  const bill = {
    id: payload.id || `rec_${Date.now()}`,
    title: String(payload.title || 'Hóa đơn định kỳ').trim(),
    amount: Math.max(0, Math.round(Number(payload.amount) || 0)),
    category_id: payload.category_id || 'cat_housing',
    wallet_id: payload.wallet_id || 'w_bank',
    due_day: Math.min(31, Math.max(1, Number(payload.due_day) || 5)),
    last_paid_month: payload.last_paid_month || '',
    active: payload.active !== false
  };

  if (dbMode === 'postgresql' && pool) {
    await pool.query(
      `INSERT INTO ff_recurring (id, title, amount, category_id, wallet_id, due_day, last_paid_month, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         amount = EXCLUDED.amount,
         category_id = EXCLUDED.category_id,
         wallet_id = EXCLUDED.wallet_id,
         due_day = EXCLUDED.due_day,
         last_paid_month = EXCLUDED.last_paid_month,
         active = EXCLUDED.active`,
      [bill.id, bill.title, bill.amount, bill.category_id, bill.wallet_id, bill.due_day, bill.last_paid_month, bill.active]
    );
    return bill;
  }

  const idx = memoryStore.recurring.findIndex((r) => r.id === bill.id);
  if (idx !== -1) memoryStore.recurring[idx] = bill;
  else memoryStore.recurring.push(bill);
  return bill;
}

export async function upsertCategory(payload) {
  await initDb();
  const cat = {
    id: payload.id || `cat_${Date.now()}`,
    name: String(payload.name || 'Danh mục mới').trim(),
    type: payload.type === 'income' ? 'income' : 'expense',
    icon: payload.icon || 'Tag',
    color: payload.color || '#10b981',
    group_rule: payload.group_rule || (payload.type === 'income' ? 'income' : 'needs'),
    keywords: Array.isArray(payload.keywords)
      ? payload.keywords
      : [String(payload.name || '').toLowerCase()]
  };

  if (dbMode === 'postgresql' && pool) {
    await pool.query(
      `INSERT INTO ff_categories (id, name, type, icon, color, group_rule, keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         icon = EXCLUDED.icon,
         color = EXCLUDED.color,
         group_rule = EXCLUDED.group_rule,
         keywords = EXCLUDED.keywords`,
      [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.group_rule, JSON.stringify(cat.keywords)]
    );
    return cat;
  }

  const idx = memoryStore.categories.findIndex((c) => c.id === cat.id);
  if (idx !== -1) memoryStore.categories[idx] = cat;
  else memoryStore.categories.push(cat);
  return cat;
}

export async function deleteWallet(id) {
  await initDb();
  if (dbMode === 'postgresql' && pool) {
    await pool.query('DELETE FROM ff_wallets WHERE id = $1', [id]);
    return { deleted: true, id };
  }
  memoryStore.wallets = memoryStore.wallets.filter((w) => w.id !== id);
  return { deleted: true, id };
}

export async function deleteGoal(id) {
  await initDb();
  if (dbMode === 'postgresql' && pool) {
    await pool.query('DELETE FROM ff_goals WHERE id = $1', [id]);
    return { deleted: true, id };
  }
  memoryStore.goals = memoryStore.goals.filter((g) => g.id !== id);
  return { deleted: true, id };
}

export async function deleteRecurringBill(id) {
  await initDb();
  if (dbMode === 'postgresql' && pool) {
    await pool.query('DELETE FROM ff_recurring WHERE id = $1', [id]);
    return { deleted: true, id };
  }
  memoryStore.recurring = memoryStore.recurring.filter((r) => r.id !== id);
  return { deleted: true, id };
}

export async function resetToDemoData() {
  await initDb();
  if (dbMode === 'postgresql' && pool) {
    await pool.query('TRUNCATE TABLE ff_transactions, ff_wallets, ff_categories, ff_budgets, ff_goals, ff_recurring');
    await seedPostgresData();
    return getFullState();
  }
  memoryStore.wallets = structuredClone(INITIAL_WALLETS);
  memoryStore.categories = structuredClone(INITIAL_CATEGORIES);
  memoryStore.budgets = structuredClone(INITIAL_BUDGETS);
  memoryStore.goals = structuredClone(INITIAL_GOALS);
  memoryStore.recurring = structuredClone(INITIAL_RECURRING);
  memoryStore.transactions = structuredClone(INITIAL_TRANSACTIONS);
  return getFullState();
}
