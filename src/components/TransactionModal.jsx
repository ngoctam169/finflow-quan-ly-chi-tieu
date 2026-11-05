import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, Calendar, Tag, FileText, Plus } from 'lucide-react';
import { evaluateAmountExpression, formatVND } from '../utils/smartParser.js';
import { DynamicIcon } from './IconMap.jsx';

const QUICK_AMOUNTS = [
  { label: '35k', value: 35000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1 triệu', value: 1000000 },
  { label: '5 triệu', value: 5000000 }
];

export function TransactionModal({
  isOpen,
  onClose,
  initialData,
  categories,
  wallets,
  onSave,
  onCreateCategory
}) {
  const isEditing = Boolean(initialData?.id);

  const [type, setType] = useState('expense');
  const [amountInput, setAmountInput] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat_food');
  const [walletId, setWalletId] = useState('w_cash');
  const [txDate, setTxDate] = useState('2026-11-05');
  const [note, setNote] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [error, setError] = useState('');
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatRule, setNewCatRule] = useState('needs');

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
    setTxDate(initialData?.tx_date || '2026-11-05');
    setNote(initialData?.note || '');
    setTagsText(Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : '');
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
      group_rule: type === 'income' ? 'income' : newCatRule
    });
    if (created?.id) {
      setCategoryId(created.id);
    }
    setNewCatName('');
    setNewCatOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (evaluatedAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0 ₫');
      return;
    }
    const selectedCat = categories.find((c) => c.id === categoryId);
    const finalTitle = title.trim() || selectedCat?.name || 'Giao dịch mới';
    const tags = tagsText
      .split(',')
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean);

    await onSave({
      id: initialData?.id,
      title: finalTitle,
      amount: evaluatedAmount,
      type,
      category_id: categoryId,
      wallet_id: walletId,
      tx_date: txDate,
      note: note.trim(),
      tags
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isEditing ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hỗ trợ gõ nhanh 50k, 1.5tr hoặc phép cộng 35k+15k
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Type Segmented Control */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Khoản Chi Tiêu (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Khoản Thu Nhập (+)
            </button>
          </div>

          {/* Amount Input & Quick Chips */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-500" />
                Số tiền giao dịch (VNĐ)
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
              placeholder="Nhập 55k, 1.5tr hoặc 45000 + 15000..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={() => setAmountInput((prev) => (prev ? `${prev}000` : '50000'))}
                className="px-2.5 py-1 rounded-lg text-xs font-mono-num font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
              >
                +000
              </button>
              {QUICK_AMOUNTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setAmountInput(String(item.value))}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400 transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Mô tả / Tên giao dịch
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Ăn trưa phở bò, Đổ xăng, Tiền lương..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Ngày giao dịch
              </label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Chọn nhanh:</span>
            {[
              { label: 'Hôm nay (05/11)', date: '2026-11-05' },
              { label: 'Hôm qua (04/11)', date: '2026-11-04' },
              { label: 'Hôm kia (03/11)', date: '2026-11-03' }
            ].map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => setTxDate(d.date)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  txDate === d.date
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Category Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Chọn danh mục có sẵn ({filteredCategories.length})
              </label>
              {onCreateCategory && (
                <button
                  type="button"
                  onClick={() => setNewCatOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo danh mục mới
                </button>
              )}
            </div>

            {newCatOpen && (
              <div className="mb-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Tên danh mục (VD: Thú cưng, Trả góp, Bỉm sữa...)"
                  className="flex-1 min-w-[180px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
                {type === 'expense' && (
                  <select
                    value={newCatRule}
                    onChange={(e) => setNewCatRule(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="needs">Nhóm Thiết yếu (50%)</option>
                    <option value="wants">Nhóm Mong muốn (30%)</option>
                    <option value="savings">Nhóm Tích lũy (20%)</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallet Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Nguồn tiền / Ví thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2">
              {wallets.map((w) => {
                const selected = walletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWalletId(w.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${w.color}20`, color: w.color }}
                      >
                        <DynamicIcon name={w.icon} className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {w.name}
                        </p>
                        <p className="text-[11px] font-mono-num text-slate-500 truncate">
                          {formatVND(w.balance)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Ghi chú thêm
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú địa điểm, người đi cùng..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Nhãn (Tags, cách nhau dấu phẩy)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="côngsở, giađình, căntin..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Submit Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Lưu thay đổi' : 'Lưu giao dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
