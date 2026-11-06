import React, { useState, useRef, useMemo } from 'react';
import { Plus, Check, SlidersHorizontal, ArrowRight, Zap } from 'lucide-react';
import {
  parseNaturalTransaction,
  formatVND,
  formatCompactVND,
  formatDateVN,
  getTodayISO
} from '../utils/smartParser.js';
import { DynamicIcon } from './IconMap.jsx';

const QUICK_AMOUNT_PRESETS_BY_CAT = {
  cat_food: [35000, 45000, 60000, 120000],
  cat_grocery: [100000, 200000, 350000, 500000],
  cat_coffee: [25000, 35000, 50000, 65000],
  cat_transport: [50000, 70000, 100000, 200000],
  cat_housing: [300000, 500000, 3500000, 4500000],
  cat_shopping: [150000, 300000, 500000, 1000000],
  cat_health: [100000, 250000, 500000, 1000000],
  cat_salary: [10000000, 15000000, 20000000, 25000000]
};

export const QuickAddBar = React.memo(function QuickAddBar({
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

  const todayStr = getTodayISO();

  const parsed = useMemo(
    () => (text.trim() ? parseNaturalTransaction(text, categories, wallets, todayStr) : null),
    [text, categories, wallets, todayStr]
  );

  const commitTransaction = (txPayload) => {
    setJustAdded(`${txPayload.title} (${formatCompactVND(txPayload.amount)})`);
    setText('');
    setActiveHint('');
    onQuickSubmit(txPayload);
    setTimeout(() => setJustAdded(null), 2600);
  };

  const handleSubmit = (e) => {
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

    commitTransaction({
      title: parsed.title,
      amount: parsed.amount,
      type: parsed.type,
      category_id: parsed.category_id,
      wallet_id: parsed.wallet_id,
      tx_date: parsed.tx_date,
      note: '',
      tags: []
    });
  };

  const handleInstantPresetSave = (presetAmount) => {
    if (!parsed) return;
    commitTransaction({
      title: parsed.title || parsed.category?.name || 'Giao dịch nhanh',
      amount: presetAmount,
      type: parsed.type,
      category_id: parsed.category_id,
      wallet_id: parsed.wallet_id,
      tx_date: parsed.tx_date,
      note: '',
      tags: []
    });
  };

  const handleSuggestionClick = (tpl) => {
    const draft = tpl.draftText || `${tpl.label.replace(/^[^\s]+\s/, '')} `;
    setText(draft);
    setActiveHint(
      tpl.placeholderHint || 'Chạm mức tiền bên dưới để lưu ngay hoặc tự gõ số tiền rồi nhấn Enter'
    );
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = draft.length;
        inputRef.current.setSelectionRange(len, len);
      }
    });
  };

  const suggestedAmounts = parsed
    ? QUICK_AMOUNT_PRESETS_BY_CAT[parsed.category_id] || [35000, 50000, 100000, 200000]
    : [];

  return (
    <div className="panel" style={{ padding: '16px 18px' }}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <strong className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          Ghi nhanh thu chi
        </strong>
        <button
          type="button"
          onClick={() => onOpenFullModal()}
          className="btn secondary small"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Chọn danh mục</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Gõ nhanh: Ăn tối 50k, Đổ xăng 70k, Lương 15tr..."
            className="flex-1 px-3.5 py-2.5 text-sm font-medium"
            style={{ minHeight: 42 }}
          />
          <button type="submit" className="btn shrink-0">
            <Plus className="w-4 h-4" />
            <span>{parsed?.isValid ? 'Lưu ngay' : 'Thêm'}</span>
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
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 font-semibold mr-1"
                    style={{ color: 'var(--primary-dark)' }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    1-Chạm lưu ngay:
                  </span>
                  {suggestedAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleInstantPresetSave(amt)}
                      className="px-2.5 py-1 font-mono-num font-bold text-xs cursor-pointer transition"
                      style={{
                        borderRadius: 6,
                        backgroundColor: 'var(--primary)',
                        color: '#fff',
                        border: '1px solid var(--primary)'
                      }}
                    >
                      +{formatCompactVND(amt)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {quickTemplates.map((tpl, idx) => {
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
              {tpl.label}
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
});
