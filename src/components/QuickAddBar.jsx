import React, { useState } from 'react';
import { Sparkles, Plus, ArrowRight, Zap, Check, SlidersHorizontal } from 'lucide-react';
import { parseNaturalTransaction, formatVND, formatDateVN } from '../utils/smartParser.js';
import { DynamicIcon } from './IconMap.jsx';

export function QuickAddBar({
  categories,
  wallets,
  quickTemplates = [],
  onQuickSubmit,
  onOpenFullModal
}) {
  const [text, setText] = useState('');
  const [justAdded, setJustAdded] = useState(null);

  const parsed = text.trim()
    ? parseNaturalTransaction(text, categories, wallets, '2026-11-05')
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parsed || !parsed.isValid) {
      // Open full modal pre-filled with the title if amount wasn't typed
      onOpenFullModal({
        title: text.trim(),
        category_id: parsed?.category_id || 'cat_food',
        wallet_id: parsed?.wallet_id || 'w_cash',
        type: parsed?.type || 'expense'
      });
      return;
    }

    await onQuickSubmit({
      title: parsed.title,
      amount: parsed.amount,
      type: parsed.type,
      category_id: parsed.category_id,
      wallet_id: parsed.wallet_id,
      tx_date: parsed.tx_date,
      note: 'Ghi nhanh thông minh 3 giây',
      tags: ['ghinhanh']
    });

    setJustAdded(parsed.title);
    setText('');
    setTimeout(() => setJustAdded(null), 2400);
  };

  const handleTemplateClick = async (tpl) => {
    await onQuickSubmit({
      title: tpl.text.replace(/\s+\d+k.*$/i, ''),
      amount: tpl.amount,
      type: tpl.type || 'expense',
      category_id: tpl.category_id,
      wallet_id: tpl.wallet_id,
      tx_date: '2026-11-05',
      note: 'Ghi nhanh 1 chạm từ mẫu thường dùng',
      tags: ['1chạm']
    });
    setJustAdded(tpl.label);
    setTimeout(() => setJustAdded(null), 2000);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-sm p-4 sm:p-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Ghi Nhanh Thông Minh 3 Giây
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Tự động nhận diện số tiền & danh mục
              </span>
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenFullModal()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Mở bảng nhập chi tiết (Phím N)
        </button>
      </div>

      {/* Smart Natural Language Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Gõ tự nhiên: VD 'Ăn trưa phở bò 65k', 'Cà phê 45k momo', 'Lương 25tr'..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-sm shadow-emerald-600/20 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi ngay</span>
            <ArrowRight className="w-4 h-4 opacity-80" />
          </button>
        </div>

        {/* Real-time Smart Parser Preview Pill */}
        {parsed && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs animate-fadeIn">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Nhận diện tự động:
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg font-bold ${
                  parsed.type === 'income'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                }`}
              >
                {parsed.type === 'income' ? '+ Thu nhập' : '- Chi tiêu'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                “{parsed.title}”
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold"
                style={{
                  backgroundColor: `${parsed.category?.color || '#10b981'}20`,
                  color: parsed.category?.color || '#10b981'
                }}
              >
                <DynamicIcon name={parsed.category?.icon} className="w-3.5 h-3.5" />
                {parsed.category?.name}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                Ví: {parsed.wallet?.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                • {formatDateVN(parsed.tx_date)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {parsed.isValid ? (
                <span className="text-sm font-extrabold font-mono-num text-emerald-700 dark:text-emerald-300">
                  {formatVND(parsed.amount)}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Hãy thêm số tiền (VD: 50k, 1.2tr)
                </span>
              )}
            </div>
          </div>
        )}
      </form>

      {/* 1-Click Quick Templates */}
      <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">
          Chạm 1 lần để ghi:
        </span>
        {quickTemplates.map((tpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleTemplateClick(tpl)}
            className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200/70 dark:border-slate-700 hover:border-emerald-300 transition shrink-0 cursor-pointer"
          >
            {tpl.label}
          </button>
        ))}
        {justAdded && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-auto shrink-0">
            <Check className="w-3.5 h-3.5" />
            Đã ghi: {justAdded}
          </span>
        )}
      </div>
    </div>
  );
}
