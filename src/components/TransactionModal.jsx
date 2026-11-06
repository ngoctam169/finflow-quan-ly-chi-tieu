import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Plus } from 'lucide-react';
import {
  evaluateAmountExpression,
  formatVND,
  getTodayISO,
  getOffsetDateISO,
  formatShortDM
} from '../utils/smartParser.js';
import { DynamicIcon } from './IconMap.jsx';

const QUICK_AMOUNTS = [
  { label: '35k', value: 35000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 }
];

export const TransactionModal = React.memo(function TransactionModal({
  isOpen,
  onClose,
  initialData,
  categories,
  wallets,
  onSave,
  onCreateCategory
}) {
  const isEditing = Boolean(initialData?.id);
  const todayISO = getTodayISO();
  const yesterdayISO = getOffsetDateISO(-1);
  const twoDaysAgoISO = getOffsetDateISO(-2);

  const [type, setType] = useState('expense');
  const [amountInput, setAmountInput] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat_food');
  const [walletId, setWalletId] = useState('w_cash');
  const [txDate, setTxDate] = useState(todayISO);
  const [error, setError] = useState('');
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const initType = initialData?.type || 'expense';
    setType(initType);
    setAmountInput(initialData?.amount ? String(initialData.amount) : '');
    setTitle(initialData?.title || '');
    setCategoryId(
      initialData?.category_id || (initType === 'income' ? 'cat_salary' : 'cat_food')
    );
    setWalletId(initialData?.wallet_id || (initType === 'income' ? 'w_bank' : 'w_cash'));
    setTxDate(initialData?.tx_date || getTodayISO());
    setError('');
    setNewCatOpen(false);
    setNewCatName('');
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const evaluatedAmount = evaluateAmountExpression(amountInput);
  const filteredCategories = categories.filter((c) => c.type === type);

  const handleTypeSwitch = (newType) => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType);
    if (firstCat) setCategoryId(firstCat.id);
    if (newType === 'income' && walletId === 'w_cash') setWalletId('w_bank');
  };

  const handleAddCustomCategory = async () => {
    if (!newCatName.trim() || !onCreateCategory) return;
    const created = await onCreateCategory({
      name: newCatName.trim(),
      type,
      icon: type === 'income' ? 'Sparkles' : 'Tag',
      color: type === 'income' ? '#10b981' : '#06b6d4',
      group_rule: type === 'income' ? 'income' : 'needs'
    });
    if (created?.id) {
      setCategoryId(created.id);
    }
    setNewCatName('');
    setNewCatOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (evaluatedAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0 ₫');
      return;
    }
    const selectedCat = categories.find((c) => c.id === categoryId);
    const finalTitle = title.trim() || selectedCat?.name || 'Giao dịch mới';

    onClose();
    onSave({
      id: initialData?.id,
      title: finalTitle,
      amount: evaluatedAmount,
      type,
      category_id: categoryId,
      wallet_id: walletId,
      tx_date: txDate,
      note: '',
      tags: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Sửa giao dịch' : 'Thêm giao dịch'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
          {/* Type Segmented Control */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Chi tiêu (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Thu nhập (+)
            </button>
          </div>

          {/* Amount Input & Quick Chips */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Số tiền
              </label>
              <span
                className={`text-sm font-extrabold font-mono-num ${
                  type === 'income'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {type === 'income' ? '+' : '-'}
                {formatVND(evaluatedAmount)}
              </span>
            </div>

            <input
              type="text"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setError('');
              }}
              placeholder="VD: 50k, 150k, 1.5tr..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setAmountInput((prev) => (prev ? `${prev}000` : '50000'))}
                className="px-2 py-1 rounded-md text-xs font-mono-num font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer"
              >
                +000
              </button>
              {QUICK_AMOUNTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setAmountInput(String(item.value))}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Grid (3-column compact, zero truncation) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Danh mục
              </label>
              {onCreateCategory && (
                <button
                  type="button"
                  onClick={() => setNewCatOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm mục
                </button>
              )}
            </div>

            {newCatOpen && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Tên mục mới (VD: Thú cưng...)"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {filteredCategories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-xl border text-left transition cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallet Selector (Compact 2x2 or 4-col) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Ví thanh toán
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {wallets.map((w) => {
                const selected = walletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWalletId(w.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${w.color}20`, color: w.color }}
                    >
                      <DynamicIcon name={w.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {w.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Optional Description */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                {[
                  { label: `Hôm nay (${formatShortDM(todayISO)})`, date: todayISO },
                  { label: `Hôm qua (${formatShortDM(yesterdayISO)})`, date: yesterdayISO },
                  { label: `${formatShortDM(twoDaysAgoISO)}`, date: twoDaysAgoISO }
                ].map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setTxDate(d.date)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      txDate === d.date
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                aria-label="Chọn ngày khác"
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono-num"
              />
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ghi chú món (không bắt buộc — VD: Ăn tối, Đổ xăng...)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Submit Footer */}
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Lưu thay đổi' : 'Lưu giao dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
