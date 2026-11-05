import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Utensils,
  ShieldCheck,
  CheckSquare,
  Square,
  Calendar,
  Lightbulb,
  Flame,
  Plus
} from 'lucide-react';
import {
  formatVND,
  formatCompactVND,
  evaluateAmountExpression
} from '../utils/smartParser.js';
import { DynamicIcon } from './IconMap.jsx';

const INCOME_PRESETS = [
  { label: '8 triệu', value: 8000000 },
  { label: '10 triệu', value: 10000000 },
  { label: '12 triệu', value: 12000000 },
  { label: '15 triệu', value: 15000000 },
  { label: '20 triệu', value: 20000000 },
  { label: '25 triệu', value: 25000000 },
  { label: '35 triệu', value: 35000000 }
];

/**
 * Calibrated urban cost-of-living allocation engine (no location names shown).
 * Automatically balances fixed living costs (rent + utilities, daily meals, groceries,
 * fuel/transport) with flexible lifestyle spending and disciplined savings.
 */
function computeSmartAllocation(totalIncome, housingMode, foodMode) {
  const income = Math.max(0, Number(totalIncome) || 0);
  if (income <= 0) return {};

  const roundTo50k = (val) => Math.max(0, Math.round(val / 50000) * 50000);

  // 1. Tiền trọ & Điện, Nước, Wifi (cat_housing)
  let housing = 0;
  if (housingMode === 'rent_solo') {
    // Phòng riêng / Studio có máy lạnh + điện nước wifi
    if (income <= 9000000) housing = roundTo50k(income * 0.34);
    else if (income <= 15000000) housing = roundTo50k(Math.min(4800000, Math.max(3200000, income * 0.28)));
    else housing = roundTo50k(Math.min(7000000, Math.max(4200000, income * 0.24)));
  } else if (housingMode === 'rent_shared') {
    // Ở ghép chia tiền phòng + điện nước
    if (income <= 9000000) housing = roundTo50k(Math.max(1600000, income * 0.22));
    else housing = roundTo50k(Math.min(3200000, Math.max(2000000, income * 0.18)));
  } else {
    // Không tốn tiền thuê nhà (chỉ đóng phụ điện, nước, wifi, 4G)
    housing = roundTo50k(Math.min(1500000, Math.max(500000, income * 0.07)));
  }

  // 2. Ăn uống hàng ngày (cat_food) & Đi chợ / Siêu thị (cat_grocery)
  let food = 0;
  let grocery = 0;
  if (foodMode === 'cook_mix') {
    // Kết hợp tự nấu + ăn trưa văn phòng
    food = roundTo50k(Math.min(3600000, Math.max(1600000, income * 0.16)));
    grocery = roundTo50k(Math.min(2800000, Math.max(1100000, income * 0.11)));
  } else if (foodMode === 'eat_out') {
    // Ăn ngoài là chính (sáng + trưa + tối)
    food = roundTo50k(Math.min(4800000, Math.max(2400000, income * 0.23)));
    grocery = roundTo50k(Math.min(1200000, Math.max(400000, income * 0.05)));
  } else {
    // Tự nấu tiết kiệm tối đa (mang cơm đi làm)
    food = roundTo50k(Math.min(2000000, Math.max(900000, income * 0.09)));
    grocery = roundTo50k(Math.min(3200000, Math.max(1500000, income * 0.15)));
  }

  // 3. Di chuyển & Xăng xe, gửi xe, bảo dưỡng (cat_transport)
  const transport = roundTo50k(Math.min(1400000, Math.max(450000, income * 0.055)));

  // 4. Cà phê & Trà sữa, đồ uống (cat_coffee)
  const coffee = roundTo50k(Math.min(900000, Math.max(250000, income * 0.035)));

  // 5. Mua sắm & Đồ dùng cá nhân (cat_shopping)
  const shopping = roundTo50k(Math.min(2500000, Math.max(400000, income * 0.065)));

  // 6. Giải trí & Gặp gỡ bạn bè (cat_entertainment)
  const entertainment = roundTo50k(Math.min(2000000, Math.max(350000, income * 0.05)));

  // 7. Sức khỏe, thuốc men & thể thao (cat_health)
  const health = roundTo50k(Math.min(1200000, Math.max(250000, income * 0.035)));

  // 8. Học tập & Phát triển bản thân (cat_education)
  const education = roundTo50k(Math.min(1800000, Math.max(250000, income * 0.04)));

  // 9. Gia đình & Hiếu hỉ dự phòng (cat_family)
  const family = roundTo50k(Math.min(2500000, Math.max(300000, income * 0.045)));

  const allocatedBeforeSavings =
    housing +
    food +
    grocery +
    transport +
    coffee +
    shopping +
    entertainment +
    health +
    education +
    family;

  // 10. Tiết kiệm & Đầu tư (cat_invest_out) — Đảm bảo cân bằng đúng tổng số tiền
  let investOut = Math.max(0, income - allocatedBeforeSavings);

  // Nếu thu nhập thấp khiến tổng chi vượt quá hoặc tiết kiệm < 8%, tự động co giãn hợp lý
  if (investOut < income * 0.08) {
    const targetSavings = roundTo50k(income * 0.1);
    const scale = (income - targetSavings) / Math.max(1, allocatedBeforeSavings);
    const scaled = {
      cat_housing: roundTo50k(housing * scale),
      cat_food: roundTo50k(food * scale),
      cat_grocery: roundTo50k(grocery * scale),
      cat_transport: roundTo50k(transport * scale),
      cat_coffee: roundTo50k(coffee * scale),
      cat_shopping: roundTo50k(shopping * scale),
      cat_entertainment: roundTo50k(entertainment * scale),
      cat_health: roundTo50k(health * scale),
      cat_education: roundTo50k(education * scale),
      cat_family: roundTo50k(family * scale)
    };
    const sumScaled = Object.values(scaled).reduce((a, b) => a + b, 0);
    scaled.cat_invest_out = Math.max(0, income - sumScaled);
    return scaled;
  }

  return {
    cat_housing: housing,
    cat_food: food,
    cat_grocery: grocery,
    cat_transport: transport,
    cat_coffee: coffee,
    cat_shopping: shopping,
    cat_entertainment: entertainment,
    cat_health: health,
    cat_education: education,
    cat_family: family,
    cat_invest_out: investOut
  };
}

const CATEGORY_ADVICE = {
  cat_housing: (amt) =>
    `Bao gồm tiền phòng/nhà, điện, nước, wifi & phí dịch vụ (~${formatCompactVND(Math.round(amt / 30))}/ngày)`,
  cat_food: (amt) =>
    `Định mức ăn uống hàng ngày: ~${formatVND(Math.round(amt / 30))}/ngày cho các bữa ăn`,
  cat_grocery: (amt) =>
    `Đi chợ/siêu thị ~${formatVND(Math.round(amt / 4))}/tuần (thực phẩm nấu ăn, trái cây, sữa, đồ gia dụng)`,
  cat_transport: (amt) =>
    `Đổ xăng (~${formatCompactVND(Math.round(amt * 0.55))}), gửi xe & dự phòng đặt xe/bảo dưỡng`,
  cat_coffee: (amt) =>
    `Khoảng ~${formatVND(Math.round(amt / 4))}/tuần (tương đương 2–3 buổi cà phê/trà sữa mỗi tuần)`,
  cat_shopping: (amt) =>
    `Quần áo, cắt tóc, mỹ phẩm & đồ dùng cá nhân (~${formatCompactVND(Math.round(amt / 4))}/tuần)`,
  cat_entertainment: (amt) =>
    `Gặp gỡ bạn bè, ăn uống cuối tuần, xem phim (~${formatCompactVND(Math.round(amt / 4))}/tuần)`,
  cat_health: (amt) =>
    `Tập luyện thể thao, vitamin & quỹ thuốc men dự phòng hàng tháng`,
  cat_education: (amt) =>
    `Đầu tư sách vở, khóa học kỹ năng, ngoại ngữ hoặc phần mềm công việc`,
  cat_family: (amt) =>
    `Quỹ dự phòng đám cưới, sinh nhật, thăm hỏi hoặc biếu tặng gia đình`,
  cat_invest_out: (amt) =>
    `Nên trích riêng ngay khi vừa nhận lương (Tương đương ${formatCompactVND(amt * 12)}/năm chưa tính lãi)`
};

export function SmartIncomeAllocator({
  categories,
  onApplyBudgets,
  onRecordIncome,
  hideBalance
}) {
  const [incomeInput, setIncomeInput] = useState('15000000');
  const [housingMode, setHousingMode] = useState('rent_solo'); // 'rent_solo' | 'rent_shared' | 'no_rent'
  const [foodMode, setFoodMode] = useState('cook_mix'); // 'cook_mix' | 'eat_out' | 'cook_save'
  const [customOverrides, setCustomOverrides] = useState({});
  const [alsoRecordIncome, setAlsoRecordIncome] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const evaluatedIncome = evaluateAmountExpression(incomeInput);

  const baseAllocation = useMemo(
    () => computeSmartAllocation(evaluatedIncome, housingMode, foodMode),
    [evaluatedIncome, housingMode, foodMode]
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const finalAllocation = useMemo(() => {
    const merged = { ...baseAllocation };
    for (const [k, v] of Object.entries(customOverrides)) {
      if (v !== undefined && v !== null) merged[k] = v;
    }
    return merged;
  }, [baseAllocation, customOverrides]);

  const totalAllocated = useMemo(
    () => Object.values(finalAllocation).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [finalAllocation]
  );

  const groupTotals = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let savings = 0;
    for (const cat of expenseCategories) {
      const amt = Number(finalAllocation[cat.id] || 0);
      if (cat.group_rule === 'wants') wants += amt;
      else if (cat.group_rule === 'savings') savings += amt;
      else needs += amt;
    }
    return { needs, wants, savings };
  }, [expenseCategories, finalAllocation]);

  const handleApplyAll = async () => {
    if (evaluatedIncome <= 0) return;
    const budgetList = Object.entries(finalAllocation).map(([category_id, monthly_limit]) => ({
      category_id,
      monthly_limit: Number(monthly_limit) || 0
    }));
    await onApplyBudgets(budgetList);
    if (alsoRecordIncome && onRecordIncome) {
      await onRecordIncome(evaluatedIncome);
    }
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-800/70 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Phân Tích & Phân Bổ Chi Tiêu Tháng Tự Động
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Tối ưu theo chi phí sinh hoạt thực tế
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Nhập tổng số tiền bạn có trong tháng — Hệ thống tự động tính toán tiền trọ, ăn uống từng ngày, đi chợ, xăng xe và tiết kiệm hợp lý nhất
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Income Input + Lifestyle Mode Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
        {/* Step 1: Total Monthly Money */}
        <div className="lg:col-span-5 space-y-2">
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200">
            1. Nhập tổng thu nhập / ngân sách tháng của bạn:
          </label>
          <div className="relative">
            <input
              type="text"
              value={incomeInput}
              onChange={(e) => {
                setIncomeInput(e.target.value);
                setCustomOverrides({});
              }}
              placeholder="VD: 12tr, 15tr, 20000000..."
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 font-mono-num text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
              = {formatVND(evaluatedIncome, hideBalance)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {INCOME_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setIncomeInput(String(p.value));
                  setCustomOverrides({});
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-num font-bold transition cursor-pointer ${
                  evaluatedIncome === p.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Housing Mode */}
        <div className="lg:col-span-4 space-y-2">
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200">
            2. Nhu cầu chỗ ở hiện tại:
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { id: 'rent_solo', label: '🏠 Thuê phòng riêng / Căn hộ dịch vụ' },
              { id: 'rent_shared', label: '👥 Ở ghép chia tiền phòng & điện nước' },
              { id: 'no_rent', label: '🏡 Không tốn tiền thuê (Chỉ đóng điện nước)' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setHousingMode(opt.id);
                  setCustomOverrides({});
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                  housingMode === opt.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Food & Cooking Mode */}
        <div className="lg:col-span-3 space-y-2">
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200">
            3. Thói quen ăn uống:
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { id: 'cook_mix', label: '🍱 Tự nấu tối + Ăn trưa ngoài' },
              { id: 'eat_out', label: '🍜 Ăn hàng quán cả ngày' },
              { id: 'cook_save', label: '🥦 Tự nấu & mang cơm đi làm' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setFoodMode(opt.id);
                  setCustomOverrides({});
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                  foodMode === opt.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-Level 3-Group Summary Bar */}
      {evaluatedIncome > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-300">
                Chi phí Thiết yếu (Trọ, Ăn, Đi lại, Y tế)
              </span>
              <span className="font-mono-num font-bold text-blue-600 dark:text-blue-400">
                {((groupTotals.needs / Math.max(1, totalAllocated)) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-base font-extrabold font-mono-num text-slate-900 dark:text-white mt-1">
              {formatVND(groupTotals.needs, hideBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ~{formatVND(Math.round(groupTotals.needs / 30), hideBalance)} / ngày sinh hoạt cơ bản
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300">
                Chi tiêu Cá nhân (Cafe, Mua sắm, Giải trí)
              </span>
              <span className="font-mono-num font-bold text-amber-600 dark:text-amber-400">
                {((groupTotals.wants / Math.max(1, totalAllocated)) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-base font-extrabold font-mono-num text-slate-900 dark:text-white mt-1">
              {formatVND(groupTotals.wants, hideBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ~{formatVND(Math.round(groupTotals.wants / 4), hideBalance)} / tuần thư giãn & mua sắm
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">
                Tiết kiệm & Phát triển bản thân
              </span>
              <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                {((groupTotals.savings / Math.max(1, totalAllocated)) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-base font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1">
              {formatVND(groupTotals.savings, hideBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tích lũy ~{formatCompactVND(groupTotals.savings * 12, hideBalance)} sau 1 năm
            </p>
          </div>
        </div>
      )}

      {/* Detailed Category-by-Category Breakdown Grid */}
      {evaluatedIncome > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {expenseCategories.map((cat) => {
            const amt = Number(finalAllocation[cat.id] || 0);
            const pct = totalAllocated > 0 ? (amt / totalAllocated) * 100 : 0;
            const dailyAmt = Math.round(amt / 30);
            const adviceFn = CATEGORY_ADVICE[cat.id];

            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Editable Recommended Amount */}
                  <div className="flex items-center justify-between gap-2 my-2">
                    <input
                      type="number"
                      step="50000"
                      value={amt}
                      onChange={(e) =>
                        setCustomOverrides((prev) => ({
                          ...prev,
                          [cat.id]: Math.max(0, Number(e.target.value) || 0)
                        }))
                      }
                      className="w-36 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                    <span className="text-[11px] font-mono-num font-semibold text-slate-500">
                      ~{formatCompactVND(dailyAmt, hideBalance)}/ngày
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {adviceFn
                    ? adviceFn(amt)
                    : `Định mức khuyến nghị ~${formatCompactVND(Math.round(amt / 4))}/tuần`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={alsoRecordIncome}
            onChange={(e) => setAlsoRecordIncome(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            Đồng thời ghi nhận <strong>+{formatVND(evaluatedIncome, hideBalance)}</strong> vào khoản
            Thu nhập Lương tháng này
          </span>
        </label>

        <div className="flex items-center gap-2.5">
          {Object.keys(customOverrides).length > 0 && (
            <button
              type="button"
              onClick={() => setCustomOverrides({})}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Khôi phục mức gợi ý chuẩn
            </button>
          )}
          <button
            type="button"
            onClick={handleApplyAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              {appliedSuccess
                ? 'Đã áp dụng vào Ngân sách tháng!'
                : `Áp dụng bộ phân bổ này (${formatCompactVND(totalAllocated)})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MODULE 2: Month-over-Month Financial Comparison
 */
export function MonthComparisonModule({
  transactions,
  categories,
  currentMonth = '2026-11',
  hideBalance,
  onQuickAddPastMonth
}) {
  const activeCurrMonth = currentMonth === 'ALL' ? '2026-11' : currentMonth;
  const [compareMonth, setCompareMonth] = useState(
    activeCurrMonth === '2026-10' ? '2026-09' : '2026-10'
  );

  const COMPARE_OPTIONS = [
    { value: '2026-10', label: 'Tháng 10 / 2026' },
    { value: '2026-09', label: 'Tháng 09 / 2026' },
    { value: '2026-08', label: 'Tháng 08 / 2026' }
  ];

  const calcMonthStats = (monthPrefix) => {
    const list = transactions.filter((t) => String(t.tx_date).startsWith(monthPrefix));
    let income = 0;
    let expense = 0;
    const byCat = new Map();
    for (const tx of list) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        byCat.set(tx.category_id, (byCat.get(tx.category_id) || 0) + amt);
      }
    }
    return { income, expense, net: income - expense, byCat, count: list.length };
  };

  const currStats = useMemo(
    () => calcMonthStats(activeCurrMonth),
    [transactions, activeCurrMonth]
  );
  const prevStats = useMemo(
    () => calcMonthStats(compareMonth),
    [transactions, compareMonth]
  );

  const expenseDiff = currStats.expense - prevStats.expense;
  const expenseDiffPct =
    prevStats.expense > 0 ? ((currStats.expense - prevStats.expense) / prevStats.expense) * 100 : 0;

  const incomeDiff = currStats.income - prevStats.income;
  const netDiff = currStats.net - prevStats.net;

  const categoryComparisons = useMemo(() => {
    return categories
      .filter((c) => c.type === 'expense')
      .map((cat) => {
        const currVal = currStats.byCat.get(cat.id) || 0;
        const prevVal = prevStats.byCat.get(cat.id) || 0;
        const diff = currVal - prevVal;
        const pct = prevVal > 0 ? (diff / prevVal) * 100 : currVal > 0 ? 100 : 0;
        return {
          ...cat,
          currVal,
          prevVal,
          diff,
          pct
        };
      })
      .filter((item) => item.currVal > 0 || item.prevVal > 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [categories, currStats, prevStats]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            So Sánh Dòng Tiền Tháng Này Với Các Tháng Trước
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Đối chiếu trực tiếp thu nhập, chi tiêu và biến động từng danh mục giữa 2 tháng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Kỳ này: {activeCurrMonth.split('-').reverse().join('/')}
          </span>
          <span className="text-xs text-slate-400 font-bold">so với</span>
          <select
            value={compareMonth}
            onChange={(e) => setCompareMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            {COMPARE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {onQuickAddPastMonth && (
            <button
              type="button"
              onClick={() => onQuickAddPastMonth(`${compareMonth}-15`)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              Nhập số liệu {compareMonth.split('-').reverse().join('/')}
            </button>
          )}
        </div>
      </div>

      {/* 3 Delta Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expense Comparison */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-500">Tổng Chi Tiêu</span>
            <span
              className={`inline-flex items-center gap-0.5 font-mono-num font-bold px-2 py-0.5 rounded-full text-[11px] ${
                expenseDiff <= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {expenseDiff <= 0 ? (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              )}
              {expenseDiff > 0 ? '+' : ''}
              {prevStats.expense > 0 ? `${expenseDiffPct.toFixed(1)}%` : formatCompactVND(expenseDiff)}
            </span>
          </div>
          <p className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
            {formatVND(currStats.expense, hideBalance)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Kỳ {compareMonth.split('-').reverse().join('/')}:{' '}
            <strong className="font-mono-num">{formatVND(prevStats.expense, hideBalance)}</strong> (
            {expenseDiff <= 0
              ? `Tiết kiệm hơn ${formatCompactVND(Math.abs(expenseDiff), hideBalance)}`
              : `Chi nhiều hơn ${formatCompactVND(expenseDiff, hideBalance)}`}
            )
          </p>
        </div>

        {/* Income Comparison */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-500">Tổng Thu Nhập</span>
            <span
              className={`font-mono-num font-bold px-2 py-0.5 rounded-full text-[11px] ${
                incomeDiff >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {incomeDiff >= 0 ? '+' : ''}
              {formatCompactVND(incomeDiff, hideBalance)}
            </span>
          </div>
          <p className="text-lg font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400">
            {formatVND(currStats.income, hideBalance)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Kỳ {compareMonth.split('-').reverse().join('/')}:{' '}
            <strong className="font-mono-num">{formatVND(prevStats.income, hideBalance)}</strong>
          </p>
        </div>

        {/* Net Cashflow Comparison */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-500">Tiền Dư Ròng (Thu - Chi)</span>
            <span
              className={`font-mono-num font-bold px-2 py-0.5 rounded-full text-[11px] ${
                netDiff >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {netDiff >= 0 ? '+' : ''}
              {formatCompactVND(netDiff, hideBalance)}
            </span>
          </div>
          <p className="text-lg font-extrabold font-mono-num text-blue-600 dark:text-blue-400">
            {currStats.net >= 0 ? '+' : ''}
            {formatVND(currStats.net, hideBalance)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Kỳ {compareMonth.split('-').reverse().join('/')}:{' '}
            <strong className="font-mono-num">
              {prevStats.net >= 0 ? '+' : ''}
              {formatVND(prevStats.net, hideBalance)}
            </strong>
          </p>
        </div>
      </div>

      {/* Category-by-Category Comparison List */}
      {categoryComparisons.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Chưa có dữ liệu chi tiêu ở hai kỳ để so sánh chi tiết từng danh mục
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Khi bạn ghi nhận chi tiêu ở tháng này và tháng trước, bảng phân tích tăng/giảm từng mục sẽ tự động hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Chi tiết biến động theo từng danh mục:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryComparisons.map((item) => {
              const maxBar = Math.max(1, item.currVal, item.prevVal);
              const isSavingMore = item.diff <= 0;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        <DynamicIcon name={item.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-full ${
                        isSavingMore
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {item.diff > 0 ? '+' : ''}
                      {formatCompactVND(item.diff, hideBalance)}
                    </span>
                  </div>

                  {/* Dual Bars */}
                  <div className="space-y-1 text-[11px] font-mono-num">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-slate-500">Kỳ này:</span>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.currVal / maxBar) * 100}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <span className="w-24 text-right font-bold text-slate-800 dark:text-slate-100">
                        {formatVND(item.currVal, hideBalance)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-slate-400">Kỳ trước:</span>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                          style={{ width: `${(item.prevVal / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 text-right text-slate-500">
                        {formatVND(item.prevVal, hideBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MODULE 3: Life Optimization Toolkit (Các công cụ tối ưu hóa cuộc sống)
 */
export function LifeOptimizationToolkit({ totalNetWorth, totalMonthlyBudget, hideBalance }) {
  // Tool 1: Work-Hour Cost Converter (Quy đổi giờ công lao động)
  const [monthlySalary, setMonthlySalary] = useState('15000000');
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState('176'); // 8h * 22 days
  const [itemPrice, setItemPrice] = useState('850000');

  // Tool 2: Home Cooking vs Eating Out / Coffee Optimizer
  const [cookDaysPerWeek, setCookDaysPerWeek] = useState(4);
  const [coffeeCutPerWeek, setCoffeeCutPerWeek] = useState(3);

  // Tool 4: Habit Checklist
  const [checkedHabits, setCheckedHabits] = useState({
    pay_self_first: true,
    rule_48h: false,
    cook_lunch: false,
    audit_subs: false,
    emergency_3m: false,
    no_spend_day: false
  });

  const salaryVal = evaluateAmountExpression(monthlySalary) || 15000000;
  const hoursVal = Math.max(1, Number(workHoursPerMonth) || 176);
  const hourlyRate = Math.round(salaryVal / hoursVal);
  const priceVal = evaluateAmountExpression(itemPrice) || 0;
  const hoursNeeded = hourlyRate > 0 ? priceVal / hourlyRate : 0;
  const workDaysNeeded = hoursNeeded / 8;

  // Savings from cooking & cutting extra drinks
  // Avg eating out meal + delivery = 55k vs home cooked = 25k -> saves 30k/meal
  // Avg cafe/milk tea = 45k -> saves 35k/cup
  const monthlyCookSavings = cookDaysPerWeek * 4 * 35000;
  const monthlyCoffeeSavings = coffeeCutPerWeek * 4 * 40000;
  const totalHabitMonthlySavings = monthlyCookSavings + monthlyCoffeeSavings;
  const yearlyHabitSavings = totalHabitMonthlySavings * 12;

  // Financial Runway (Số ngày/tháng tự do tài chính)
  const essentialMonthlyNeed =
    totalMonthlyBudget > 0 ? totalMonthlyBudget * 0.7 : Math.max(6500000, salaryVal * 0.6);
  const runwayMonths =
    essentialMonthlyNeed > 0 ? totalNetWorth / essentialMonthlyNeed : 0;
  const runwayDays = Math.round(runwayMonths * 30);

  const HABIT_ITEMS = [
    {
      id: 'pay_self_first',
      title: 'Quy tắc "Trả cho bản thân trước" ngay ngày nhận lương',
      desc: 'Tự động trích 15%–20% thu nhập sang Quỹ Tiết Kiệm ngay khi lương về trước khi tiêu bất kỳ khoản nào.'
    },
    {
      id: 'rule_48h',
      title: 'Quy tắc chờ 48 giờ trước khi chốt đơn trên 300.000 ₫',
      desc: 'Bỏ món đồ vào giỏ hàng nhưng chờ đủ 48 giờ. 80% cảm giác muốn mua bốc đồng sẽ biến mất.'
    },
    {
      id: 'cook_lunch',
      title: 'Nấu dư bữa tối để mang cơm trưa đi làm 3–4 ngày/tuần',
      desc: 'Vừa tiết kiệm 1,2 – 1,8 triệu/tháng tiền gọi đồ ăn trưa, vừa đảm bảo vệ sinh và sức khỏe.'
    },
    {
      id: 'audit_subs',
      title: 'Rà soát hóa đơn điện, 4G & các gói dịch vụ tự động gia hạn',
      desc: 'Vệ sinh máy lạnh định kỳ 6 tháng/lần (giảm 15-20% tiền điện) và hủy các app không dùng tới.'
    },
    {
      id: 'no_spend_day',
      title: 'Thử thách 2 ngày "No-Spend Day" (Không tiêu tiền mặt/quẹt thẻ) mỗi tuần',
      desc: 'Sử dụng thực phẩm có sẵn trong tủ lạnh và tự pha cà phê vào 2 ngày cố định trong tuần.'
    },
    {
      id: 'emergency_3m',
      title: 'Xây dựng Quỹ Dự Phòng Khẩn Cấp tối thiểu 3–6 tháng sinh hoạt phí',
      desc: 'Giúp bạn luôn chủ động và bình tĩnh trước mọi biến động công việc hoặc sức khỏe.'
    }
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Bộ Công Cụ Tối Ưu Hóa Cuộc Sống & Tâm Lý Chi Tiêu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              3 công cụ thực chiến giúp bạn giữ được nhiều tiền hơn mà vẫn sống thoải mái, chất lượng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tool 1: Work-Hour Converter */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  1. Quy Đổi &ldquo;Giờ Công Lao Động&rdquo; (Chống mua bốc đồng)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Trước khi mua một món đồ, hãy xem nó tiêu tốn bao nhiêu giờ đi làm vất vả của bạn:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Thu nhập tháng
                  </label>
                  <input
                    type="text"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Giá món đồ định mua
                  </label>
                  <input
                    type="text"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 text-xs font-mono-num font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">1 giờ công của bạn:</span>
                <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                  {formatVND(hourlyRate, hideBalance)} / giờ
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Món đồ {formatCompactVND(priceVal)} ={' '}
                  <span className="text-rose-600 dark:text-rose-400 font-mono-num text-sm font-extrabold">
                    {hoursNeeded.toFixed(1)} giờ làm việc
                  </span>{' '}
                  (~{workDaysNeeded.toFixed(1)} ngày công)
                </p>
              </div>
            </div>
          </div>

          {/* Tool 2: Cooking & Coffee Habit Simulator */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  2. Máy Tính Tối Ưu &ldquo;Mang Cơm & Pha Cà Phê&rdquo;
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Xem số tiền bạn dư thêm nếu thay đổi nhỏ thói quen ăn uống hàng tuần:
              </p>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">
                    Tự nấu / mang cơm trưa:
                  </span>
                  <span className="font-bold text-emerald-600">{cookDaysPerWeek} bữa / tuần</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={cookDaysPerWeek}
                  onChange={(e) => setCookDaysPerWeek(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">
                    Giảm đặt trà sữa / cafe ngoài:
                  </span>
                  <span className="font-bold text-emerald-600">{coffeeCutPerWeek} ly / tuần</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={coffeeCutPerWeek}
                  onChange={(e) => setCoffeeCutPerWeek(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tiết kiệm mỗi tháng:</span>
                <span className="font-mono-num font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{formatVND(totalHabitMonthlySavings, hideBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Dư thêm sau 1 năm:</span>
                <span className="font-mono-num font-extrabold text-amber-600 dark:text-amber-400">
                  +{formatVND(yearlyHabitSavings, hideBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Tool 3: Financial Runway / Safety Days */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  3. Chỉ Số &ldquo;Ngày An Toàn Tài Chính&rdquo; (Runway)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Số ngày bạn có thể sống thoải mái bằng tiền tích lũy hiện có nếu tạm ngưng thu nhập:
              </p>

              <div className="py-3 text-center">
                <p className="text-3xl font-extrabold font-mono-num text-blue-600 dark:text-blue-400">
                  {runwayDays} ngày
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  (~{runwayMonths.toFixed(1)} tháng sinh hoạt phí thiết yếu)
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              Mục tiêu chuẩn: Đạt tối thiểu <strong className="text-emerald-600">90 – 180 ngày</strong>{' '}
              (3–6 tháng) để luôn tự chủ trước mọi quyết định công việc và cuộc sống.
            </div>
          </div>
        </div>

        {/* Tool 4: Interactive Monthly Optimization Checklist */}
        <div className="mt-5 pt-5 border-t border-slate-200/70 dark:border-slate-800">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            Checklist 6 Thói Quen Tối Ưu Hóa Chi Tiêu & Cuộc Sống Hàng Tháng
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {HABIT_ITEMS.map((item) => {
              const checked = Boolean(checkedHabits[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setCheckedHabits((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                    checked
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        checked
                          ? 'text-emerald-900 dark:text-emerald-300'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
