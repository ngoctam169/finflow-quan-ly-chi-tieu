import React from 'react';
import {
  formatCompactVND,
  getTodayISO,
  getCurrentMonthISO
} from '../utils/smartParser.js';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function CalendarLedgerView({
  month = getCurrentMonthISO(),
  transactions = [],
  selectedDay,
  onSelectDay,
  hideBalance
}) {
  const todayStr = getTodayISO();
  const targetMonth = month === 'ALL' ? getCurrentMonthISO() : month;
  const [yearNum, monthNum] = targetMonth.split('-').map(Number);

  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  // JS getDay(): 0 = Sun, 1 = Mon ... convert to Monday-based (0 = Mon ... 6 = Sun)
  const firstDayDow = (new Date(yearNum, monthNum - 1, 1).getDay() + 6) % 7;

  const dayTotals = new Map();
  for (const tx of transactions) {
    if (!String(tx.tx_date).startsWith(targetMonth)) continue;
    const cur = dayTotals.get(tx.tx_date) || { income: 0, expense: 0, count: 0 };
    if (tx.type === 'income') cur.income += Number(tx.amount) || 0;
    else cur.expense += Number(tx.amount) || 0;
    cur.count += 1;
    dayTotals.set(tx.tx_date, cur);
  }

  const cells = [];
  for (let i = 0; i < firstDayDow; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${targetMonth}-${String(d).padStart(2, '0')}`;
    cells.push({
      day: d,
      dateStr,
      data: dayTotals.get(dateStr) || { income: 0, expense: 0, count: 0 }
    });
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Lịch Nhiệt Chi Tiêu Tháng {monthNum}/{yearNum}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nhấn vào một ngày bất kỳ trên lịch để lọc giao dịch của ngày đó
          </p>
        </div>
        {selectedDay && (
          <button
            type="button"
            onClick={() => onSelectDay(null)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer"
          >
            Đang lọc ngày {selectedDay.split('-').reverse().join('/')} • Bỏ lọc ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[11px] font-bold text-slate-400 uppercase py-1"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`empty_${idx}`}
                className="h-16 sm:h-20 rounded-2xl bg-slate-50/40 dark:bg-slate-800/20"
              />
            );
          }

          const { day, dateStr, data } = cell;
          const isToday = dateStr === todayStr;
          const isSelected = selectedDay === dateStr;
          const hasActivity = data.income > 0 || data.expense > 0;

          let bgClass = 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800';
          if (data.expense > 1000000) {
            bgClass = 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-200 dark:border-rose-900/60';
          } else if (data.expense > 0) {
            bgClass = 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/70 dark:border-amber-900/40';
          } else if (data.income > 0) {
            bgClass = 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-900/60';
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDay(isSelected ? null : dateStr)}
              className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${bgClass} ${
                isSelected
                  ? 'ring-2 ring-emerald-500 border-emerald-500 scale-[1.02]'
                  : 'hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-mono-num font-bold ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {day}
                </span>
                {data.count > 0 && (
                  <span className="text-[10px] font-mono-num px-1.5 py-0.2 rounded-full bg-white/80 dark:bg-slate-900/70 text-slate-500">
                    {data.count} GD
                  </span>
                )}
              </div>

              {hasActivity ? (
                <div className="space-y-0.5 overflow-hidden w-full">
                  {data.income > 0 && (
                    <p className="text-[10px] sm:text-[11px] font-mono-num font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      +{formatCompactVND(data.income, hideBalance)}
                    </p>
                  )}
                  {data.expense > 0 && (
                    <p className="text-[10px] sm:text-[11px] font-mono-num font-bold text-rose-600 dark:text-rose-400 truncate">
                      -{formatCompactVND(data.expense, hideBalance)}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
