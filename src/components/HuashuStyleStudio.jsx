import React, { useState } from 'react';
import { Sliders, X, Check } from 'lucide-react';
import { Mascot, MASCOT_CATALOG, REACTION_METADATA } from './PageMascot.jsx';

/**
 * Authentic Huashu Design System (https://github.com/alchaincyf/huashu-design)
 * Built from Huashu specimens:
 * - 01-personal-annual-report.html (Feltron Uncoated Paper #F3EEE4 + Vermilion #D8341C + Exposed Ink Rules)
 * - 20-swiss-grid-report.html (Swiss International Grid #FFFFFF + #E0311F + 6px Black Rules)
 * - saas-takram.html (Takram Warm Stone #F5F0EB + Botanical Sage #4E7A5B + Serif Display)
 * - 01-hardware-panel.html (Braun / Teenage Engineering Dark Console #111214 + #FF5A1F)
 */

export const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  direction: 'feltron',
  font: 'modern',
  radius: 'sharp',
  texture: 'clean'
} /*EDITMODE-END*/;

export const HUASHU_DIRECTIONS = [
  {
    id: 'feltron',
    name: 'Niên Giám Feltron',
    subtitle: '01-personal-annual-report · Giấy Không Tráng Phủ & Chu Sa',
    badge: 'SPECIMEN 01',
    description:
      'Giấy kem không tráng phủ (#F3EEE4), đường kẻ mực đen phân欄 rõ ràng, điểm nhấn đỏ chu sa (#D8341C) và xanh đá phiến (#4B6479).',
    darkMode: false,
    font: 'modern',
    radius: 'sharp',
    texture: 'clean',
    recommendedMascot: 'fox-riso',
    swatches: ['#F3EEE4', '#1B1B1B', '#D8341C', '#4B6479']
  },
  {
    id: 'swiss',
    name: 'Lưới Thụy Sĩ 12 Cột',
    subtitle: '20-swiss-grid-report · International Typographic Style',
    badge: 'SPECIMEN 20',
    description:
      'Nền trắng phòng triển lãm (#FFFFFF), đường kẻ 3px–6px đen tuyền, chữ số cỡ lớn Archivo và điểm nhấn đỏ Thụy Sĩ (#E0311F).',
    darkMode: false,
    font: 'modern',
    radius: 'sharp',
    texture: 'clean',
    recommendedMascot: 'fox-ink',
    swatches: ['#FFFFFF', '#111111', '#E0311F', '#2B4C7E']
  },
  {
    id: 'takram',
    name: 'Ấn Phẩm Takram',
    subtitle: 'saas-takram · Đá Ấm & Xanh Thảo Mộc',
    badge: 'SHOWCASE TAKRAM',
    description:
      'Nền đá ấm (#F5F0EB), tiêu đề Serif thanh lịch kết hợp màu xanh thảo mộc (#4E7A5B), nhịp điệu yên tĩnh có chiều sâu.',
    darkMode: false,
    font: 'editorial',
    radius: 'sharp',
    texture: 'clean',
    recommendedMascot: 'panda',
    swatches: ['#F5F0EB', '#2B3032', '#4E7A5B', '#B8863B']
  },
  {
    id: 'hardware',
    name: 'Bảng Cơ Khí Braun',
    subtitle: '01-hardware-panel · Dark Industrial Console',
    badge: 'SPECIMEN APP-01',
    description:
      'Bề mặt carbon mờ (#111214), chữ số kỹ thuật độ tương phản cao và cam tín hiệu công nghiệp (#FF5A1F).',
    darkMode: true,
    font: 'technical',
    radius: 'sharp',
    texture: 'clean',
    recommendedMascot: 'fox',
    swatches: ['#111214', '#F2F2EE', '#FF5A1F', '#34D399']
  }
];

/**
 * Bottom-right collapsible `⚙ Tweaks` panel (ported directly from `huashu-design/references/tweaks-system.md`)
 */
export function HuashuTweaksPanel({
  huashuConfig,
  onUpdateConfig,
  onApplyDirection,
  mascotId,
  onSelectMascot,
  onTriggerReaction
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-16 lg:bottom-5 right-3 sm:right-6 z-40"
    >
      {open ? (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--ink)',
            border: '2px solid var(--rule-strong)',
            padding: 16,
            width: 'min(310px, calc(100vw - 24px))',
            boxShadow: '6px 6px 0 var(--rule-strong)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 10,
              marginBottom: 14,
              borderBottom: '2px solid var(--rule-strong)'
            }}
          >
            <div>
              <span
                className="font-mono-num text-[10px] font-bold block"
                style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}
              >
                HUASHU DESIGN v3.2
              </span>
              <strong className="text-sm font-extrabold">Tweaks · Biến Thể Thiết Kế</strong>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 cursor-pointer"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Specimen Theme */}
          <div className="mb-3.5">
            <div
              className="font-mono-num text-[11px] font-bold mb-1.5"
              style={{ color: 'var(--mute)' }}
            >
              01 / PHONG CÁCH MẪU (SPECIMEN)
            </div>
            <div className="space-y-1.5">
              {HUASHU_DIRECTIONS.map((dir) => {
                const active = huashuConfig.direction === dir.id;
                return (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => onApplyDirection(dir)}
                    className="w-full text-left px-2.5 py-2 flex items-center justify-between text-xs font-bold cursor-pointer transition"
                    style={{
                      border: active
                        ? '2px solid var(--accent)'
                        : '1px solid var(--rule)',
                      backgroundColor: active ? 'var(--surface-alt)' : 'var(--bg)',
                      color: 'var(--ink)'
                    }}
                  >
                    <div>
                      <div>{dir.name}</div>
                      <div
                        className="text-[10px] font-normal"
                        style={{ color: 'var(--mute)' }}
                      >
                        {dir.badge}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {dir.swatches.map((c, i) => (
                        <span
                          key={i}
                          style={{
                            width: 11,
                            height: 11,
                            backgroundColor: c,
                            border: '1px solid rgba(0,0,0,0.25)',
                            display: 'inline-block'
                          }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Display Font */}
          <div className="mb-3.5">
            <div
              className="font-mono-num text-[11px] font-bold mb-1.5"
              style={{ color: 'var(--mute)' }}
            >
              02 / KIỂU CHỮ TIÊU ĐỀ (TYPOGRAPHY)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'modern', label: 'Archivo' },
                { id: 'editorial', label: 'Serif' },
                { id: 'technical', label: 'Mono' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdateConfig({ font: f.id })}
                  className="py-1.5 text-xs font-bold cursor-pointer"
                  style={{
                    border:
                      huashuConfig.font === f.id
                        ? '2px solid var(--accent)'
                        : '1px solid var(--rule)',
                    backgroundColor:
                      huashuConfig.font === f.id ? 'var(--accent)' : 'var(--bg)',
                    color:
                      huashuConfig.font === f.id ? 'var(--accent-fg)' : 'var(--ink)'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Mascot Picker */}
          <div className="mb-3">
            <div
              className="font-mono-num text-[11px] font-bold mb-1.5"
              style={{ color: 'var(--mute)' }}
            >
              03 / LINH VẬT (PAGE-MASCOT 3×3)
            </div>
            <select
              value={mascotId}
              onChange={(e) => {
                onSelectMascot(e.target.value);
                if (onTriggerReaction) onTriggerReaction('sparkle');
              }}
              className="w-full px-2.5 py-2 text-xs font-bold cursor-pointer"
              style={{
                border: '1px solid var(--rule-strong)',
                backgroundColor: 'var(--bg)',
                color: 'var(--ink)'
              }}
            >
              {MASCOT_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.styleTag})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onApplyDirection(HUASHU_DIRECTIONS[0])}
            className="w-full py-2 text-xs font-bold cursor-pointer"
            style={{
              border: '1px solid var(--rule-strong)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--ink)'
            }}
          >
            Đặt lại mặc định (Feltron Report)
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold cursor-pointer"
          style={{
            backgroundColor: 'var(--ink)',
            color: 'var(--bg)',
            border: '2px solid var(--rule-strong)',
            boxShadow: '3px 3px 0 var(--accent)'
          }}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>⚙ Tweaks · Giao Diện</span>
        </button>
      )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 overflow-y-auto">
      <div
        className="w-full max-w-4xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg)',
          color: 'var(--ink)',
          border: '3px solid var(--rule-strong)',
          boxShadow: '10px 10px 0 rgba(0,0,0,0.35)'
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            borderBottom: '3px solid var(--rule-strong)',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div>
            <span
              className="font-mono-num text-xs font-bold"
              style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}
            >
              ALCHAINCYF/HUASHU-DESIGN × NILBUILD/PAGE-MASCOT
            </span>
            <h3 className="text-lg font-extrabold mt-0.5">
              Bộ Sưu Tập Trường Phái Thiết Kế & Linh Vật Tương Tác
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold cursor-pointer"
            style={{ border: '1px solid var(--rule-strong)' }}
          >
            Đóng [ESC]
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 4 Specimen Directions */}
          <div>
            <div
              className="font-mono-num text-xs font-bold mb-3"
              style={{ color: 'var(--mute)', letterSpacing: '0.06em' }}
            >
              01 / CHỌN BẢN MẪU THIẾT KẾ (HUASHU SPECIMENS)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HUASHU_DIRECTIONS.map((dir) => {
                const active = huashuConfig.direction === dir.id;
                return (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => onApplyDirection(dir)}
                    className="p-4 text-left cursor-pointer flex flex-col justify-between transition"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: active
                        ? '2px solid var(--accent)'
                        : '1px solid var(--rule-strong)'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-mono-num text-[11px] font-bold"
                          style={{ color: 'var(--accent)' }}
                        >
                          {dir.badge}
                        </span>
                        <div className="flex items-center gap-1">
                          {dir.swatches.map((c, idx) => (
                            <span
                              key={idx}
                              style={{
                                width: 14,
                                height: 14,
                                backgroundColor: c,
                                border: '1px solid rgba(0,0,0,0.3)',
                                display: 'inline-block'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-base font-extrabold">{dir.name}</div>
                      <div
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: 'var(--mute)' }}
                      >
                        {dir.subtitle}
                      </div>
                      <p
                        className="text-xs mt-2 leading-relaxed"
                        style={{ color: 'var(--mute)' }}
                      >
                        {dir.description}
                      </p>
                    </div>
                    <div
                      className="mt-3 pt-2 flex items-center justify-between text-xs font-bold"
                      style={{ borderTop: '1px solid var(--rule)' }}
                    >
                      <span>Linh vật đi kèm: {dir.recommendedMascot}</span>
                      <span style={{ color: active ? 'var(--accent)' : 'var(--ink)' }}>
                        {active ? 'Đang kích hoạt' : 'Áp dụng mẫu này'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Mascot 10 Characters */}
          <div>
            <div
              className="font-mono-num text-xs font-bold mb-3"
              style={{ color: 'var(--mute)', letterSpacing: '0.06em' }}
            >
              02 / LINH VẬT DÕI THEO CHUỘT 9 HƯỚNG & 9 BIỂU CẢM (PAGE-MASCOT)
            </div>
            <div
              className="p-4 space-y-4"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--rule-strong)'
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="p-2"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--rule-strong)'
                    }}
                  >
                    <Mascot
                      directions={currentMascot.directions}
                      reactions={currentMascot.reactions}
                      size={78}
                      externalReaction={externalReaction}
                    />
                  </div>
                  <div>
                    <div className="text-base font-extrabold">{currentMascot.name}</div>
                    <div className="text-xs" style={{ color: 'var(--mute)' }}>
                      {currentMascot.persona}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {REACTION_METADATA.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onTriggerReaction(r.id)}
                      className="px-2.5 py-1 text-xs font-bold cursor-pointer"
                      style={{
                        border: '1px solid var(--rule-strong)',
                        backgroundColor: 'var(--bg)'
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                      className="p-2 text-left flex items-center gap-2 cursor-pointer"
                      style={{
                        border: selected
                          ? '2px solid var(--accent)'
                          : '1px solid var(--rule)',
                        backgroundColor: selected ? 'var(--surface-alt)' : 'var(--bg)'
                      }}
                    >
                      <div
                        className="w-10 h-10 shrink-0"
                        style={{
                          backgroundImage: `url(${m.directions})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: '50% 50%',
                          backgroundSize: '300% 300%'
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{m.name}</div>
                        <div
                          className="text-[10px] truncate"
                          style={{ color: 'var(--mute)' }}
                        >
                          {m.styleTag}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
