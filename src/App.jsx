import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Search,
  Download,
  RefreshCw,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit3,
  Copy,
  Database,
  RotateCcw,
  Undo2,
  ListFilter,
  Menu,
  X,
  ChevronDown,
  ArrowRight
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
  evaluateAmountExpression,
  getTodayISO,
  getCurrentMonthISO
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
import {
  SmartIncomeAllocator,
  MonthComparisonModule,
  LifeOptimizationToolkit
} from './components/SmartLifePlanner.jsx';
import { Mascot, MASCOT_CATALOG } from './components/PageMascot.jsx';

const STORAGE_KEY = 'finflow_vn_state_v2_clean';

const DEFAULT_WALLET_NAME_MAP = new Map(INITIAL_WALLETS.map((w) => [w.id, w.name]));
const DEFAULT_CAT_NAME_MAP = new Map(INITIAL_CATEGORIES.map((c) => [c.id, c.name]));

function normalizeWallets(list) {
  if (!Array.isArray(list)) return INITIAL_WALLETS;
  return list.map((w) =>
    DEFAULT_WALLET_NAME_MAP.has(w.id) ? { ...w, name: DEFAULT_WALLET_NAME_MAP.get(w.id) } : w
  );
}

function normalizeCategories(list) {
  if (!Array.isArray(list)) return INITIAL_CATEGORIES;
  return list.map((c) =>
    DEFAULT_CAT_NAME_MAP.has(c.id) ? { ...c, name: DEFAULT_CAT_NAME_MAP.get(c.id) } : c
  );
}

const NAV_TABS = [
  { id: 'dashboard', code: '01', label: 'Tổng quan', shortLabel: 'Tổng quan', icon: LayoutDashboard },
  { id: 'transactions', code: '02', label: 'Sổ giao dịch', shortLabel: 'Giao dịch', icon: ReceiptText },
  { id: 'budgets', code: '03', label: 'Ngân sách', shortLabel: 'Ngân sách', icon: PieChart },
  { id: 'goals', code: '04', label: 'Mục tiêu & Định kỳ', shortLabel: 'Mục tiêu', icon: PiggyBank },
  { id: 'analytics', code: '05', label: 'Báo cáo', shortLabel: 'Báo cáo', icon: BarChart3 }
];

const MONTH_OPTIONS = [
  { value: '2026-11', label: 'Tháng 11/2026' },
  { value: '2026-10', label: 'Tháng 10/2026' },
  { value: '2026-09', label: 'Tháng 09/2026' },
  { value: '2026-08', label: 'Tháng 08/2026' },
  { value: 'ALL', label: 'Tất cả' }
];

export default function App() {
  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthISO());
  const [hideBalance, setHideBalance] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [utilityMenuOpen, setUtilityMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('finflow_theme_mode') || 'pro-dark';
    } catch {
      return 'pro-dark';
    }
  });
  const [showMascot, setShowMascot] = useState(() => {
    try {
      return localStorage.getItem('finflow_show_mascot') === 'true';
    } catch {
      return false;
    }
  });
  const [mascotIdx, setMascotIdx] = useState(0);

  // Locked Single Mascot ('fox-riso' - Cáo Riso Tài Chính matching Terracotta Warm Paper theme)
  const mascotData = MASCOT_CATALOG[mascotIdx % MASCOT_CATALOG.length] || MASCOT_CATALOG[0];
  const [mascotReaction, setMascotReaction] = useState(null);
  const [mascotSpeech, setMascotSpeech] = useState('');
  const hasLocalEditsRef = useRef(false);

  const triggerMascotReaction = useCallback((type = 'sparkle', speech = '', duration = 1150) => {
    setMascotReaction({ type, duration, ts: Date.now() });
    if (speech) setMascotSpeech(speech);
  }, []);

  // Load cached state synchronously on first render for 0ms startup
  const initialCached = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }, []);

  // Clean Initial State (0 transactions, 0 balances, essential wallets & categories pre-configured)
  const [wallets, setWallets] = useState(() => normalizeWallets(initialCached?.wallets));
  const [categories, setCategories] = useState(() => normalizeCategories(initialCached?.categories));
  const [budgets, setBudgets] = useState(() => initialCached?.budgets || INITIAL_BUDGETS);
  const [goals, setGoals] = useState(() => initialCached?.goals || INITIAL_GOALS);
  const [recurring, setRecurring] = useState(() => initialCached?.recurring || INITIAL_RECURRING);
  const [transactions, setTransactions] = useState(
    () => initialCached?.transactions || INITIAL_TRANSACTIONS
  );
  const [quickTemplates, setQuickTemplates] = useState(() => QUICK_TEMPLATES);

  // Inline 1-Click Quick Balance Editor in Wallet Index
  const [quickBalanceWalletId, setQuickBalanceWalletId] = useState(null);
  const [quickBalanceInput, setQuickBalanceInput] = useState('');

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
  const [showDashboardAllocator, setShowDashboardAllocator] = useState(true);

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
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.classList.toggle('dark', themeMode === 'pro-dark');
    try {
      localStorage.setItem('finflow_theme_mode', themeMode);
    } catch {
      // ignore
    }
  }, [themeMode]);

  const cycleThemeMode = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === 'paper' ? 'pro-light' : prev === 'pro-light' ? 'pro-dark' : 'paper';
      const label =
        next === 'paper'
          ? '📜 Giao diện Giấy Ấm Huashu'
          : next === 'pro-light'
          ? '☀️ Giao diện FinFlow Pro Sáng'
          : '🌙 Giao diện FinFlow Pro Tối';
      showToast(`Đã chuyển sang ${label}`);
      return next;
    });
  }, [showToast]);

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
    if (Array.isArray(data.wallets)) setWallets(normalizeWallets(data.wallets));
    if (Array.isArray(data.categories)) setCategories(normalizeCategories(data.categories));
    if (Array.isArray(data.budgets)) setBudgets(data.budgets);
    if (Array.isArray(data.goals)) setGoals(data.goals);
    if (Array.isArray(data.recurring)) setRecurring(data.recurring);
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    setQuickTemplates(QUICK_TEMPLATES);
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

  // Persist local state changes to localStorage automatically (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            wallets,
            categories,
            budgets,
            goals,
            recurring,
            transactions,
            quickTemplates
          })
        );
      } catch {
        // ignore
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [wallets, categories, budgets, goals, recurring, transactions, quickTemplates]);

  const fetchCloudState = useCallback(async (forceOverwrite = false) => {
    setIsSyncing(true);
    try {
      localStorage.removeItem('finflow_vn_state_v1');
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (forceOverwrite || !hasLocalEditsRef.current) {
          applyServerState(data);
        }
      }
    } catch {
      // Offline fallback already hydrated from localStorage
    } finally {
      setIsSyncing(false);
    }
  }, [applyServerState]);

  useEffect(() => {
    fetchCloudState(false);
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

  const daysRemainingInMonth = useMemo(() => {
    const todayStr = getTodayISO();
    const [y, m, d] = todayStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return Math.max(1, lastDay - d + 1);
  }, []);
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

  // ====================================================================
  // INSTANT 0ms OPTIMISTIC CRUD HANDLERS (Background Cloud Sync)
  // ====================================================================
  const handleSaveTransaction = useCallback((txData) => {
    hasLocalEditsRef.current = true;
    const isEdit = Boolean(txData.id);
    const amt = Number(txData.amount) || 0;
    const newTx = {
      ...txData,
      id: txData.id || `tx_${Date.now()}`,
      amount: amt
    };

    // 1. Update transactions & wallet balances immediately in 0ms
    setTransactions((prev) => {
      const oldTx = isEdit ? prev.find((t) => t.id === newTx.id) : null;
      setWallets((wPrev) =>
        wPrev.map((w) => {
          let bal = Number(w.balance) || 0;
          if (oldTx && oldTx.wallet_id === w.id) {
            bal += oldTx.type === 'income' ? -Number(oldTx.amount) : Number(oldTx.amount);
          }
          if (newTx.wallet_id === w.id) {
            bal += newTx.type === 'income' ? amt : -amt;
          }
          return bal !== w.balance ? { ...w, balance: bal } : w;
        })
      );
      return isEdit ? prev.map((t) => (t.id === newTx.id ? newTx : t)) : [newTx, ...prev];
    });

    triggerMascotReaction(
      newTx.type === 'income' ? 'heart' : 'delighted',
      newTx.type === 'income'
        ? `Tuyệt vời! Nguồn thu +${formatVND(amt)} vừa được cộng vào ví!`
        : `Đã ghi sổ khoản chi "${newTx.title}" (${formatVND(amt)})!`
    );
    showToast(
      isEdit
        ? `Đã cập nhật: ${newTx.title}`
        : `Đã ghi nhận: ${newTx.title} (${formatVND(amt)})`
    );

    // 2. Sync to Cloud PostgreSQL in background without blocking UI
    const url = isEdit ? `/api/transactions/${txData.id}` : '/api/transactions';
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx)
    }).catch(() => {});
  }, [triggerMascotReaction, showToast]);

  const handleDeleteTransaction = useCallback((id, silent = false) => {
    hasLocalEditsRef.current = true;
    const target = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (target) {
      const amt = Number(target.amount) || 0;
      setWallets((wPrev) =>
        wPrev.map((w) =>
          w.id === target.wallet_id
            ? {
                ...w,
                balance: (Number(w.balance) || 0) + (target.type === 'income' ? -amt : amt)
              }
            : w
        )
      );
    }
    if (!silent && target) {
      showToast(`Đã xóa giao dịch "${target.title}"`, () => {
        const { id: _oldId, ...rest } = target;
        handleSaveTransaction(rest);
      });
    }
    fetch(`/api/transactions/${id}`, { method: 'DELETE' }).catch(() => {});
  }, [transactions, showToast, handleSaveTransaction]);

  const handleCreateCategory = useCallback(async (catData) => {
    hasLocalEditsRef.current = true;
    const localCat = { ...catData, id: `cat_${Date.now()}` };
    setCategories((prev) => [...prev, localCat]);
    showToast(`Đã thêm danh mục mới: ${catData.name}`);
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localCat)
    }).catch(() => {});
    return localCat;
  }, [showToast]);

  const handleSaveWallet = useCallback((walletData) => {
    hasLocalEditsRef.current = true;
    const savedWallet = {
      ...walletData,
      id: walletData.id || `w_${Date.now()}`,
      balance: Number(walletData.balance) || 0
    };
    setWallets((prev) => {
      const exists = prev.some((w) => w.id === savedWallet.id);
      return exists
        ? prev.map((w) => (w.id === savedWallet.id ? { ...w, ...savedWallet } : w))
        : [...prev, savedWallet];
    });
    triggerMascotReaction(
      'sparkle',
      `Đã cập nhật số dư "${savedWallet.name}": ${formatVND(savedWallet.balance)}!`
    );
    showToast(`Đã cập nhật nguồn tiền: ${savedWallet.name} (${formatVND(savedWallet.balance)})`);
    fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedWallet)
    }).catch(() => {});
  }, [showToast, triggerMascotReaction]);

  const handleDeleteWallet = useCallback((walletId) => {
    hasLocalEditsRef.current = true;
    setWallets((prev) => prev.filter((w) => w.id !== walletId));
    showToast('Đã xóa ví nguồn tiền');
    fetch(`/api/wallets/${walletId}`, { method: 'DELETE' }).catch(() => {});
  }, [showToast]);

  const handleTransferWallets = useCallback((transferData) => {
    hasLocalEditsRef.current = true;
    const amt = Number(transferData.amount) || 0;
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === transferData.from_wallet_id) {
          return { ...w, balance: (Number(w.balance) || 0) - amt };
        }
        if (w.id === transferData.to_wallet_id) {
          return { ...w, balance: (Number(w.balance) || 0) + amt };
        }
        return w;
      })
    );
    showToast(`Đã chuyển ${formatVND(amt)} giữa các ví`);
    fetch('/api/wallets/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData)
    }).catch(() => {});
  }, [showToast]);

  const handleSaveBudget = useCallback((category_id, customVal = null) => {
    hasLocalEditsRef.current = true;
    const limit =
      customVal !== null
        ? Number(customVal)
        : evaluateAmountExpression(budgetInputVal);
    setEditingBudgetCatId(null);
    setBudgets((prev) => {
      const exists = prev.some((b) => b.category_id === category_id);
      if (exists) {
        return prev.map((b) => (b.category_id === category_id ? { ...b, monthly_limit: limit } : b));
      }
      return [...prev, { category_id, monthly_limit: limit }];
    });
    showToast(
      limit > 0
        ? `Đã đặt định mức ngân sách: ${formatVND(limit)}`
        : 'Đã xóa định mức ngân sách'
    );
    fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id, monthly_limit: limit })
    }).catch(() => {});
  }, [budgetInputVal, showToast]);

  const handleApplyBulkBudgets = useCallback((budgetList) => {
    hasLocalEditsRef.current = true;
    setBudgets(budgetList);
    confetti({ particleCount: 45, spread: 55, origin: { y: 0.7 } });
    triggerMascotReaction(
      'sparkle',
      'Đã phân bổ ngân sách chi tiết cho toàn bộ các mục sinh hoạt trong tháng!'
    );
    showToast('🎯 Đã áp dụng bộ phân bổ ngân sách chi tiết cho toàn bộ các mục trong tháng!');
    fetch('/api/budgets/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgets: budgetList })
    }).catch(() => {});
  }, [triggerMascotReaction, showToast]);

  const handleContributeGoal = useCallback((goalId) => {
    hasLocalEditsRef.current = true;
    const val = evaluateAmountExpression(contributeAmount);
    if (val <= 0) return;
    setContributeGoalId(null);
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, current_amount: (Number(g.current_amount) || 0) + val } : g
      )
    );
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
    triggerMascotReaction(
      'heart',
      `Hoan hô! Bạn vừa tích lũy thêm ${formatVND(val)} vào hũ mục tiêu!`
    );
    showToast(`🎉 Đã tích lũy thêm ${formatVND(val)} vào hũ mục tiêu!`);
    fetch(`/api/goals/${goalId}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: val, wallet_id: contributeWalletId })
    }).catch(() => {});
  }, [contributeAmount, contributeWalletId, triggerMascotReaction, showToast]);

  const handleCreateGoal = useCallback((e) => {
    e.preventDefault();
    hasLocalEditsRef.current = true;
    if (!newGoalForm.name.trim()) return;
    const target = evaluateAmountExpression(newGoalForm.target_amount);
    if (target <= 0) {
      showToast('Vui lòng nhập số tiền mục tiêu lớn hơn 0 ₫');
      return;
    }
    const payload = {
      id: `goal_${Date.now()}`,
      name: newGoalForm.name.trim(),
      target_amount: target,
      current_amount: evaluateAmountExpression(newGoalForm.current_amount) || 0,
      deadline: newGoalForm.deadline || '2027-06-30',
      icon: newGoalForm.icon || 'Target',
      color: newGoalForm.color || '#10b981',
      note: newGoalForm.note.trim()
    };
    setNewGoalOpen(false);
    setGoals((prev) => [...prev, payload]);
    showToast(`Đã tạo hũ tiết kiệm: ${payload.name}`);
    fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }, [newGoalForm, showToast]);

  const handleDeleteGoal = useCallback((goalId) => {
    hasLocalEditsRef.current = true;
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    showToast('Đã xóa hũ mục tiêu');
    fetch(`/api/goals/${goalId}`, { method: 'DELETE' }).catch(() => {});
  }, [showToast]);

  const handlePayRecurring = useCallback((billId) => {
    hasLocalEditsRef.current = true;
    const curMonth = getCurrentMonthISO();
    const todayStr = getTodayISO();
    const bill = recurring.find((r) => r.id === billId);
    setRecurring((prev) =>
      prev.map((r) => (r.id === billId ? { ...r, last_paid_month: curMonth } : r))
    );
    if (bill) {
      handleSaveTransaction({
        title: bill.title,
        amount: Number(bill.amount) || 0,
        type: 'expense',
        category_id: bill.category_id || 'cat_housing',
        wallet_id: bill.wallet_id || 'w_bank',
        tx_date: todayStr,
        note: 'Thanh toán hóa đơn định kỳ hàng tháng',
        tags: ['địnhkỳ']
      });
    }
    fetch(`/api/recurring/${billId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: curMonth, tx_date: todayStr })
    }).catch(() => {});
  }, [recurring, handleSaveTransaction]);

  const handleCreateRecurring = useCallback((e) => {
    e.preventDefault();
    hasLocalEditsRef.current = true;
    if (!newRecurringForm.title.trim()) return;
    const amt = evaluateAmountExpression(newRecurringForm.amount);
    if (amt <= 0) {
      showToast('Vui lòng nhập số tiền hóa đơn định kỳ lớn hơn 0 ₫');
      return;
    }
    const payload = {
      id: `rec_${Date.now()}`,
      title: newRecurringForm.title.trim(),
      amount: amt,
      category_id: newRecurringForm.category_id || 'cat_housing',
      wallet_id: newRecurringForm.wallet_id || 'w_bank',
      due_day: Number(newRecurringForm.due_day) || 5,
      last_paid_month: ''
    };
    setNewRecurringOpen(false);
    setRecurring((prev) => [...prev, payload]);
    showToast(`Đã lưu hóa đơn định kỳ: ${payload.title}`);
    fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }, [newRecurringForm, showToast]);

  const handleDeleteRecurring = useCallback((billId) => {
    hasLocalEditsRef.current = true;
    setRecurring((prev) => prev.filter((r) => r.id !== billId));
    showToast('Đã xóa khoản định kỳ');
    fetch(`/api/recurring/${billId}`, { method: 'DELETE' }).catch(() => {});
  }, [showToast]);

  const handleResetClean = useCallback(() => {
    hasLocalEditsRef.current = true;
    setWallets(INITIAL_WALLETS);
    setCategories(INITIAL_CATEGORIES);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_GOALS);
    setRecurring(INITIAL_RECURRING);
    setTransactions(INITIAL_TRANSACTIONS);
    showToast('Đã làm mới toàn bộ dữ liệu về 0 ₫ (giữ nguyên danh mục & ví cơ bản)!');
    fetch('/api/reset-demo', { method: 'POST' }).catch(() => {});
  }, [showToast]);

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
    <div className="app-shell">
      {/* ====================================================================
          GLOBAL HEADER & MENU (Modeled directly on ngoctam169/iloveyou Header.jsx)
          ==================================================================== */}
      <header className="site-header editorial-global-header">
        <div className="header-inner">
          {/* Left: Brand Wordmark */}
          <button
            type="button"
            className="brand"
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <span className="brand-mark">FF</span>
            <span>FinFlow VN</span>
          </button>

          {/* Center: Clean Editorial Desktop Navigation + Dropdown Popover */}
          <nav className="desktop-nav simplified-desktop-nav" aria-label="Điều hướng chính">
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setUtilityMenuOpen(false);
                  }}
                  className={`nav-link ${active ? 'active' : ''}`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'transactions' && monthTransactions.length > 0 && (
                    <span className="pill" style={{ padding: '2px 7px', fontSize: '0.72rem' }}>
                      {monthTransactions.length}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Popover Menu (like 'Ôn luyện ▾' in ngoctam169/iloveyou) */}
            <div
              className="nav-dropdown"
              onMouseEnter={() => setUtilityMenuOpen(true)}
              onMouseLeave={() => setUtilityMenuOpen(false)}
            >
              <button
                type="button"
                className={`nav-link dropdown-trigger ${utilityMenuOpen ? 'active' : ''}`}
                onClick={() => setUtilityMenuOpen((prev) => !prev)}
              >
                <span>Tiện ích</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {utilityMenuOpen && (
                <div className="nav-popover">
                  <button
                    type="button"
                    className="popover-link"
                    onClick={() => {
                      setUtilityMenuOpen(false);
                      setEditingTx(null);
                      setTxModalOpen(true);
                    }}
                  >
                    <strong>Ghi thu / chi mới [Phím N]</strong>
                    <small>Mở biểu mẫu ghi chép chi tiết kèm tag & ghi chú</small>
                  </button>
                  <button
                    type="button"
                    className="popover-link"
                    onClick={() => {
                      setUtilityMenuOpen(false);
                      setEditingWallet(null);
                      setWalletModalMode('transfer');
                      setWalletModalOpen(true);
                    }}
                  >
                    <strong>Chuyển tiền giữa các ví</strong>
                    <small>Luân chuyển số dư giữa Tiền mặt, Ngân hàng & Ví điện tử</small>
                  </button>
                  <button
                    type="button"
                    className="popover-link"
                    onClick={() => {
                      setUtilityMenuOpen(false);
                      setEditingWallet(null);
                      setWalletModalMode('wallet');
                      setWalletModalOpen(true);
                    }}
                  >
                    <strong>Thêm ví / tài khoản mới</strong>
                    <small>Tạo thêm nguồn tiền hoặc cập nhật số dư thực tế</small>
                  </button>
                  <button
                    type="button"
                    className="popover-link"
                    onClick={() => {
                      setUtilityMenuOpen(false);
                      handleExportCSV();
                    }}
                  >
                    <strong>Xuất sổ giao dịch CSV</strong>
                    <small>Tải về bảng tính Excel của kỳ đang chọn</small>
                  </button>
                  <button
                    type="button"
                    className="popover-link"
                    onClick={() => {
                      setUtilityMenuOpen(false);
                      setMascotIdx((prev) => (prev + 1) % MASCOT_CATALOG.length);
                      setShowMascot(true);
                    }}
                  >
                    <strong>Đổi linh vật đồng hành ({mascotData.name})</strong>
                    <small>Chuyển đổi qua lại giữa 8 linh vật tương tác 3x3</small>
                  </button>
                  <button
                    type="button"
                    className="popover-link"
                    onClick={() => {
                      setUtilityMenuOpen(false);
                      setShowMascot((prev) => {
                        const next = !prev;
                        try {
                          localStorage.setItem('finflow_show_mascot', String(next));
                        } catch {}
                        return next;
                      });
                    }}
                  >
                    <strong>{showMascot ? 'Ẩn linh vật góc màn hình' : 'Hiện linh vật góc màn hình'}</strong>
                    <small>Bật hoặc tắt linh vật theo dõi con trỏ chuột</small>
                  </button>
                  <button
                    type="button"
                    className="popover-link"
                    onClick={() => {
                      setUtilityMenuOpen(false);
                      handleResetClean();
                    }}
                  >
                    <strong>Làm mới dữ liệu về 0 ₫</strong>
                    <small>Xóa các giao dịch đã nhập, giữ nguyên danh mục thiết yếu</small>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Period Selector, Hide Balance Icon, Primary CTA, Mobile Toggle */}
          <div className="header-actions">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedDay(null);
              }}
              aria-label="Chọn kỳ sổ cái"
              className="px-2.5 py-1.5 text-xs font-semibold font-mono-num cursor-pointer focus:outline-none"
              style={{
                height: '38px',
                borderRadius: '7px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--line)'
              }}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={cycleThemeMode}
              title="Đổi chế độ giao diện (Giấy Ấm / Sáng Pro / Tối Pro)"
              aria-label="Đổi chế độ giao diện"
              className="icon-btn"
              style={{ width: 'auto', padding: '0 10px', fontSize: '12px', fontWeight: 700, gap: '4px' }}
            >
              <span>
                {themeMode === 'paper' ? '📜 Giấy Ấm' : themeMode === 'pro-light' ? '☀️ Sáng Pro' : '🌙 Tối Pro'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHideBalance((prev) => !prev)}
              title="Ẩn/Hiện số tiền [Phím H]"
              aria-label="Ẩn hoặc hiện số dư"
              className="icon-btn"
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              className="btn primary small hidden sm:inline-flex"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi chi tiêu</span>
            </button>

            <button
              type="button"
              className="icon-btn mobile-menu-toggle"
              aria-label="Mở menu điều hướng"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu (modeled on simplified-mobile-menu in ngoctam169/iloveyou) */}
        {mobileMenuOpen && (
          <div className="mobile-menu simplified-mobile-menu">
            <div className="mobile-menu-group">
              <span className="mobile-group-title">Mục điều hướng chính</span>
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`mobile-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  {tab.code} · {tab.label}
                </button>
              ))}
            </div>
            <div className="mobile-menu-group">
              <span className="mobile-group-title">Thao tác nhanh</span>
              <button
                type="button"
                className="mobile-link"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
              >
                + Ghi nhận khoản thu / chi mới
              </button>
              <button
                type="button"
                className="mobile-link"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEditingWallet(null);
                  setWalletModalMode('transfer');
                  setWalletModalOpen(true);
                }}
              >
                ⇄ Chuyển tiền giữa các ví
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================
          MAIN CONTENT AREA
          ==================================================================== */}
      <main className="main-content">
        {/* ==================== TAB 1: DASHBOARD (TỔNG QUAN) ==================== */}
        {activeTab === 'dashboard' && (
          <div className="home-page">
            {/* 1. COMPACT SUMMARY STRIP */}
            <section className="stats-strip" aria-label="Chỉ số tài chính tổng quan">
              <div className="stats-inner">
                <div>
                  <span>Tổng số dư ({wallets.length} ví)</span>
                  <strong>{formatVND(totalNetWorth, hideBalance)}</strong>
                </div>
                <div>
                  <span>Thu nhập kỳ này</span>
                  <strong style={{ color: 'var(--green)' }}>
                    +{formatVND(monthIncome, hideBalance)}
                  </strong>
                </div>
                <div>
                  <span>Chi tiêu kỳ này</span>
                  <strong style={{ color: 'var(--red)' }}>
                    -{formatVND(monthExpense, hideBalance)}
                  </strong>
                </div>
                <div>
                  <span>Chênh lệch thu - chi</span>
                  <strong
                    style={{
                      color: monthNetCashflow >= 0 ? 'var(--blue)' : 'var(--red)'
                    }}
                  >
                    {monthNetCashflow >= 0 ? '+' : ''}
                    {formatVND(monthNetCashflow, hideBalance)}
                  </strong>
                </div>
              </div>
            </section>

            {/* 2. MAIN WORKSPACE */}
            <div className="section-shell py-5 space-y-5">
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

              <section className="grid-2">
                {/* Left Panel: Recent Transactions or Quick Category Tap */}
                <div className="panel">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-sm sm:text-base font-bold">
                      {monthTransactions.length > 0 ? 'Giao dịch gần đây' : 'Chọn nhanh danh mục'}
                    </h3>
                    <div className="flex items-center gap-2">
                      {monthTransactions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('transactions')}
                          className="text-xs font-bold underline cursor-pointer"
                        >
                          Tất cả ({monthTransactions.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTx(null);
                          setTxModalOpen(true);
                        }}
                        className="btn small"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>
                  </div>

                  {monthTransactions.length === 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                          className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <DynamicIcon name={cat.icon} className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {monthTransactions.slice(0, 8).map((tx) => {
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
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
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

                {/* Right Panel: Wallets & Quick Balance */}
                <div className="panel">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold">Ví của bạn</h3>
                      {showMascot && (
                        <div
                          className="cursor-pointer"
                          onClick={() => setMascotIdx((prev) => (prev + 1) % MASCOT_CATALOG.length)}
                          title={`${mascotData.name} — Bấm để đổi linh vật`}
                        >
                          <Mascot
                            directions={mascotData.directions}
                            reactions={mascotData.reactions}
                            size={34}
                            externalReaction={mascotReaction}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWallet(null);
                          setWalletModalMode('transfer');
                          setWalletModalOpen(true);
                        }}
                        className="btn secondary small"
                      >
                        ⇄ Chuyển ví
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWallet(null);
                          setWalletModalMode('wallet');
                          setWalletModalOpen(true);
                        }}
                        className="btn secondary small"
                      >
                        + Thêm ví
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {wallets.map((w) => {
                      const isQuickEditing = quickBalanceWalletId === w.id;
                      return (
                        <div
                          key={w.id}
                          className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isQuickEditing) {
                                setQuickBalanceWalletId(null);
                              } else {
                                setQuickBalanceWalletId(w.id);
                                setQuickBalanceInput(w.balance > 0 ? String(w.balance) : '');
                              }
                            }}
                            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${w.color}20`, color: w.color }}
                              >
                                <DynamicIcon name={w.icon} className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {w.name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {w.account_number}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs sm:text-sm font-extrabold font-mono-num text-slate-900 dark:text-white">
                                {formatVND(w.balance, hideBalance)}
                              </p>
                              <span className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                                {isQuickEditing ? 'Đóng ▲' : 'Sửa số dư'}
                              </span>
                            </div>
                          </button>

                          {isQuickEditing && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                              <div className="flex flex-wrap items-center gap-1">
                                {[
                                  { label: '500k', val: 500000 },
                                  { label: '2tr', val: 2000000 },
                                  { label: '5tr', val: 5000000 },
                                  { label: '10tr', val: 10000000 },
                                  { label: '20tr', val: 20000000 }
                                ].map((chip) => (
                                  <button
                                    key={chip.label}
                                    type="button"
                                    onClick={() => {
                                      handleSaveWallet({ ...w, balance: chip.val });
                                      setQuickBalanceWalletId(null);
                                    }}
                                    className="px-2 py-0.5 text-[11px] font-mono-num font-semibold rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                                  >
                                    {chip.label}
                                  </button>
                                ))}
                              </div>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const val = evaluateAmountExpression(quickBalanceInput);
                                  handleSaveWallet({ ...w, balance: val });
                                  setQuickBalanceWalletId(null);
                                }}
                                className="flex items-center gap-1.5"
                              >
                                <input
                                  type="text"
                                  value={quickBalanceInput}
                                  onChange={(e) => setQuickBalanceInput(e.target.value)}
                                  placeholder="Nhập số dư (VD: 3.5tr, 800k)..."
                                  autoFocus
                                  className="flex-1 px-2.5 py-1.5 text-xs font-mono-num font-bold"
                                />
                                <button type="submit" className="btn small">
                                  Lưu
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Optional Charts only when transactions exist */}
              {monthTransactions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7 panel">
                    <h3 className="text-sm font-bold mb-2">Dòng tiền theo ngày</h3>
                    <CashflowBarChart
                      transactions={transactions}
                      selectedMonth={selectedMonth}
                      hideBalance={hideBalance}
                      darkMode={false}
                    />
                  </div>
                  <div className="lg:col-span-5 panel">
                    <h3 className="text-sm font-bold mb-2">Cơ cấu chi tiêu</h3>
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
              )}
            </div>
          </div>
        )}

          {/* ==================== TAB 2: SỔ GIAO DỊCH (TRANSACTIONS LEDGER) ==================== */}
          {activeTab === 'transactions' && (
            <div className="section-shell py-7 space-y-5">
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
                                        tx_date: getTodayISO()
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
            <div className="section-shell py-7 space-y-6">
              {/* Smart Income Allocator at Top of Budget Tab */}
              <SmartIncomeAllocator
                categories={categories}
                hideBalance={hideBalance}
                onApplyBudgets={handleApplyBulkBudgets}
                onRecordIncome={(amountVal) =>
                  handleSaveTransaction({
                    title: `Thu nhập tháng ${selectedMonth === 'ALL' ? getCurrentMonthISO().split('-').reverse().join('/') : selectedMonth.split('-').reverse().join('/')}`,
                    amount: amountVal,
                    type: 'income',
                    category_id: 'cat_salary',
                    wallet_id: 'w_bank',
                    tx_date: getTodayISO(),
                    note: 'Ghi nhận từ Bộ Phân Bổ Chi Tiêu Tháng',
                    tags: ['thunhập']
                  })
                }
              />

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
            <div className="section-shell py-7 space-y-6">
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
                      const isPaid = bill.last_paid_month === getCurrentMonthISO();
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
            <div className="section-shell py-7 space-y-6">
              {/* 1. Month-over-Month Comparison Module */}
              <MonthComparisonModule
                transactions={transactions}
                categories={categories}
                currentMonth={selectedMonth}
                hideBalance={hideBalance}
                onQuickAddPastMonth={(defaultDate) => {
                  setEditingTx({
                    title: '',
                    type: 'expense',
                    category_id: 'cat_food',
                    wallet_id: 'w_cash',
                    tx_date: defaultDate
                  });
                  setTxModalOpen(true);
                }}
              />

              {/* 2. Life Optimization Toolkit */}
              <LifeOptimizationToolkit
                totalNetWorth={totalNetWorth}
                totalMonthlyBudget={totalMonthlyBudget}
                hideBalance={hideBalance}
              />

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
                      onClick={() => fetchCloudState(true)}
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

      {/* EDITORIAL FOOTER (Modeled on ngoctam169/iloveyou Footer.jsx) */}
      <footer className="site-footer editorial-footer">
        <div className="footer-inner simplified-footer-inner">
          <div>
            <div className="brand footer-brand">
              <span className="brand-mark">FF</span>
              <span>FinFlow VN</span>
            </div>
            <p className="footer-copy">
              Sổ cái quản lý chi tiêu, phân bổ ngân sách tự động và tối ưu tài chính cá nhân mỗi ngày.
            </p>
          </div>
          <div className="footer-links">
            {NAV_TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="footer-meta">
            <span>Cloud PostgreSQL (ap-southeast-1)</span>
            <p>Phím tắt nhanh: [N] Ghi giao dịch mới · [H] Ẩn/Hiện số dư</p>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR (Modeled on simplified-bottom-nav in ngoctam169/iloveyou) */}
      <nav className="mobile-bottom-nav simplified-bottom-nav" aria-label="Điều hướng di động">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.shortLabel || tab.label}</span>
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
