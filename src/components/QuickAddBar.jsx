import React, { useState, useRef } from 'react';
import { Plus, Check, SlidersHorizontal, ArrowRight } from 'lucide-react';
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
    <div className="panel" style={{ padding: '20px 22px' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <span className="overline" style={{ marginBottom: 2 }}>
            QUICK LEDGER INPUT · NHẬP NHANH 3 GIÂY
          </span>
          <strong className="serif-heading text-base font-medium">
            Gõ nội dung kèm số tiền hoặc chọn mục gợi ý thiết yếu
          </strong>
        </div>
        <button
          type="button"
          onClick={() => onOpenFullModal()}
          className="btn secondary small"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Biểu mẫu đầy đủ [N]</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Ăn trưa 45k, Đi chợ 120k, Đổ xăng 70k, Lương tháng 18tr..."
            className="flex-1 px-3.5 py-2.5 text-sm font-medium"
            style={{ minHeight: 44 }}
          />
          <button type="submit" className="btn shrink-0">
            <Plus className="w-4 h-4" />
            <span>{parsed?.isValid ? 'Ghi sổ ngay' : 'Điền số tiền'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {parsed && (
          <div
            className="mt-3 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderRadius: 7,
              border: '1px solid var(--line)'
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2 py-0.5 font-mono-num font-semibold"
                style={{
                  borderRadius: 5,
                  backgroundColor:
                    parsed.type === 'income' ? 'var(--green-soft)' : 'var(--primary-soft)',
                  color: parsed.type === 'income' ? 'var(--green)' : 'var(--primary-dark)'
                }}
              >
                {parsed.type === 'income' ? '+ Thu nhập' : '- Chi tiêu'}
              </span>
              <strong style={{ color: 'var(--text)' }}>“{parsed.title}”</strong>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 font-medium"
                style={{
                  borderRadius: 5,
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--line)'
                }}
              >
                <DynamicIcon name={parsed.category?.icon} className="w-3.5 h-3.5" />
                {parsed.category?.name}
              </span>
              <span style={{ color: 'var(--muted)' }}>
                Ví: {parsed.wallet?.name} · {formatDateVN(parsed.tx_date)}
              </span>
            </div>

            <div>
              {parsed.isValid ? (
                <span
                  className="font-mono-num font-bold text-sm"
                  style={{ color: 'var(--green)' }}
                >
                  {formatVND(parsed.amount)} (Nhấn Enter)
                </span>
              ) : (
                <span className="font-semibold" style={{ color: 'var(--primary-dark)' }}>
                  {activeHint || 'Gõ thêm số tiền thực tế của bạn (VD: 45k, 200k, 1.5tr)'}
                </span>
              )}
            </div>
          </div>
        )}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className="font-mono-num text-[11px] shrink-0 mr-1"
          style={{ color: 'var(--muted)' }}
        >
          GỢI Ý:
        </span>
        {quickTemplates.map((tpl, idx) => {
          const cleanLabel = tpl.label.replace(/^[^\p{L}\p{N}]+\s*/u, '');
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(tpl)}
              className="px-2.5 py-1 text-xs font-medium shrink-0 cursor-pointer transition"
              style={{
                borderRadius: 6,
                border: '1px solid var(--line)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)'
              }}
            >
              {cleanLabel}
            </button>
          );
        })}
        {justAdded && (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold ml-auto shrink-0"
            style={{ color: 'var(--green)' }}
          >
            <Check className="w-3.5 h-3.5" />
            Đã lưu: {justAdded}
          </span>
        )}
      </div>
    </div>
  );
}
