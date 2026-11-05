import React, { useState } from 'react';
import { formatVND, formatCompactVND } from '../utils/smartParser.js';
import { DynamicIcon } from './IconMap.jsx';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function CashflowBarChart({ transactions, selectedMonth, hideBalance, darkMode }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Group by date for the selected month (or last 14 active days)
  const dayMap = new Map();
  const filtered = transactions.filter((t) =>
    selectedMonth === 'ALL' ? true : String(t.tx_date).startsWith(selectedMonth)
  );

  for (const tx of filtered) {
    const d = tx.tx_date;
    if (!dayMap.has(d)) {
      dayMap.set(d, { date: d, income: 0, expense: 0 });
    }
    const entry = dayMap.get(d);
    if (tx.type === 'income') entry.income += Number(tx.amount) || 0;
    else entry.expense += Number(tx.amount) || 0;
  }

  const days = Array.from(dayMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12);

  if (days.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-400">
        Chưa có dữ liệu giao dịch trong kỳ này
      </div>
    );
  }

  const maxVal = Math.max(
    100000,
    ...days.map((d) => Math.max(d.income, d.expense))
  );

  return (
    <div className="relative pt-4">
      {/* Legend */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Thu nhập
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Chi tiêu
          </span>
        </div>
        {hoveredIdx !== null && days[hoveredIdx] ? (
          <div className="font-mono-num text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-700 shadow-sm">
            <span className="font-semibold mr-2">
              {days[hoveredIdx].date.split('-').reverse().slice(0, 2).join('/')}
            </span>
            {days[hoveredIdx].income > 0 && (
              <span className="text-emerald-300 mr-2">
                +{formatCompactVND(days[hoveredIdx].income, hideBalance)}
              </span>
            )}
            {days[hoveredIdx].expense > 0 && (
              <span className="text-rose-300">
                -{formatCompactVND(days[hoveredIdx].expense, hideBalance)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">Di chuột vào cột để xem chi tiết</span>
        )}
      </div>

      {/* Bars */}
      <div className="h-44 flex items-end gap-2 sm:gap-3 pt-4 pb-1 border-b border-slate-200/80 dark:border-slate-700/70">
        {days.map((d, idx) => {
          const incPct = Math.max(d.income > 0 ? 8 : 0, Math.round((d.income / maxVal) * 100));
          const expPct = Math.max(d.expense > 0 ? 8 : 0, Math.round((d.expense / maxVal) * 100));
          const shortDate = d.date.split('-').slice(1).reverse().join('/');
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={d.date}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
            >
              <div className="w-full flex items-end justify-center gap-1 h-36 px-0.5">
                {d.income > 0 && (
                  <div
                    style={{ height: `${incPct}%` }}
                    className={`w-full max-w-[16px] rounded-t-md transition-all duration-300 ${
                      isHovered
                        ? 'bg-emerald-400 shadow-md shadow-emerald-500/30 scale-y-105'
                        : 'bg-emerald-500/85'
                    }`}
                  />
                )}
                {d.expense > 0 && (
                  <div
                    style={{ height: `${expPct}%` }}
                    className={`w-full max-w-[16px] rounded-t-md transition-all duration-300 ${
                      isHovered
                        ? 'bg-rose-400 shadow-md shadow-rose-500/30 scale-y-105'
                        : 'bg-rose-500/85'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-[11px] font-mono-num transition-colors ${
                  isHovered
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {shortDate}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryDonutChart({
  transactions,
  categories,
  selectedMonth,
  hideBalance,
  onSelectCategory
}) {
  const [activeCatId, setActiveCatId] = useState(null);

  const expenses = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      (selectedMonth === 'ALL' ? true : String(t.tx_date).startsWith(selectedMonth))
  );

  const totalExpense = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const catTotals = new Map();
  for (const tx of expenses) {
    catTotals.set(tx.category_id, (catTotals.get(tx.category_id) || 0) + (Number(tx.amount) || 0));
  }

  const items = Array.from(catTotals.entries())
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId) || {
        id: catId,
        name: 'Khác',
        color: '#64748b',
        icon: 'Tag'
      };
      const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return { ...cat, amount, pct };
    })
    .sort((a, b) => b.amount - a.amount);

  if (items.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-slate-400">
        Chưa có khoản chi tiêu nào trong kỳ
      </div>
    );
  }

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativePct = 0;

  const activeItem = items.find((i) => i.id === activeCatId) || items[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
      {/* SVG Donut */}
      <div className="sm:col-span-5 flex justify-center">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="20"
              className="text-slate-100 dark:text-slate-800"
            />
            {items.map((item) => {
              const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePct / 100) * circumference);
              cumulativePct += item.pct;
              const isActive = activeItem?.id === item.id;

              return (
                <circle
                  key={item.id}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isActive ? '24' : '19'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveCatId(item.id)}
                  onClick={() => onSelectCategory && onSelectCategory(item.id)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <span className="text-[11px] font-medium text-slate-400 truncate max-w-[110px]">
              {activeItem?.name}
            </span>
            <span className="text-sm font-bold font-mono-num text-slate-900 dark:text-white mt-0.5">
              {formatCompactVND(activeItem?.amount || 0, hideBalance)}
            </span>
            <span
              className="text-[11px] font-bold mt-0.5 px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${activeItem?.color}20`,
                color: activeItem?.color
              }}
            >
              {activeItem?.pct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="sm:col-span-7 space-y-2 max-h-56 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setActiveCatId(item.id)}
            onClick={() => onSelectCategory && onSelectCategory(item.id)}
            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
              activeItem?.id === item.id
                ? 'bg-slate-100/90 dark:bg-slate-800/90 ring-1 ring-slate-200 dark:ring-slate-700'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color}18`, color: item.color }}
              >
                <DynamicIcon name={item.icon} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {item.name}
                </p>
                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, item.pct)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="text-xs font-bold font-mono-num text-slate-900 dark:text-white">
                {formatVND(item.amount, hideBalance)}
              </p>
              <p className="text-[11px] font-mono-num text-slate-400">{item.pct.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Rule503020Card({ transactions, categories, selectedMonth, hideBalance }) {
  const monthTx = transactions.filter((t) =>
    selectedMonth === 'ALL' ? true : String(t.tx_date).startsWith(selectedMonth)
  );

  const totalIncome = monthTx
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  let needsAmount = 0;
  let wantsAmount = 0;
  let savingsAmount = 0;

  for (const tx of monthTx) {
    if (tx.type !== 'expense') continue;
    const cat = catMap.get(tx.category_id);
    const rule = cat?.group_rule || 'needs';
    const amt = Number(tx.amount) || 0;
    if (rule === 'wants') wantsAmount += amt;
    else if (rule === 'savings') savingsAmount += amt;
    else needsAmount += amt;
  }

  const baseDenominator = totalIncome > 0 ? totalIncome : Math.max(1, needsAmount + wantsAmount + savingsAmount);

  const buckets = [
    {
      key: 'needs',
      label: 'Nhu cầu thiết yếu (Chuẩn 50%)',
      desc: 'Ăn uống, Tiền nhà, Hóa đơn, Di chuyển, Y tế',
      amount: needsAmount,
      idealPct: 50,
      actualPct: (needsAmount / baseDenominator) * 100,
      color: '#3b82f6'
    },
    {
      key: 'wants',
      label: 'Mong muốn cá nhân (Chuẩn 30%)',
      desc: 'Cà phê, Mua sắm, Giải trí, Hội họp bạn bè',
      amount: wantsAmount,
      idealPct: 30,
      actualPct: (wantsAmount / baseDenominator) * 100,
      color: '#f59e0b'
    },
    {
      key: 'savings',
      label: 'Tiết kiệm & Phát triển (Chuẩn 20%)',
      desc: 'Quỹ dự phòng, Đầu tư, Khóa học nâng cấp bản thân',
      amount: savingsAmount,
      idealPct: 20,
      actualPct: (savingsAmount / baseDenominator) * 100,
      color: '#10b981'
    }
  ];

  const unallocated = Math.max(0, totalIncome - (needsAmount + wantsAmount + savingsAmount));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {buckets.map((b) => {
          const isOver = b.key !== 'savings' && b.actualPct > b.idealPct;
          return (
            <div
              key={b.key}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {b.label}
                  </span>
                  <span
                    className="text-xs font-mono-num font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${b.color}18`, color: b.color }}
                  >
                    {b.actualPct.toFixed(1)}% / {b.idealPct}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{b.desc}</p>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-white">
                    {formatVND(b.amount, hideBalance)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-num">
                    Định mức: {formatCompactVND((baseDenominator * b.idealPct) / 100, hideBalance)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (b.actualPct / b.idealPct) * 100)}%`,
                      backgroundColor: isOver ? '#ef4444' : b.color
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart AI Financial Advice Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
          <p className="font-bold text-emerald-900 dark:text-emerald-300">
            Trợ lý Tài chính FinFlow đánh giá quy tắc 50/30/20:
          </p>
          {totalIncome > 0 ? (
            <p className="mt-0.5">
              Tổng thu kỳ này là{' '}
              <strong className="font-mono-num">{formatVND(totalIncome, hideBalance)}</strong>. Hiện
              tại bạn còn dư{' '}
              <strong className="font-mono-num text-emerald-700 dark:text-emerald-300">
                {formatVND(unallocated, hideBalance)}
              </strong>{' '}
              chưa phân bổ ({((unallocated / totalIncome) * 100).toFixed(1)}% thu nhập). Khoản chi
              thiết yếu đang ở mức rất an toàn!
            </p>
          ) : (
            <p className="mt-0.5">
              Hãy ghi nhận khoản thu nhập (Lương, Freelance...) trong tháng để FinFlow tính toán
              chính xác tỷ lệ 50/30/20 trên tổng thu nhập thực tế của bạn.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
