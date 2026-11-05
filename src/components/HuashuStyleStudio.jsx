import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  Sparkles,
  CheckCircle2,
  Layers,
  Type,
  Box,
  Grid,
  X,
  Eye
} from 'lucide-react';
import { Mascot, MASCOT_CATALOG, REACTION_METADATA } from './PageMascot.jsx';

/**
 * Multi-Style Design System inspired by https://github.com/alchaincyf/huashu-design (v3.2)
 * Anti-AI-Slop Philosophy:
 * - Distinct visual directions with real cultural & industrial references (Kinfolk/吕敬人, Braun/Dieter Rams, Abbott Miller Obsidian)
 * - Live Tweaks state persisted in localStorage
 * - Paired with interactive sprite mascots from https://github.com/nilbuild/page-mascot
 */
export const HUASHU_DIRECTIONS = [
  {
    id: 'midnight',
    name: 'Triển Lãm Đêm (Obsidian)',
    subtitle: 'Abbott Miller · Dark Gallery',
    badge: 'Huashu #01',
    description:
      'Nền đen đá vỏ chai độ tương phản cao, chữ số Tabular sắc nét, điểm nhấn ngọc lục bảo chuẩn Fintech chuyên nghiệp.',
    darkMode: true,
    font: 'modern',
    radius: 'balanced',
    texture: 'grid',
    recommendedMascot: 'fox',
    swatches: ['#090D14', '#111827', '#10B981', '#F8FAFC']
  },
  {
    id: 'paper',
    name: 'Ấn Phẩm Giấy Ấm (Editorial)',
    subtitle: 'Kinfolk · 吕敬人 Book Design',
    badge: 'Huashu #02',
    description:
      'Chất liệu giấy kem ấm áp, tiêu đề Serif thanh lịch như tạp chí tài chính, không gây mỏi mắt khi đọc sổ giao dịch lâu.',
    darkMode: false,
    font: 'editorial',
    radius: 'balanced',
    texture: 'paper',
    recommendedMascot: 'fox-riso',
    swatches: ['#F4EFE6', '#FBF8F1', '#C83E2B', '#1F5E4B']
  },
  {
    id: 'hardware',
    name: 'Bảng Cơ Khí (Tactile Ledger)',
    subtitle: 'Braun · Dieter Rams Industrial',
    badge: 'Huashu #03',
    description:
      'Bề mặt nhôm mờ công nghiệp, đường kẻ lưới kỹ thuật 1px, góc cạnh dứt khoát và phông chữ kỹ thuật chính xác từng con số.',
    darkMode: false,
    font: 'technical',
    radius: 'sharp',
    texture: 'grid',
    recommendedMascot: 'fox-ink',
    swatches: ['#E6E5E0', '#F5F5F2', '#EA580C', '#181816']
  },
  {
    id: 'emerald',
    name: 'FinFlow Tinh Gọn (Clean Daylight)',
    subtitle: 'Modern Vietnamese Fintech',
    badge: 'Huashu #04',
    description:
      'Không gian sáng thoáng đãng, bo góc mềm mại, tối ưu tốc độ nhập liệu 3 giây và trực quan hóa dòng tiền gia đình.',
    darkMode: false,
    font: 'modern',
    radius: 'organic',
    texture: 'clean',
    recommendedMascot: 'cat',
    swatches: ['#F8FAFC', '#FFFFFF', '#059669', '#0F172A']
  }
];

export const HUASHU_AUDIT_DIMENSIONS = [
  {
    code: '01',
    title: 'Nhất Quán Triết Lý (Direction Coherence)',
    detail:
      'Mỗi chế độ trong 4 trường phái Huashu chuyển đổi đồng bộ từ màu nền, vân chất liệu, kiểu chữ tiêu đề cho đến linh vật đi kèm.'
  },
  {
    code: '02',
    title: 'Phân Cấp Thị Giác & Tabular Numerals',
    detail:
      'Mọi con số tiền tệ VND đều dùng JetBrains Mono Tabular-Nums thẳng hàng tuyệt đối, giúp so sánh thu chi tức thì không rối mắt.'
  },
  {
    code: '03',
    title: 'Vi Tương Tác Sống Động (Page Mascot 3×3)',
    detail:
      'Linh vật nilbuild/page-mascot dõi theo góc di chuột 9 hướng, tự động chớp mắt và bật biểu cảm khi bạn ghi giao dịch hoặc tiết kiệm.'
  },
  {
    code: '04',
    title: 'Công Năng Thực Chiến (Zero Fake Slop)',
    detail:
      'Khởi đầu sạch 0 ₫, gợi ý 1 chạm các khoản thiết yếu, tự động phân bổ thu nhập theo mức sống thực tế và so sánh đa kỳ.'
  },
  {
    code: '05',
    title: 'Loại Bỏ Rập Khuôn AI (Anti-AI-Slop)',
    detail:
      'Không dùng gradient tím vô hồn, không chèn ký tự trang trí thừa; tập trung 100% vào tốc độ thao tác và cảm xúc người dùng.'
  }
];

export function HuashuStyleBanner({
  huashuConfig,
  onApplyDirection,
  onOpenStudio,
  mascotId,
  onSelectMascot,
  externalReaction,
  onTriggerReaction
}) {
  const currentDir =
    HUASHU_DIRECTIONS.find((d) => d.id === huashuConfig.direction) || HUASHU_DIRECTIONS[0];
  const currentMascot =
    MASCOT_CATALOG.find((m) => m.id === mascotId) || MASCOT_CATALOG[0];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Live Interactive Mascot + Huashu Design Intro */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 p-1.5 flex items-center justify-center">
            <Mascot
              directions={currentMascot.directions}
              reactions={currentMascot.reactions}
              size={72}
              externalReaction={externalReaction}
            />
            <span className="absolute -bottom-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold shadow">
              Chạm thử!
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Palette className="w-3 h-3" />
                Huashu Design v3.2 × Page Mascot
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Linh vật đang chọn: <strong className="text-slate-800 dark:text-slate-200">{currentMascot.name}</strong>
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Không Gian Thiết Kế Cá Nhân Hóa & Linh Vật Dõi Theo Chuột
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Di chuột quanh màn hình để xem <strong>{currentMascot.name}</strong> nhìn theo 9 hướng, hoặc chuyển đổi nhanh 4 trường phái thẩm mỹ từ <em>huashu-design</em>:
            </p>
          </div>
        </div>

        {/* Right: 4 Direction Pills + Open Studio Button */}
        <div className="flex flex-wrap items-center gap-2">
          {HUASHU_DIRECTIONS.map((dir) => {
            const active = huashuConfig.direction === dir.id;
            return (
              <button
                key={dir.id}
                type="button"
                onClick={() => onApplyDirection(dir)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="flex items-center -space-x-1">
                  {dir.swatches.slice(0, 3).map((color, idx) => (
                    <span
                      key={idx}
                      className="w-3 h-3 rounded-full border border-white/60 dark:border-slate-700"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span>{dir.name.split(' (')[0]}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenStudio}
            className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Huashu Tweaks & Mascot</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function HuashuStudioModal({
  isOpen,
  onClose,
  huashuConfig,
  onUpdateConfig,
  onApplyDirection,
  mascotId,
  onSelectMascot,
  externalReaction,
  onTriggerReaction
}) {
  if (!isOpen) return null;

  const currentMascot =
    MASCOT_CATALOG.find((m) => m.id === mascotId) || MASCOT_CATALOG[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Huashu Design Studio × Page Mascot Interactive
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  v3.2 Live Tweaks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ứng dụng hệ thống thiết kế chống rập khuôn (alchaincyf/huashu-design) & linh vật tương tác 9 hướng (nilbuild/page-mascot)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: 4 Design Directions (Multi-Style Exploration) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                1. Trường Phái Thẩm Mỹ Chủ Đạo (Huashu Multi-Style Exploration)
              </h4>
              <span className="text-[11px] text-slate-400">
                Tự động lưu cấu hình vào trình duyệt
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {HUASHU_DIRECTIONS.map((dir) => {
                const active = huashuConfig.direction === dir.id;
                return (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => onApplyDirection(dir)}
                    className={`text-left p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {dir.badge} • {dir.subtitle}
                        </span>
                        <div className="flex items-center gap-1">
                          {dir.swatches.map((color, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {dir.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {dir.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">
                        Linh vật gợi ý: <strong>{dir.recommendedMascot}</strong>
                      </span>
                      {active ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đang áp dụng
                        </span>
                      ) : (
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          Chọn phong cách này
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Real-time Micro Tweaks (Typography, Corner Geometry, Texture) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Typography */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2.5">
                <Type className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Kiểu chữ tiêu đề (Typography)
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { id: 'modern', label: 'Modern Sans (Be Vietnam Pro)' },
                  { id: 'editorial', label: 'Editorial Serif (Playfair Ấn Phẩm)' },
                  { id: 'technical', label: 'Technical Mono (JetBrains Cơ Khí)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateConfig({ font: opt.id })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      huashuConfig.font === opt.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2.5">
                <Box className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Hình học góc thẻ (Corner Radius)
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { id: 'sharp', label: 'Sắc cạnh Cơ khí (6px Braun)' },
                  { id: 'balanced', label: 'Chuẩn cân đối (16px Editorial)' },
                  { id: 'organic', label: 'Bo tròn mềm mại (28px Organic)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateConfig({ radius: opt.id })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      huashuConfig.radius === opt.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Surface Texture */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2.5">
                <Grid className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Chất liệu bề mặt (Surface Texture)
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { id: 'grid', label: 'Lưới kỹ thuật mảnh (28px Grid)' },
                  { id: 'paper', label: 'Hạt giấy mỹ thuật (Archival Dot)' },
                  { id: 'clean', label: 'Phẳng tinh khiết (Minimal Flat)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateConfig({ texture: opt.id })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      huashuConfig.texture === opt.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Interactive Page Mascot Studio (nilbuild/page-mascot) */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Mascot
                    directions={currentMascot.directions}
                    reactions={currentMascot.reactions}
                    size={84}
                    externalReaction={externalReaction}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    nilbuild/page-mascot • 9 Hướng & 9 Biểu Cảm
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {currentMascot.name} ({currentMascot.styleTag})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentMascot.persona}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {REACTION_METADATA.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onTriggerReaction(r.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-emerald-500 cursor-pointer"
                  >
                    {r.emoji} {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MASCOT_CATALOG.map((m) => {
                const selected = m.id === mascotId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectMascot(m.id);
                      onTriggerReaction('sparkle');
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-11 h-11 rounded-xl shrink-0"
                      style={{
                        backgroundImage: `url(${m.directions})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '50% 50%',
                        backgroundSize: '300% 300%'
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {m.styleTag}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Huashu Design 5-Dimension Quality Scorecard */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              4. Tiêu Chuẩn 5 Chiều Huashu Design (5-Dimension Design Audit)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {HUASHU_AUDIT_DIMENSIONS.map((dim) => (
                <div
                  key={dim.code}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono-num font-extrabold text-emerald-600 dark:text-emerald-400">
                      #{dim.code}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white mb-1">
                    {dim.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {dim.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mọi tùy chỉnh được lưu tự động và áp dụng ngay lập tức trên toàn trang.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
