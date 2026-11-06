import React, { useState, useRef } from 'react';
import { Plus, Check, SlidersHorizontal } from 'lucide-react';
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
  const [activeHint, setActiveHint] = useState('');
  const [justAdded, setJustAdded] = useState(null);
  const inputRef = useRef(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const parsed = text.trim()
    ? parseNaturalTransaction(text, categories, wallets, todayStr)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parsed || !parsed.isValid) {
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
      note: '',
      tags: []
    });

    setJustAdded(parsed.title);
    setText('');
    setActiveHint('');
    setTimeout(() => setJustAdded(null), 2400);
  };

  const handleSuggestionClick = (tpl) => {
    const draft = tpl.draftText || `${tpl.label.replace(/^[^\s]+\s/, '')} `;
    setText(draft);
    setActiveHint(
      tpl.placeholderHint || 'Gõ tiếp số tiền thực tế của bạn (VD: 45k, 150k) rồi nhấn Enter'
    );
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = draft.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 10);
  };

  return (
    <section
      style={{
        borderTop: '2px solid var(--rule-strong)',
        borderBottom: '1px solid var(--rule-strong)',
        backgroundColor: 'var(--surface)'
      }}
      className="p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <span
            className="font-mono-num text-xs font-extrabold"
            style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}
          >
            GHI SỔ NHANH
          </span>
          <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--ink)' }}>
            Nhập ngôn ngữ tự nhiên trong 3 giây hoặc chọn mẫu gợi ý
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onOpenFullModal()}
          className="hs-btn-outline inline-flex items-center gap-1.5 text-xs px-3 py-1.5 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Biểu mẫu chi tiết [Phím N]</span>
        </button>
      </div>

      {/* Smart Natural Language Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="flex flex-col sm:flex-row"
          style={{ border: '2px solid var(--rule-strong)', backgroundColor: 'var(--bg)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Gõ khoản thu/chi: Ăn trưa 45k, Đi chợ 120k, Đổ xăng 70k, Lương tháng 18tr..."
            className="flex-1 px-4 py-3.5 text-sm sm:text-base font-medium focus:outline-none"
            style={{ color: 'var(--ink)', backgroundColor: 'transparent' }}
          />
          <button
            type="submit"
            className="hs-btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{parsed?.isValid ? 'Ghi sổ ngay' : 'Điền số tiền'}</span>
          </button>
        </div>

        {/* Real-time Smart Parser Preview */}
        {parsed && (
          <div
            className="mt-3 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{
              backgroundColor: 'var(--surface-alt)',
              borderLeft: '3px solid var(--accent)'
            }}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-num font-bold" style={{ color: 'var(--mute)' }}>
                PHÂN TÍCH TỰ ĐỘNG:
              </span>
              <span
                className="px-2 py-0.5 font-mono-num font-bold"
                style={{
                  backgroundColor: parsed.type === 'income' ? 'var(--positive)' : 'var(--accent)',
                  color: '#fff'
                }}
              >
                {parsed.type === 'income' ? '+ THU NHẬP' : '- CHI TIÊU'}
              </span>
              <span className="font-bold" style={{ color: 'var(--ink)' }}>
                “{parsed.title}”
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 font-semibold"
                style={{ border: '1px solid var(--rule)' }}
              >
                <DynamicIcon name={parsed.category?.icon} className="w-3.5 h-3.5" />
                {parsed.category?.name}
              </span>
              <span className="font-medium" style={{ color: 'var(--mute)' }}>
                Ví: {parsed.wallet?.name} • {formatDateVN(parsed.tx_date)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {parsed.isValid ? (
                <span
                  className="text-sm font-extrabold font-mono-num"
                  style={{ color: 'var(--positive)' }}
                >
                  {formatVND(parsed.amount)} [Nhấn Enter]
                </span>
              ) : (
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                  {activeHint || 'Gõ thêm số tiền thực tế của bạn (VD: 45k, 200k, 1.5tr)'}
                </span>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Everyday Life Suggestion Tags (Clean typographic tags without emoji clutter) */}
      <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1">
        <span
          className="text-xs font-mono-num font-bold shrink-0"
          style={{ color: 'var(--mute)' }}
        >
          GỢI Ý MỤC THIẾT YẾU:
        </span>
        {quickTemplates.map((tpl, idx) => {
          const cleanLabel = tpl.label.replace(/^[^\p{L}\p{N}]+\s*/u, '');
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(tpl)}
              style={{
                border: '1px solid var(--rule)',
                backgroundColor: 'var(--bg)',
                color: 'var(--ink)'
              }}
              className="px-3 py-1 text-xs font-semibold hover:opacity-80 transition shrink-0 cursor-pointer"
            >
              + {cleanLabel}
            </button>
          );
        })}
        {justAdded && (
          <span
            className="inline-flex items-center gap-1 text-xs font-bold ml-auto shrink-0"
            style={{ color: 'var(--positive)' }}
          >
            <Check className="w-3.5 h-3.5" />
            Đã ghi sổ: {justAdded}
          </span>
        )}
      </div>
    </section>
  );
}
