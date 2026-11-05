import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ChevronUp, ChevronDown, Heart, Smile, Zap, Eye } from 'lucide-react';

/**
 * Ported directly from https://github.com/nilbuild/page-mascot (components/mascot.tsx)
 * 3x3 Directions Sprite Grid:
 *   0: top-left    1: top     2: top-right
 *   3: left        4: center  5: right
 *   6: bottom-left 7: bottom  8: bottom-right
 *
 * 3x3 Reactions Sprite Grid:
 *   0: blink       1: heart     2: sparkle
 *   3: surprised   4: wink      5: bashful
 *   6: sleepy      7: dizzy     8: delighted
 */

const ANGLE_TO_INDEX = [
  5, // E  (  0°) → right
  8, // SE ( 45°) → bottom-right
  7, // S  ( 90°) → bottom
  6, // SW (135°) → bottom-left
  3, // W  (180°) → left
  0, // NW (225°) → top-left
  1, // N  (270°) → top
  2  // NE (315°) → top-right
];

const REACTION_INDICES = {
  blink: 0,
  heart: 1,
  sparkle: 2,
  surprised: 3,
  wink: 4,
  bashful: 5,
  sleepy: 6,
  dizzy: 7,
  delighted: 8
};

export const REACTION_METADATA = [
  { id: 'heart', label: 'Yêu thích', emoji: '❤️' },
  { id: 'sparkle', label: 'Lấp lánh', emoji: '✨' },
  { id: 'delighted', label: 'Hào hứng', emoji: '😄' },
  { id: 'wink', label: 'Nháy mắt', emoji: '😉' },
  { id: 'bashful', label: 'Ngại ngùng', emoji: '☺️' },
  { id: 'surprised', label: 'Bất ngờ', emoji: '😮' },
  { id: 'sleepy', label: 'Buồn ngủ', emoji: '😴' },
  { id: 'dizzy', label: 'Chóng mặt', emoji: '😵‍💫' }
];

const BOOP_REACTIONS = [
  REACTION_INDICES.heart,
  REACTION_INDICES.sparkle,
  REACTION_INDICES.surprised,
  REACTION_INDICES.wink,
  REACTION_INDICES.bashful,
  REACTION_INDICES.delighted
];

export const MASCOT_CATALOG = [
  {
    id: 'fox',
    name: 'Cáo Tài Chính',
    styleTag: 'Chibi Classic',
    persona: 'Nhanh nhạy săn ưu đãi & canh ngân sách',
    directions: '/mascots/fox-directions.webp',
    reactions: '/mascots/fox-reactions.webp',
    accent: '#ea580c'
  },
  {
    id: 'fox-riso',
    name: 'Cáo Bản In Riso',
    styleTag: 'Huashu Editorial',
    persona: 'Phong cách in khắc Riso nghệ thuật trên giấy ấm',
    directions: '/mascots/fox-riso-directions.webp',
    reactions: '/mascots/fox-riso-reactions.webp',
    accent: '#c83e2b'
  },
  {
    id: 'fox-ink',
    name: 'Cáo Thủy Mặc',
    styleTag: 'Huashu Ink',
    persona: 'Nét cọ mực tàu tối giản, tĩnh tại quản lý tài sản',
    directions: '/mascots/fox-ink-directions.webp',
    reactions: '/mascots/fox-ink-reactions.webp',
    accent: '#1e293b'
  },
  {
    id: 'cat',
    name: 'Mèo Chiêu Tài',
    styleTag: 'Lucky Neko',
    persona: 'Giữ tiền chặt, nhắc bạn mỗi khi định vung tay quá trán',
    directions: '/mascots/cat-directions.webp',
    reactions: '/mascots/cat-reactions.webp',
    accent: '#d97706'
  },
  {
    id: 'panda',
    name: 'Gấu Trúc Tích Lũy',
    styleTag: 'Zen Saver',
    persona: 'Bình tĩnh gom từng khoản tiết kiệm nhỏ mỗi ngày',
    directions: '/mascots/panda-directions.webp',
    reactions: '/mascots/panda-reactions.webp',
    accent: '#059669'
  },
  {
    id: 'otter',
    name: 'Rái Cá Thông Thái',
    styleTag: 'Smart Planner',
    persona: 'Chuyên gia phân bổ thu nhập & tối ưu chi phí sinh hoạt',
    directions: '/mascots/otter-directions.webp',
    reactions: '/mascots/otter-reactions.webp',
    accent: '#0284c7'
  },
  {
    id: 'redpanda',
    name: 'Gấu Đỏ Năng Động',
    styleTag: 'Vibrant',
    persona: 'Luôn tràn đầy năng lượng khi bạn đạt kỷ lục tiết kiệm',
    directions: '/mascots/redpanda-directions.webp',
    reactions: '/mascots/redpanda-reactions.webp',
    accent: '#dc2626'
  },
  {
    id: 'owl',
    name: 'Cú Đêm Phân Tích',
    styleTag: 'Night Analyst',
    persona: 'Soi kỹ từng biến động chi tiêu tháng này so với tháng trước',
    directions: '/mascots/owl-directions.webp',
    reactions: '/mascots/owl-reactions.webp',
    accent: '#7c3aed'
  },
  {
    id: 'bunny',
    name: 'Thỏ Hũ Vàng',
    styleTag: 'Goal Keeper',
    persona: 'Chăm chỉ nuôi các hũ mục tiêu tài chính dài hạn',
    directions: '/mascots/bunny-directions.webp',
    reactions: '/mascots/bunny-reactions.webp',
    accent: '#ec4899'
  },
  {
    id: 'frog',
    name: 'Ếch Xanh Thịnh Vượng',
    styleTag: 'Cashflow Frog',
    persona: 'Nhảy vọt dòng tiền ròng mỗi kỳ lương về',
    directions: '/mascots/frog-directions.webp',
    reactions: '/mascots/frog-reactions.webp',
    accent: '#16a34a'
  }
];

function spritePos(index) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    backgroundPosition: `${col * 50}% ${row * 50}%`,
    backgroundSize: '300% 300%'
  };
}

/**
 * Core `<Mascot />` component from `nilbuild/page-mascot`
 */
export function Mascot({
  directions = '/mascots/fox-directions.webp',
  reactions = '/mascots/fox-reactions.webp',
  size = 96,
  externalReaction = null,
  onBoop = null,
  className = ''
}) {
  const containerRef = useRef(null);
  const [directionIndex, setDirectionIndex] = useState(4); // Center
  const [activeReaction, setActiveReaction] = useState(null);
  const [boopTransform, setBoopTransform] = useState('scale(1)');
  const clickTimesRef = useRef([]);
  const reactionTimeoutRef = useRef(null);
  const boopTimeoutsRef = useRef([]);
  const lastReactionIndexRef = useRef(null);

  // Preload both sprite sheets
  useEffect(() => {
    const img1 = new Image();
    img1.src = directions;
    if (reactions) {
      const img2 = new Image();
      img2.src = reactions;
    }
  }, [directions, reactions]);

  // Trigger external reaction when parent passes a new event (e.g. transaction added, budget applied)
  useEffect(() => {
    if (!externalReaction || !reactions) return;
    const idx =
      typeof externalReaction.type === 'number'
        ? externalReaction.type
        : REACTION_INDICES[externalReaction.type] ?? REACTION_INDICES.sparkle;

    clearTimeout(reactionTimeoutRef.current);
    setActiveReaction(idx);
    setBoopTransform('scaleX(1.1) scaleY(0.9)');
    const t1 = setTimeout(() => setBoopTransform('scaleX(0.95) scaleY(1.05)'), 100);
    const t2 = setTimeout(() => setBoopTransform('scale(1)'), 220);
    boopTimeoutsRef.current.push(t1, t2);

    reactionTimeoutRef.current = setTimeout(() => {
      setActiveReaction(null);
    }, externalReaction.duration || 1100);
  }, [externalReaction, reactions]);

  // Cursor tracking across 9 directions
  useEffect(() => {
    let rafId = 0;
    const onMouseMove = (e) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < size * 0.6) {
          setDirectionIndex(4);
          return;
        }

        const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const sector = Math.round(angle / 45) % 8;
        setDirectionIndex(ANGLE_TO_INDEX[sector]);
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [size]);

  // Periodic natural blink when looking center & idle
  useEffect(() => {
    if (!reactions) return;
    let blinkTimer;
    let resetTimer;
    let cancelled = false;

    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 3000;
      blinkTimer = setTimeout(() => {
        if (cancelled) return;
        setActiveReaction((current) => {
          if (current !== null) return current;
          resetTimer = setTimeout(() => {
            if (!cancelled) setActiveReaction(null);
          }, 160);
          return REACTION_INDICES.blink;
        });
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();
    return () => {
      cancelled = true;
      clearTimeout(blinkTimer);
      clearTimeout(resetTimer);
    };
  }, [reactions]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timeouts = boopTimeoutsRef.current;
    return () => {
      clearTimeout(reactionTimeoutRef.current);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Squash-and-stretch spring boop + rapid click dizzy detection
  const handleClick = useCallback(() => {
    boopTimeoutsRef.current.forEach(clearTimeout);
    boopTimeoutsRef.current = [];

    setBoopTransform('scaleX(1.14) scaleY(0.86)');
    boopTimeoutsRef.current.push(
      setTimeout(() => setBoopTransform('scaleX(0.94) scaleY(1.06)'), 90),
      setTimeout(() => setBoopTransform('scale(1)'), 210)
    );

    if (!reactions) return;

    clearTimeout(reactionTimeoutRef.current);
    const now = Date.now();
    clickTimesRef.current = clickTimesRef.current.filter((t) => now - t < 1500);
    clickTimesRef.current.push(now);

    if (clickTimesRef.current.length >= 4) {
      clickTimesRef.current = [];
      setActiveReaction(REACTION_INDICES.dizzy);
      if (onBoop) onBoop('dizzy');
      reactionTimeoutRef.current = setTimeout(() => {
        setActiveReaction(null);
      }, 1400);
    } else {
      const candidates = BOOP_REACTIONS.filter((r) => r !== lastReactionIndexRef.current);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      lastReactionIndexRef.current = pick;
      setActiveReaction(pick);
      const reactionName =
        Object.keys(REACTION_INDICES).find((k) => REACTION_INDICES[k] === pick) || 'sparkle';
      if (onBoop) onBoop(reactionName);
      reactionTimeoutRef.current = setTimeout(() => {
        setActiveReaction(null);
      }, 850);
    }
  }, [reactions, onBoop]);

  const showingReaction = activeReaction !== null && reactions;
  const sheet = showingReaction ? reactions : directions;
  const index = showingReaction ? activeReaction : directionIndex;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      title="Chạm vào linh vật để tương tác (chạm 4 lần liên tiếp sẽ làm bé chóng mặt!)"
      className={`select-none cursor-pointer relative inline-block ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundRepeat: 'no-repeat',
        ...spritePos(index),
        transform: boopTransform,
        transition: 'transform 110ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    />
  );
}

/**
 * Floating & Sidebar Interactive Financial Mascot Widget (`nilbuild/page-mascot` integration)
 */
export function PageMascotCompanion({
  mascotId,
  onSelectMascot,
  externalReaction,
  speechMessage,
  onTriggerReaction,
  totalNetWorth,
  monthExpense,
  totalMonthlyBudget
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSpeech, setLocalSpeech] = useState('');

  const currentMascot =
    MASCOT_CATALOG.find((m) => m.id === mascotId) || MASCOT_CATALOG[0];

  const BOOP_QUOTES = {
    dizzy: 'Áaa bạn chạm nhanh quá làm mình hoa cả mắt rồi! 😵‍💫',
    heart: 'Cảm ơn bạn đã ghi chép chi tiêu đều đặn mỗi ngày! ❤️',
    sparkle: 'Mỗi khoản tiết kiệm nhỏ hôm nay là tự do tài chính ngày mai! ✨',
    surprised: 'Ồ! Nhớ kiểm tra hạn mức chi an toàn mỗi ngày trước khi chốt đơn nhé! 😮',
    wink: 'Mẹo nhỏ: Nhấn phím [N] để ghi giao dịch mới siêu tốc trong 3 giây! 😉',
    bashful: 'Mình luôn dõi theo con trỏ chuột của bạn để canh giữ ví tiền đó! ☺️',
    delighted: 'Tuyệt vời! Quản lý dòng tiền rõ ràng giúp cuộc sống nhẹ nhàng hơn hẳn! 😄',
    sleepy: 'Nếu hôm nay không tiêu gì (No-Spend Day), ví tiền sẽ rất bình yên! 😴'
  };

  const handleBoop = (reactionName) => {
    setLocalSpeech(BOOP_QUOTES[reactionName] || BOOP_QUOTES.sparkle);
  };

  // Determine smart status line
  const statusTip =
    speechMessage ||
    localSpeech ||
    (totalMonthlyBudget > 0 && monthExpense > totalMonthlyBudget
      ? 'Cảnh báo: Chi tiêu tháng này đã vượt ngân sách dự kiến!'
      : totalNetWorth === 0 && monthExpense === 0
      ? 'Chào bạn! Hãy nhập thu nhập hoặc chạm vào mình để khám phá nhé!'
      : currentMascot.persona);

  return (
    <div className="fixed bottom-16 lg:bottom-5 left-4 sm:left-6 z-40 flex flex-col items-start">
      {/* Expanded Mascot Picker & Expression Studio Drawer */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Page Mascot Companion
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Linh vật tương tác dõi theo chuột (nilbuild/page-mascot)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Thu gọn
            </button>
          </div>

          {/* Character Grid (10 Mascots) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Chọn linh vật đồng hành ({MASCOT_CATALOG.length} nhân vật):
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {currentMascot.styleTag}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {MASCOT_CATALOG.map((item) => {
                const selected = item.id === currentMascot.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectMascot(item.id);
                      setLocalSpeech(`Xin chào! Mình là ${item.name} — ${item.persona}`);
                      if (onTriggerReaction) onTriggerReaction('sparkle');
                    }}
                    className={`group flex flex-col items-center p-1.5 rounded-2xl border transition cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/60 ring-2 ring-emerald-500/25'
                        : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className="w-11 h-11 rounded-xl"
                      style={{
                        backgroundImage: `url(${item.directions})`,
                        backgroundRepeat: 'no-repeat',
                        ...spritePos(4)
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate w-full text-center mt-1">
                      {item.name.replace(/^(Cáo|Mèo|Gấu|Rái|Cú|Thỏ|Ếch)\s+/, '$1 ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instant Expression Triggers (9 Sprite Reactions) */}
          <div>
            <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
              Thử biểu cảm trực tiếp (9 trạng thái Reactions Sprite):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REACTION_METADATA.map((react) => (
                <button
                  key={react.id}
                  type="button"
                  onClick={() => {
                    if (onTriggerReaction) onTriggerReaction(react.id);
                    handleBoop(react.id);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 border border-slate-200/70 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  {react.emoji} {react.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mascot Dock Bar with Live Cursor-Tracking Character & Speech Bubble */}
      <div className="flex items-end gap-2.5">
        <div className="relative group rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 shadow-xl p-1.5 flex items-center gap-2">
          <div className="relative rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 p-1">
            <Mascot
              directions={currentMascot.directions}
              reactions={currentMascot.reactions}
              size={68}
              externalReaction={externalReaction}
              onBoop={handleBoop}
            />
            <span
              className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-white shadow"
              style={{ backgroundColor: currentMascot.accent }}
            >
              3×3
            </span>
          </div>

          <div className="pr-2 max-w-[200px] sm:max-w-[240px]">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                {currentMascot.name}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-100 transition cursor-pointer shrink-0"
              >
                <span>Đổi linh vật</span>
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300 line-clamp-2">
              {statusTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
