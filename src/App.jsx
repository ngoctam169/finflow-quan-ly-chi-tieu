import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  PiggyBank,
  BarChart3,
  Plus,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Search,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit3,
  Copy,
  Database,
  Sparkles,
  ShieldCheck,
  Wallet,
  RotateCcw,
  Undo2,
  ListFilter
} from 'lucide-react';
import {
  INITIAL_WALLETS,
  INITIAL_CATEGORIES,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_RECURRING,
  INITIAL_TRANSACTIONS,
  QUICK_TEMPLATES,
  RECURRING_SUGGESTIONS,
  GOAL_SUGGESTIONS,
  BUDGET_SUGGESTIONS
} from './utils/defaultData.js';
import {
  formatVND,
  formatCompactVND,
  formatDateVN,
  evaluateAmountExpression
} from './utils/smartParser.js';
import { DynamicIcon } from './components/IconMap.jsx';
import {
  CashflowBarChart,
  CategoryDonutChart,
  Rule503020Card
} from './components/Charts.jsx';
import { QuickAddBar } from './components/QuickAddBar.jsx';
import { TransactionModal } from './components/TransactionModal.jsx';
import { WalletModal } from './components/WalletModal.jsx';
import { CalendarLedgerView } from './components/CalendarLedgerView.jsx';

const STORAGE_KEY = 'finflow_vn_state_v2_clean';

const NAV_TABS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'transactions', label: 'Sổ giao dịch', icon: ReceiptText },
  { id: 'budgets', label: 'Ngân sách', icon: PieChart },
  { id: 'goals', label: 'Tích lũy & Định kỳ', icon: PiggyBank },
  { id: 'analytics', label: 'Phân tích & Cloud DB', icon: BarChart3 }
];

const MONTH_OPTIONS = [
  { value: '2026-11', label: 'Tháng 11 / 2026 (Hiện tại)' },
  { value: '2026-10', label: 'Tháng 10 / 2026' },
  { value: 'ALL', label: 'Tất cả các kỳ' }
];

export default function App() {
  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [hideBalance, setHideBalance] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Clean Initial State (0 transactions, 0 balances, essential wallets & categories pre-configured)
  const [wallets, setWallets] = useState(INITIAL_WALLETS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [budgets, setBudgets] = useState(INITIAL_BUDGETS);
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [recurring, setRecurring] = useState(INITIAL_RECURRING);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [quickTemplates, setQuickTemplates] = useState(QUICK_TEMPLATES);

  // Backend / Cloud PostgreSQL Sync State
  const [dbStatus, setDbStatus] = useState({
    mode: 'connecting',
    provider: 'Cloud PostgreSQL (ap-southeast-1)',
    connected: true
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState('transfer');
  const [editingWallet, setEditingWallet] = useState(null);

  // Ledger Filters
  const [ledgerViewMode, setLedgerViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);
  const [sortBy] = useState('date_desc');

  // Budget Inline Editing
  const [editingBudgetCatId, setEditingBudgetCatId] = useState(null);
  const [budgetInputVal, setBudgetInputVal] = useState('');

  // Savings Goal & Recurring Forms
  const [contributeGoalId, setContributeGoalId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeWalletId] = useState('w_bank');
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: '2027-06-30',
    icon: 'Target',
    color: '#10b981',
    note: '',
    suggestedTargets: ['10000000', '30000000', '50000000']
  });

  const [newRecurringOpen, setNewRecurringOpen] = useState(false);
  const [newRecurringForm, setNewRecurringForm] = useState({
    title: '',
    amount: '',
    category_id: 'cat_housing',
    wallet_id: 'w_bank',
    due_day: '5',
    suggestedAmounts: ['200000', '500000', '1500000']
  });

  // Toast & Undo
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, undoAction = null) => {
    setToast({ message, undoAction, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Global Keyboard Shortcuts (N = New Transaction, H = Hide/Show Balance)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingTx(null);
        setTxModalOpen(true);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHideBalance((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const applyServerState = useCallback((data) => {
    if (!data) return;
    if (Array.isArray(data.wallets)) setWallets(data.wallets);
    if (Array.isArray(data.categories)) setCategories(data.categories);
    if (Array.isArray(data.budgets)) setBudgets(data.budgets);
    if (Array.isArray(data.goals)) setGoals(data.goals);
    if (Array.isArray(data.recurring)) setRecurring(data.recurring);
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (Array.isArray(data.quickTemplates)) setQuickTemplates(data.quickTemplates);
    if (data.dbMode) {
      setDbStatus({
        mode: data.dbMode,
        provider: data.provider || 'Cloud PostgreSQL (ap-southeast-1)',
        connected: data.dbMode === 'postgresql'
      });
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, []);

  const fetchCloudState = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Remove legacy demo localStorage key if present
      localStorage.removeItem('finflow_vn_state_v1');
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        applyServerState(data);
      }
    } catch {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) applyServerState(JSON.parse(saved));
      } catch {
        // ignore
      }
    } finally {
      setIsSyncing(false);
    }
  }, [applyServerState]);

  useEffect(() => {
    fetchCloudState();
  }, [fetchCloudState]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const walletMap = useMemo(
    () => new Map(wallets.map((w) => [w.id, w])),
    [wallets]
  );

  // Derived Metrics
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) =>
      selectedMonth === 'ALL' ? true : String(t.tx_date).startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  const totalNetWorth = useMemo(
    () => wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0),
    [wallets]
  );

  const monthIncome = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [monthTransactions]
  );

  const monthExpense = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [monthTransactions]
  );

  const monthNetCashflow = monthIncome - monthExpense;
  const savingsRate =
    monthIncome > 0 ? Math.max(0, ((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  const totalMonthlyBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + (Number(b.monthly_limit) || 0), 0),
    [budgets]
  );

  const daysRemainingInMonth = selectedMonth === '2026-11' ? 25 : 15;
  const budgetRemaining = Math.max(0, totalMonthlyBudget - monthExpense);
  const safeDailySpend =
    totalMonthlyBudget > 0
      ? Math.round(budgetRemaining / Math.max(1, daysRemainingInMonth))
      : 0;

  const filteredLedgerTransactions = useMemo(() => {
    return monthTransactions
      .filter((tx) => {
        if (selectedDay && tx.tx_date !== selectedDay) return false;
        if (filterType !== 'all' && tx.type !== filterType) return false;
        if (filterCategory !== 'all' && tx.category_id !== filterCategory) return false;
        if (filterWallet !== 'all' && tx.wallet_id !== filterWallet) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const catName = categoryMap.get(tx.category_id)?.name?.toLowerCase() || '';
          const matchTitle = String(tx.title || '').toLowerCase().includes(q);
          const matchNote = String(tx.note || '').toLowerCase().includes(q);
          const matchTags = (tx.tags || []).some((tag) => String(tag).toLowerCase().includes(q));
          return matchTitle || matchNote || matchTags || catName.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        if (sortBy === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        return String(b.tx_date).localeCompare(String(a.tx_date));
      });
  }, [
    monthTransactions,
    selectedDay,
    filterType,
    filterCategory,
    filterWallet,
    searchQuery,
    sortBy,
    categoryMap
  ]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map();
    for (const tx of filteredLedgerTransactions) {
      if (!groups.has(tx.tx_date)) {
        groups.set(tx.tx_date, { date: tx.tx_date, items: [], dayIncome: 0, dayExpense: 0 });
      }
      const g = groups.get(tx.tx_date);
      g.items.push(tx);
      if (tx.type === 'income') g.dayIncome += Number(tx.amount) || 0;
      else g.dayExpense += Number(tx.amount) || 0;
    }
    return Array.from(groups.values());
  }, [filteredLedgerTransactions]);

  // CRUD Handlers
  const handleSaveTransaction = async (txData) => {
    const isEdit = Boolean(txData.id);
    try {
      const url = isEdit ? `/api/transactions/${txData.id}` : '/api/transactions';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast(
          isEdit
            ? `Đã cập nhật: ${txData.title}`
            : `Đã ghi nhận: ${txData.title} (${formatVND(txData.amount)})`,
          !isEdit && data.transaction?.id
            ? () => handleDeleteTransaction(data.transaction.id, true)
            : null
        );
        return;
      }
    } catch {
      // Offline fallback
    }

    const newTx = { ...txData, id: txData.id || `tx_${Date.now()}` };
    setTransactions((prev) =>
      isEdit ? prev.map((t) => (t.id === newTx.id ? newTx : t)) : [newTx, ...prev]
    );
    showToast(`Đã lưu: ${newTx.title}`);
  };

  const handleDeleteTransaction = async (id, silent = false) => {
    const target = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
      }
    } catch {
      // ignore
    }
    if (!silent && target) {
      showToast(`Đã xóa giao dịch "${target.title}"`, () => {
        const { id: _oldId, ...rest } = target;
        handleSaveTransaction(rest);
      });
    }
  };

  const handleCreateCategory = async (catData) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast(`Đã thêm danh mục mới: ${catData.name}`);
        return data.category;
      }
    } catch {
      // fallback
    }
    const localCat = { ...catData, id: `cat_${Date.now()}` };
    setCategories((prev) => [...prev, localCat]);
    return localCat;
  };

  const handleSaveWallet = async (walletData) => {
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletData)
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast(`Đã cập nhật nguồn tiền: ${walletData.name}`);
      }
    } catch {
      showToast('Đã lưu ví nguồn tiền');
    }
  };

  const handleDeleteWallet = async (walletId) => {
    try {
      const res = await fetch(`/api/wallets/${walletId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast('Đã xóa ví nguồn tiền');
      }
    } catch {
      setWallets((prev) => prev.filter((w) => w.id !== walletId));
    }
  };

  const handleTransferWallets = async (transferData) => {
    try {
      const res = await fetch('/api/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast(`Đã chuyển ${formatVND(transferData.amount)} giữa các ví`);
      }
    } catch {
      showToast('Đã thực hiện chuyển tiền nội bộ');
    }
  };

  const handleSaveBudget = async (category_id, customVal = null) => {
    const limit =
      customVal !== null
        ? Number(customVal)
        : evaluateAmountExpression(budgetInputVal);
    setEditingBudgetCatId(null);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id, monthly_limit: limit })
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast(
          limit > 0
            ? `Đã đặt định mức ngân sách: ${formatVND(limit)}`
            : 'Đã xóa định mức ngân sách'
        );
      }
    } catch {
      setBudgets((prev) => {
        const exists = prev.some((b) => b.category_id === category_id);
        if (exists) {
          return prev.map((b) => (b.category_id === category_id ? { ...b, monthly_limit: limit } : b));
        }
        return [...prev, { category_id, monthly_limit: limit }];
      });
    }
  };

  const handleContributeGoal = async (goalId) => {
    const val = evaluateAmountExpression(contributeAmount);
    if (val <= 0) return;
    setContributeGoalId(null);
    try {
      const res = await fetch(`/api/goals/${goalId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val, wallet_id: contributeWalletId })
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
        showToast(`🎉 Đã tích lũy thêm ${formatVND(val)} vào hũ mục tiêu!`);
      }
    } catch {
      showToast('Đã nạp vào hũ tiết kiệm');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalForm.name.trim()) return;
    const target = evaluateAmountExpression(newGoalForm.target_amount);
    if (target <= 0) {
      showToast('Vui lòng nhập số tiền mục tiêu lớn hơn 0 ₫');
      return;
    }
    const payload = {
      name: newGoalForm.name.trim(),
      target_amount: target,
      current_amount: evaluateAmountExpression(newGoalForm.current_amount) || 0,
      deadline: newGoalForm.deadline || '2027-06-30',
      icon: newGoalForm.icon || 'Target',
      color: newGoalForm.color || '#10b981',
      note: newGoalForm.note.trim()
    };
    setNewGoalOpen(false);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast(`Đã tạo hũ tiết kiệm: ${payload.name}`);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast('Đã xóa hũ mục tiêu');
      }
    } catch {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
  };

  const handlePayRecurring = async (billId) => {
    try {
      const res = await fetch(`/api/recurring/${billId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: '2026-11', tx_date: '2026-11-05' })
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast('Đã thanh toán hóa đơn định kỳ & tự động ghi sổ giao dịch!');
      }
    } catch {
      showToast('Đã ghi nhận thanh toán hóa đơn');
    }
  };

  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    if (!newRecurringForm.title.trim()) return;
    const amt = evaluateAmountExpression(newRecurringForm.amount);
    if (amt <= 0) {
      showToast('Vui lòng nhập số tiền hóa đơn định kỳ lớn hơn 0 ₫');
      return;
    }
    const payload = {
      title: newRecurringForm.title.trim(),
      amount: amt,
      category_id: newRecurringForm.category_id || 'cat_housing',
      wallet_id: newRecurringForm.wallet_id || 'w_bank',
      due_day: Number(newRecurringForm.due_day) || 5,
      last_paid_month: ''
    };
    setNewRecurringOpen(false);
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast(`Đã lưu hóa đơn định kỳ: ${payload.title}`);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteRecurring = async (billId) => {
    try {
      const res = await fetch(`/api/recurring/${billId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast('Đã xóa khoản định kỳ');
      }
    } catch {
      setRecurring((prev) => prev.filter((r) => r.id !== billId));
    }
  };

  const handleResetClean = async () => {
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data.state);
        showToast('Đã làm mới toàn bộ dữ liệu về 0 ₫ (giữ nguyên danh mục & ví cơ bản)!');
      }
    } catch {
      showToast('Đã làm mới dữ liệu về 0 ₫');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Ngày', 'Loại', 'Tiêu đề', 'Danh mục', 'Ví thanh toán', 'Số tiền (VND)', 'Ghi chú'];
    const rows = filteredLedgerTransactions.map((tx) => [
      tx.tx_date,
      tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
      `"${String(tx.title || '').replace(/"/g, '""')}"`,
      `"${categoryMap.get(tx.category_id)?.name || tx.category_id}"`,
      `"${walletMap.get(tx.wallet_id)?.name || tx.wallet_id}"`,
      tx.amount,
      `"${String(tx.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinFlow_SoChiTieu_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file Excel CSV thành công!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
      {/* LEFT SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5 shrink-0 sticky top-0 h-screen">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 mb-7">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  FinFlow
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  VN Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quản lý tài chính cá nhân
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => {
              setEditingTx(null);
              setTxModalOpen(true);
            }}
            className="w-full mb-6 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi Giao Dịch Mới (Phím N)</span>
          </button>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/70'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.id === 'transactions' && (
                    <span className="text-[11px] font-mono-num px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {monthTransactions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cloud PostgreSQL Status Card in Sidebar */}
        <div className="space-y-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Cloud PostgreSQL
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {dbStatus.provider}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={fetchCloudState}
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                Đồng bộ ngay
              </button>
              <span className="text-slate-400 font-mono-num">{transactions.length} giao dịch</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 px-1 flex items-center justify-between">
            <span>Phím tắt: [N] Thêm • [H] Ẩn số</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {NAV_TABS.find((t) => t.id === activeTab)?.label}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Gợi ý sẵn các mục thiết yếu trong cuộc sống — Bạn chỉ cần điền số tiền hoặc tạo mới
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedDay(null);
                  }}
                  className="pl-3 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setHideBalance((prev) => !prev)}
                title="Ẩn/Hiện số tiền (Phím H)"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                {hideBalance ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                title="Đổi giao diện Sáng / Tối"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ghi chi tiêu</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN WORKSPACE CONTAINER */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* ==================== TAB 1: DASHBOARD (TỔNG QUAN) ==================== */}
          {activeTab === 'dashboard' && (
            <>
              {/* 1. Smart Natural Language Quick-Add Bar with Suggestion Chips */}
              <QuickAddBar
                categories={categories}
                wallets={wallets}
                quickTemplates={quickTemplates}
                onQuickSubmit={handleSaveTransaction}
                onOpenFullModal={(prefill = null) => {
                  setEditingTx(prefill);
                  setTxModalOpen(true);
                }}
              />

              {/* 2. KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/15 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-100">
                      Tổng Số Dư Các Ví
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {wallets.length} Ví sẵn có
                    </span>
                  </div>
                  <div className="my-3">
                    <p className="text-2xl font-extrabold font-mono-num tracking-tight">
                      {formatVND(totalNetWorth, hideBalance)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-100">
                    <span>Chênh lệch thu chi:</span>
                    <span className="font-mono-num font-bold text-white">
                      {monthNetCashflow >= 0 ? '+' : ''}
                      {formatCompactVND(monthNetCashflow, hideBalance)}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Tổng Thu Nhập Kỳ Này
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <p className="text-2xl font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400">
                      +{formatVND(monthIncome, hideBalance)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Tỷ lệ tiết kiệm ròng:</span>
                    <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                      {savingsRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Tổng Chi Tiêu Kỳ Này
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <p className="text-2xl font-extrabold font-mono-num text-rose-600 dark:text-rose-400">
                      -{formatVND(monthExpense, hideBalance)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>So với ngân sách tháng:</span>
                    <span className="font-mono-num font-bold text-slate-800 dark:text-slate-200">
                      {totalMonthlyBudget > 0
                        ? `${((monthExpense / totalMonthlyBudget) * 100).toFixed(1)}%`
                        : 'Chưa đặt hạn mức'}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Hạn Mức Chi An Toàn / Ngày
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <p className="text-2xl font-extrabold font-mono-num text-blue-600 dark:text-blue-400">
                      {totalMonthlyBudget > 0 ? formatVND(safeDailySpend, hideBalance) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Ngân sách còn lại:</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('budgets')}
                      className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {totalMonthlyBudget > 0
                        ? formatCompactVND(budgetRemaining, hideBalance)
                        : 'Thiết lập ngay →'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Wallets Bar (Đã tạo sẵn 4 Ví thiết yếu ở mức 0 ₫ để user tự điền hoặc thêm mới) */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Nguồn Tiền & Ví Cá Nhân (Đã tạo sẵn các ví thiết yếu)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chạm vào từng ví để nhập số dư thực tế của bạn, hoặc nhấn &ldquo;+ Thêm ví&rdquo; để tạo ví mới
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWallet(null);
                        setWalletModalMode('transfer');
                        setWalletModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                      Chuyển tiền giữa các ví
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWallet(null);
                        setWalletModalMode('wallet');
                        setWalletModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm ví mới
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {wallets.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => {
                        setEditingWallet(w);
                        setWalletModalMode('wallet');
                        setWalletModalOpen(true);
                      }}
                      className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/60 dark:bg-slate-800/40 transition cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${w.color}20`, color: w.color }}
                        >
                          <DynamicIcon name={w.icon} className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
                          {w.balance === 0 ? 'Nhập số dư →' : w.account_number}
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {w.name}
                        </p>
                        <p className="text-base font-extrabold font-mono-num text-slate-900 dark:text-white mt-0.5">
                          {formatVND(w.balance, hideBalance)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Recent Transactions & Essential Life Suggestions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Recent Transactions or Quick Category Starters */}
                <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {monthTransactions.length > 0
                          ? 'Giao Dịch Vừa Ghi Nhận'
                          : 'Danh Mục Thiết Yếu Đã Chuẩn Bị Sẵn Cho Bạn'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {monthTransactions.length > 0
                          ? 'Nhấn vào giao dịch bất kỳ để chỉnh sửa'
                          : 'Chưa có giao dịch nào — Chạm vào một mục dưới đây để điền số tiền hoặc tự tạo mới'}
                      </p>
                    </div>
                    {monthTransactions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Xem toàn bộ ({monthTransactions.length}) →
                      </button>
                    )}
                  </div>

                  {monthTransactions.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {categories.slice(0, 12).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setEditingTx({
                              title: '',
                              type: cat.type,
                              category_id: cat.id,
                              wallet_id: cat.type === 'income' ? 'w_bank' : 'w_cash'
                            });
                            setTxModalOpen(true);
                          }}
                          className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-2.5 text-left transition cursor-pointer group"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <DynamicIcon name={cat.icon} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {cat.name}
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              + Điền số tiền
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {monthTransactions.slice(0, 6).map((tx) => {
                        const cat = categoryMap.get(tx.category_id) || {
                          name: 'Khác',
                          color: '#64748b',
                          icon: 'Tag'
                        };
                        const wallet = walletMap.get(tx.wallet_id);
                        return (
                          <div
                            key={tx.id}
                            onClick={() => {
                              setEditingTx(tx);
                              setTxModalOpen(true);
                            }}
                            className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                              >
                                <DynamicIcon name={cat.icon} className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {tx.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {cat.name} • {wallet?.name} • {formatDateVN(tx.tx_date)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p
                                className={`text-xs sm:text-sm font-extrabold font-mono-num ${
                                  tx.type === 'income'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {tx.type === 'income' ? '+' : '-'}
                                {formatVND(tx.amount, hideBalance)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Recurring Bills or Life Bill Suggestions */}
                <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Hóa Đơn Định Kỳ Hàng Tháng
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {recurring.length > 0
                            ? '1 chạm để thanh toán và tự động ghi vào sổ'
                            : 'Gợi ý các hóa đơn thiết yếu — Chạm để điền số tiền của bạn'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('goals')}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Quản lý →
                      </button>
                    </div>

                    {recurring.length === 0 ? (
                      <div className="space-y-2">
                        {RECURRING_SUGGESTIONS.slice(0, 5).map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setNewRecurringForm({
                                title: sug.title,
                                amount: '',
                                category_id: sug.category_id,
                                wallet_id: sug.wallet_id,
                                due_day: String(sug.due_day),
                                suggestedAmounts: sug.suggestedAmounts
                              });
                              setNewRecurringOpen(true);
                              setActiveTab('goals');
                            }}
                            className="w-full p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/40 dark:bg-slate-800/30 flex items-center justify-between text-left transition cursor-pointer"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {sug.title}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Gợi ý ngày {String(sug.due_day).padStart(2, '0')} hàng tháng
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                              + Thiết lập
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {recurring.map((bill) => {
                          const isPaidThisMonth = bill.last_paid_month === '2026-11';
                          return (
                            <div
                              key={bill.id}
                              className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                  {bill.title}
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Ngày {String(bill.due_day).padStart(2, '0')} •{' '}
                                  <strong className="font-mono-num text-slate-700 dark:text-slate-200">
                                    {formatVND(bill.amount, hideBalance)}
                                  </strong>
                                </p>
                              </div>

                              {isPaidThisMonth ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Đã trả
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePayRecurring(bill.id)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-bold shadow-sm transition cursor-pointer shrink-0"
                                >
                                  Thanh toán
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Charts Row: Cashflow Trend & Category Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Biểu Đồ Dòng Tiền Thu - Chi Theo Ngày
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tự động vẽ biểu đồ ngay khi bạn ghi nhận các khoản thu/chi
                  </p>
                  <CashflowBarChart
                    transactions={transactions}
                    selectedMonth={selectedMonth}
                    hideBalance={hideBalance}
                    darkMode={darkMode}
                  />
                </div>

                <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                  <div className="mb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Cơ Cấu Chi Tiêu Theo Danh Mục
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tỷ trọng từng nhóm chi tiêu của bạn trong tháng
                    </p>
                  </div>
                  <CategoryDonutChart
                    transactions={transactions}
                    categories={categories}
                    selectedMonth={selectedMonth}
                    hideBalance={hideBalance}
                    onSelectCategory={(catId) => {
                      setFilterCategory(catId);
                      setActiveTab('transactions');
                    }}
                  />
                </div>
              </div>

              {/* 6. 50/30/20 Financial Rule Analyzer */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Phân Tích Quy Tắc Tài Chính Cá Nhân 50 / 30 / 20
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tự động đối chiếu chi tiêu thực tế với chuẩn quản lý tài chính quốc tế
                  </p>
                </div>
                <Rule503020Card
                  transactions={transactions}
                  categories={categories}
                  selectedMonth={selectedMonth}
                  hideBalance={hideBalance}
                />
              </div>
            </>
          )}

          {/* ==================== TAB 2: SỔ GIAO DỊCH (TRANSACTIONS LEDGER) ==================== */}
          {activeTab === 'transactions' && (
            <div className="space-y-5">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setLedgerViewMode('list')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        ledgerViewMode === 'list'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      Danh sách chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => setLedgerViewMode('calendar')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        ledgerViewMode === 'calendar'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Lịch nhiệt chi tiêu
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {filteredLedgerTransactions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        Xuất Excel CSV
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTx(null);
                        setTxModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm giao dịch
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  <div className="relative lg:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên món, ghi chú, #tag..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">Tất cả loại (Thu & Chi)</option>
                    <option value="expense">Chỉ khoản Chi tiêu (-)</option>
                    <option value="income">Chỉ khoản Thu nhập (+)</option>
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterWallet}
                    onChange={(e) => setFilterWallet(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">Tất cả ví nguồn tiền</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {ledgerViewMode === 'calendar' && (
                <CalendarLedgerView
                  month={selectedMonth}
                  transactions={transactions}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  hideBalance={hideBalance}
                />
              )}

              {groupedTransactions.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-10 text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Sổ giao dịch đang trống
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hãy nhấn nút bên dưới để tự ghi khoản thu/chi đầu tiên của bạn
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTx(null);
                      setTxModalOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm giao dịch đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedTransactions.map((group) => (
                    <div
                      key={group.date}
                      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm"
                    >
                      <div className="px-5 py-3 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {formatDateVN(group.date)}
                        </span>
                        <div className="flex items-center gap-3 text-xs font-mono-num">
                          {group.dayIncome > 0 && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              Thu: +{formatVND(group.dayIncome, hideBalance)}
                            </span>
                          )}
                          {group.dayExpense > 0 && (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              Chi: -{formatVND(group.dayExpense, hideBalance)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {group.items.map((tx) => {
                          const cat = categoryMap.get(tx.category_id) || {
                            name: 'Khác',
                            color: '#64748b',
                            icon: 'Tag'
                          };
                          const wallet = walletMap.get(tx.wallet_id);

                          return (
                            <div
                              key={tx.id}
                              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                            >
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                <div
                                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                                >
                                  <DynamicIcon name={cat.icon} className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                      {tx.title}
                                    </p>
                                    {(tx.tags || []).map((tag, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    <span className="font-semibold" style={{ color: cat.color }}>
                                      {cat.name}
                                    </span>{' '}
                                    • Ví: {wallet?.name || 'Ví cá nhân'}
                                    {tx.note ? ` • “${tx.note}”` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                <span
                                  className={`text-sm sm:text-base font-extrabold font-mono-num ${
                                    tx.type === 'income'
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {tx.type === 'income' ? '+' : '-'}
                                  {formatVND(tx.amount, hideBalance)}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    title="Nhân bản giao dịch này"
                                    onClick={() => {
                                      const { id: _ignore, ...cloneData } = tx;
                                      handleSaveTransaction({
                                        ...cloneData,
                                        tx_date: '2026-11-05'
                                      });
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Chỉnh sửa"
                                    onClick={() => {
                                      setEditingTx(tx);
                                      setTxModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Xóa giao dịch"
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: NGÂN SÁCH (BUDGET PLANNER WITH SUGGESTIONS) ==================== */}
          {activeTab === 'budgets' && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Định mức chi tiêu hàng tháng
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                      Tổng Ngân Sách Bạn Đã Đặt: {formatVND(totalMonthlyBudget, hideBalance)}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chọn nhanh mức gợi ý ở từng danh mục bên dưới hoặc tự điền con số phù hợp với bạn
                    </p>
                  </div>
                  {totalMonthlyBudget > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Hạn mức an toàn mỗi ngày còn lại:</p>
                      <p className="text-base font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400">
                        {formatVND(safeDailySpend, hideBalance)} / ngày
                      </p>
                    </div>
                  )}
                </div>

                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalMonthlyBudget > 0 && monthExpense > totalMonthlyBudget
                        ? 'bg-rose-600'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        totalMonthlyBudget > 0 ? (monthExpense / totalMonthlyBudget) * 100 : 0
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Per-Category Budget Cards with Quick Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories
                  .filter((c) => c.type === 'expense')
                  .map((cat) => {
                    const budgetObj = budgets.find((b) => b.category_id === cat.id);
                    const limit = Number(budgetObj?.monthly_limit || 0);
                    const spent = monthTransactions
                      .filter((t) => t.type === 'expense' && t.category_id === cat.id)
                      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
                    const pct = limit > 0 ? (spent / limit) * 100 : 0;
                    const remaining = limit - spent;
                    const isEditingThis = editingBudgetCatId === cat.id;
                    const suggestions = BUDGET_SUGGESTIONS[cat.id] || [1000000, 2000000, 3000000];

                    return (
                      <div
                        key={cat.id}
                        className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                              >
                                <DynamicIcon name={cat.icon} className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                  {cat.name}
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                  Đã chi: {formatVND(spent, hideBalance)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingBudgetCatId(cat.id);
                                setBudgetInputVal(limit > 0 ? String(limit) : '');
                              }}
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {limit > 0 ? 'Sửa hạn mức' : 'Tự nhập'}
                            </button>
                          </div>

                          {isEditingThis ? (
                            <div className="my-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={budgetInputVal}
                                onChange={(e) => setBudgetInputVal(e.target.value)}
                                placeholder="Nhập số tiền (VD: 2tr, 1500k)"
                                autoFocus
                                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-400 text-xs font-mono-num font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveBudget(cat.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                              >
                                Lưu
                              </button>
                            </div>
                          ) : limit === 0 ? (
                            <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                                Gợi ý hạn mức tháng (chạm để áp dụng):
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {suggestions.map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleSaveBudget(cat.id, val)}
                                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-mono-num font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                  >
                                    {formatCompactVND(val)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="my-3">
                              <div className="flex items-baseline justify-between mb-1.5">
                                <span className="text-xs text-slate-400">Hạn mức đã đặt:</span>
                                <span className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-white">
                                  {formatVND(limit, hideBalance)}
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, pct)}%`,
                                    backgroundColor:
                                      pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : cat.color
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono-num text-slate-500">
                                  Đã dùng {pct.toFixed(1)}%
                                </span>
                                <span
                                  className={`font-mono-num font-bold ${
                                    remaining >= 0
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {remaining >= 0
                                    ? `Còn ${formatCompactVND(remaining, hideBalance)}`
                                    : `Vượt ${formatCompactVND(Math.abs(remaining), hideBalance)}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==================== TAB 4: TÍCH LŨY & ĐỊNH KỲ (GOALS & RECURRING WITH SUGGESTIONS) ==================== */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {/* Section A: Savings Jars / Financial Goals */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      🐖 Hũ Tiết Kiệm & Mục Tiêu Tài Chính
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chọn một mục tiêu thiết yếu gợi ý bên dưới để điền số tiền đích, hoặc tự tạo mục tiêu riêng
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewGoalForm({
                        name: '',
                        target_amount: '',
                        current_amount: '0',
                        deadline: '2027-06-30',
                        icon: 'Target',
                        color: '#10b981',
                        note: '',
                        suggestedTargets: ['10000000', '30000000', '50000000']
                      });
                      setNewGoalOpen((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tự tạo mục tiêu riêng
                  </button>
                </div>

                {/* Goal Suggestion Chips */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    💡 Gợi ý các quỹ tiết kiệm cần thiết cho cuộc sống (chạm để chọn & điền số tiền):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {GOAL_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewGoalForm({
                            name: sug.name,
                            target_amount: '',
                            current_amount: '0',
                            deadline: '2027-06-30',
                            icon: sug.icon,
                            color: sug.color,
                            note: sug.note,
                            suggestedTargets: sug.suggestedTargets
                          });
                          setNewGoalOpen(true);
                        }}
                        className="p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 text-left transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${sug.color}20`, color: sug.color }}
                          >
                            <DynamicIcon name={sug.icon} className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {sug.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          Chọn →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Creation Form */}
                {newGoalOpen && (
                  <form
                    onSubmit={handleCreateGoal}
                    className="mb-6 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Tên mục tiêu tiết kiệm..."
                        value={newGoalForm.name}
                        onChange={(e) => setNewGoalForm({ ...newGoalForm, name: e.target.value })}
                        className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Nhập số tiền mục tiêu (VD: 30tr, 50tr)"
                        value={newGoalForm.target_amount}
                        onChange={(e) =>
                          setNewGoalForm({ ...newGoalForm, target_amount: e.target.value })
                        }
                        autoFocus
                        className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 text-xs font-mono-num font-bold"
                      />
                      <input
                        type="date"
                        value={newGoalForm.deadline}
                        onChange={(e) =>
                          setNewGoalForm({ ...newGoalForm, deadline: e.target.value })
                        }
                        className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Gợi ý mức đích:</span>
                        {(newGoalForm.suggestedTargets || ['10000000', '30000000', '50000000']).map(
                          (tVal) => (
                            <button
                              key={tVal}
                              type="button"
                              onClick={() =>
                                setNewGoalForm({ ...newGoalForm, target_amount: tVal })
                              }
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num font-bold text-emerald-600 cursor-pointer"
                            >
                              {formatCompactVND(Number(tVal))}
                            </button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewGoalOpen(false)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Lưu hũ mục tiêu
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {goals.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {goals.map((g) => {
                      const pct = Math.min(
                        100,
                        g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
                      );
                      const remaining = Math.max(0, g.target_amount - g.current_amount);

                      return (
                        <div
                          key={g.id}
                          className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: `${g.color}20`, color: g.color }}
                              >
                                <DynamicIcon name={g.icon} className="w-5 h-5" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono-num font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  {pct.toFixed(1)}%
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGoal(g.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {g.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {g.note || `Hạn hoàn thành: ${formatDateVN(g.deadline)}`}
                            </p>

                            <div className="my-4">
                              <div className="flex items-baseline justify-between text-xs mb-1.5">
                                <span className="font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400">
                                  {formatVND(g.current_amount, hideBalance)}
                                </span>
                                <span className="font-mono-num text-slate-400">
                                  / {formatVND(g.target_amount, hideBalance)}
                                </span>
                              </div>
                              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: g.color }}
                                />
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1.5">
                                Còn thiếu:{' '}
                                <strong className="font-mono-num">
                                  {formatVND(remaining, hideBalance)}
                                </strong>
                              </p>
                            </div>
                          </div>

                          {contributeGoalId === g.id ? (
                            <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                              <input
                                type="text"
                                value={contributeAmount}
                                onChange={(e) => setContributeAmount(e.target.value)}
                                placeholder="Nhập số tiền nạp (VD: 500k, 2tr)"
                                autoFocus
                                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num font-bold"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleContributeGoal(g.id)}
                                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Xác nhận nạp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setContributeGoalId(null)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setContributeGoalId(g.id);
                                setContributeAmount('');
                              }}
                              className="w-full py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer"
                            >
                              + Nạp thêm tiền vào hũ
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section B: Recurring Monthly Bills with Suggestions */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      📅 Hóa Đơn & Chi Phí Định Kỳ Hàng Tháng
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chọn hóa đơn thiết yếu bên dưới rồi điền số tiền hàng tháng của bạn, hoặc tự tạo mới
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRecurringForm({
                        title: '',
                        amount: '',
                        category_id: 'cat_housing',
                        wallet_id: 'w_bank',
                        due_day: '5',
                        suggestedAmounts: ['200000', '500000', '1500000']
                      });
                      setNewRecurringOpen((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tự thêm khoản định kỳ
                  </button>
                </div>

                {/* Recurring Bill Suggestion Chips */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    💡 Gợi ý các hóa đơn sinh hoạt thiết yếu (chạm để điền số tiền của bạn):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {RECURRING_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewRecurringForm({
                            title: sug.title,
                            amount: '',
                            category_id: sug.category_id,
                            wallet_id: sug.wallet_id,
                            due_day: String(sug.due_day),
                            suggestedAmounts: sug.suggestedAmounts
                          });
                          setNewRecurringOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        + {sug.title}
                      </button>
                    ))}
                  </div>
                </div>

                {newRecurringOpen && (
                  <form
                    onSubmit={handleCreateRecurring}
                    className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-300 dark:border-emerald-800 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Tên hóa đơn (VD: Tiền nhà, Điện, Nước...)"
                        value={newRecurringForm.title}
                        onChange={(e) =>
                          setNewRecurringForm({ ...newRecurringForm, title: e.target.value })
                        }
                        className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Nhập số tiền (VD: 350k, 4.5tr)"
                        value={newRecurringForm.amount}
                        onChange={(e) =>
                          setNewRecurringForm({ ...newRecurringForm, amount: e.target.value })
                        }
                        autoFocus
                        className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 text-xs font-mono-num font-bold"
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ngày thanh toán hàng tháng (1-31)"
                        value={newRecurringForm.due_day}
                        onChange={(e) =>
                          setNewRecurringForm({ ...newRecurringForm, due_day: e.target.value })
                        }
                        className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Gợi ý mức tiền:</span>
                        {(newRecurringForm.suggestedAmounts || ['200000', '500000', '1500000']).map(
                          (aVal) => (
                            <button
                              key={aVal}
                              type="button"
                              onClick={() =>
                                setNewRecurringForm({ ...newRecurringForm, amount: aVal })
                              }
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num font-bold text-emerald-600 cursor-pointer"
                            >
                              {formatCompactVND(Number(aVal))}
                            </button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewRecurringOpen(false)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Lưu khoản định kỳ
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {recurring.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {recurring.map((bill) => {
                      const isPaid = bill.last_paid_month === '2026-11';
                      const cat = categoryMap.get(bill.category_id);
                      const wallet = walletMap.get(bill.wallet_id);

                      return (
                        <div
                          key={bill.id}
                          className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${cat?.color || '#6366f1'}18`,
                                color: cat?.color || '#6366f1'
                              }}
                            >
                              <DynamicIcon name={cat?.icon || 'Home'} className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {bill.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Ngày {String(bill.due_day).padStart(2, '0')} hàng tháng • Ví:{' '}
                                {wallet?.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-white mb-1">
                                {formatVND(bill.amount, hideBalance)}
                              </p>
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Đã thanh toán
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePayRecurring(bill.id)}
                                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Ghi nhận đã trả
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecurring(bill.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 5: PHÂN TÍCH & CLOUD DB (ANALYTICS & DB) ==================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400">
                    Trung bình chi tiêu / giao dịch
                  </span>
                  <p className="text-xl font-extrabold font-mono-num text-slate-900 dark:text-white mt-2">
                    {formatVND(
                      monthTransactions.filter((t) => t.type === 'expense').length > 0
                        ? monthExpense /
                            monthTransactions.filter((t) => t.type === 'expense').length
                        : 0,
                      hideBalance
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tính trên {monthTransactions.filter((t) => t.type === 'expense').length} giao
                    dịch chi trong kỳ
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400">
                    Khoản chi lớn nhất trong kỳ
                  </span>
                  {(() => {
                    const biggest = monthTransactions
                      .filter((t) => t.type === 'expense')
                      .sort((a, b) => b.amount - a.amount)[0];
                    return biggest ? (
                      <>
                        <p className="text-xl font-extrabold font-mono-num text-rose-600 dark:text-rose-400 mt-2">
                          {formatVND(biggest.amount, hideBalance)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{biggest.title}</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 mt-2">Chưa có giao dịch chi tiêu</p>
                    );
                  })()}
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400">
                    Tổng tích lũy trong các Hũ Mục Tiêu
                  </span>
                  <p className="text-xl font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400 mt-2">
                    {formatVND(
                      goals.reduce((s, g) => s + (Number(g.current_amount) || 0), 0),
                      hideBalance
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {goals.length} hũ mục tiêu đang theo dõi
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          Kiến Trúc Backend & Cloud PostgreSQL Free Tier
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Đang hoạt động ({dbStatus.mode})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        React 19 + Node.js Express 5 REST API + Cloud PostgreSQL (Region Singapore
                        ap-southeast-1)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchCloudState}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Đồng bộ Cloud DB
                    </button>
                    <button
                      type="button"
                      onClick={handleResetClean}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-xs font-bold text-rose-600 dark:text-rose-300 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Đặt lại toàn bộ về 0 ₫
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[68px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ADD / EDIT TRANSACTION MODAL */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        initialData={editingTx}
        categories={categories}
        wallets={wallets}
        onSave={handleSaveTransaction}
        onCreateCategory={handleCreateCategory}
      />

      {/* WALLET & TRANSFER MODAL */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => {
          setWalletModalOpen(false);
          setEditingWallet(null);
        }}
        wallets={wallets}
        initialMode={walletModalMode}
        editingWallet={editingWallet}
        onSaveWallet={handleSaveWallet}
        onDeleteWallet={handleDeleteWallet}
        onTransfer={handleTransferWallets}
      />

      {/* FLOATING TOAST WITH UNDO */}
      {toast && (
        <div className="fixed bottom-16 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-emerald-950 text-white text-xs font-semibold shadow-xl border border-slate-700/80">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
                              type="button"
              onClick={() => {
                toast.undoAction();
                setToast(null);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Hoàn tác
            </button>
          )}
        </div>
      )}
    </div>
  );
}
