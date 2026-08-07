import React, { useState, useEffect } from 'react';
import { useIsDesktopPointer } from './hooks/useIsDesktopPointer';
import {
  ExternalLink,
  Paintbrush,
  RefreshCw,
  Layers,
  Calendar,
  Image as ImageIcon,
  Video,
  Check,
  Clock,
  Sparkles,
  Maximize2,
  X,
  MousePointer,
  Lock,
  Trophy,
} from 'lucide-react';
import { getCurrentDay, getCanvasSize } from './utils/basepaint';
import { CURSORS } from './utils/cursors';
import { BACKGROUND_VARIANTS } from './utils/backgrounds';
import CustomCursor from './components/CustomCursor';

export default function App() {
  const liveDay = getCurrentDay();
  const [currentDay, setCurrentDay] = useState(liveDay);
  const [themeData, setThemeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('image');
  const [copiedHex, setCopiedHex] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);

  // Gamified Cursor System State
  const [activeCursorId, setActiveCursorId] = useState(
    () => localStorage.getItem('bp_active_cursor') || 'material-blue-1'
  );
  const [unlockedCursorIds, setUnlockedCursorIds] = useState(() => {
    const saved = localStorage.getItem('bp_unlocked_cursors');
    return saved ? JSON.parse(saved) : ['material-blue-1'];
  });
  const [unlockedBackgroundIds, setUnlockedBackgroundIds] = useState(() => {
    const saved = localStorage.getItem('bp_unlocked_backgrounds');
    return saved ? JSON.parse(saved) : ['midnight-grid'];
  });

  // User Achievement Tracking
  const [userStats, setUserStats] = useState(() => {
    const saved = localStorage.getItem('bp_user_stats');
    return saved
      ? JSON.parse(saved)
      : {
          hasVisitedPaint: false,
          hasExpandedModal: false,
          copiedPaletteCount: 0,
          daysVisited: [liveDay],
        };
  });

  const [unlockToast, setUnlockToast] = useState(null);
  const [copyNotification, setCopyNotification] = useState(null);
  const [activeBackgroundId, setActiveBackgroundId] = useState(
    () => localStorage.getItem('bp_active_background') || 'midnight-grid'
  );
  const isDesktopPointer = useIsDesktopPointer();

  const size = getCanvasSize(currentDay);

  // Sync Stats & Unlocks
  useEffect(() => {
    localStorage.setItem('bp_unlocked_cursors', JSON.stringify(unlockedCursorIds));
    localStorage.setItem('bp_unlocked_backgrounds', JSON.stringify(unlockedBackgroundIds));
    localStorage.setItem('bp_user_stats', JSON.stringify(userStats));
    localStorage.setItem('bp_active_cursor', activeCursorId);
    localStorage.setItem('bp_active_background', activeBackgroundId);
  }, [unlockedCursorIds, unlockedBackgroundIds, userStats, activeCursorId, activeBackgroundId]);

  // Apply Cursor to Document Root
  useEffect(() => {
    const cursorObj = CURSORS.find((c) => c.id === activeCursorId) || CURSORS[0];
    if (cursorObj) {
      document.documentElement.style.setProperty(
        '--app-cursor-default',
        `url("${cursorObj.defaultCursor}"), auto`
      );
      document.documentElement.style.setProperty(
        '--app-cursor-pointer',
        `url("${cursorObj.pointerCursor}"), pointer`
      );
    }
  }, [activeCursorId]);

  // Check Unlocks Engine
  const checkUnlocks = (updatedStats) => {
    const maybeUnlockItem = (item, unlockedIds, setUnlockedIds) => {
      if (unlockedIds.includes(item.id)) return false;
      let isUnlocked = false;

      if (item.taskKey === 'hasVisitedPaint' && updatedStats.hasVisitedPaint) {
        isUnlocked = true;
      } else if (item.taskKey === 'hasExpandedModal' && updatedStats.hasExpandedModal) {
        isUnlocked = true;
      } else if (item.taskKey === 'copiedPaletteCount' && updatedStats.copiedPaletteCount >= item.targetCount) {
        isUnlocked = true;
      } else if (item.taskKey === 'daysBrowsedCount' && updatedStats.daysVisited.length >= item.targetCount) {
        isUnlocked = true;
      }

      if (isUnlocked) {
        setUnlockedIds((prev) => [...prev, item.id]);
        setUnlockToast(item);
        setTimeout(() => setUnlockToast(null), 4500);
        return true;
      }

      return false;
    };

    CURSORS.forEach((cursor) => {
      maybeUnlockItem(cursor, unlockedCursorIds, setUnlockedCursorIds);
    });

    BACKGROUND_VARIANTS.forEach((variant) => {
      if (variant.taskKey === null) return;
      maybeUnlockItem(variant, unlockedBackgroundIds, setUnlockedBackgroundIds);
    });
  };

  // Track Browsed Days
  useEffect(() => {
    if (!userStats.daysVisited.includes(currentDay)) {
      const updated = { ...userStats, daysVisited: [...userStats.daysVisited, currentDay] };
      setUserStats(updated);
      checkUnlocks(updated);
    }
  }, [currentDay]);

  // Fetch Theme
  useEffect(() => {
    const fetchDayTheme = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://basepaint.xyz/api/theme/${currentDay}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setThemeData(data);
      } catch (err) {
        setThemeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDayTheme();
  }, [currentDay]);

  // Countdown & Cycle Timer
  useEffect(() => {
    const updateCycle = () => {
      const now = Math.floor(Date.now() / 1000);
      const day1Start = 1691599315;
      const currentDayStart = day1Start + (currentDay - 1) * 86400;
      const currentDayEnd = currentDayStart + 86400;
      const diff = currentDayEnd - now;

      const elapsed = Math.max(0, Math.min(86400, now - currentDayStart));
      setProgressPercent(Math.min(100, Math.max(0, (elapsed / 86400) * 100)));

      if (diff <= 0) {
        setTimeLeft('Canvas Closed');
      } else {
        const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const seconds = String(diff % 60).padStart(2, '0');
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    };

    updateCycle();
    const timer = setInterval(updateCycle, 1000);
    return () => clearInterval(timer);
  }, [currentDay]);

  const copyToClipboard = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setCopyNotification(hex);
    setTimeout(() => setCopiedHex(null), 1800);
    setTimeout(() => setCopyNotification(null), 2500);

    const updated = { ...userStats, copiedPaletteCount: userStats.copiedPaletteCount + 1 };
    setUserStats(updated);
    checkUnlocks(updated);
  };

  const handleVisitPaint = () => {
    const updated = { ...userStats, hasVisitedPaint: true };
    setUserStats(updated);
    checkUnlocks(updated);
  };

  const handleExpandModal = () => {
    setIsModalOpen(true);
    const updated = { ...userStats, hasExpandedModal: true };
    setUserStats(updated);
    checkUnlocks(updated);
  };

  const padDay = (day) => String(day).padStart(4, '0');

  const canvasImgUrl =
    currentDay === liveDay
      ? 'https://basepaint.xyz/api/art/image?day=painting&scale=1'
      : `https://basepaint.net/v3/${padDay(currentDay)}.png`;

  const activeBackground = BACKGROUND_VARIANTS.find((bg) => bg.id === activeBackgroundId) || BACKGROUND_VARIANTS[0];

  return (
    <div
      className="min-h-screen text-white flex flex-col font-mono selection:bg-yellow-400 selection:text-black animated-mesh-bg"
      style={{
        '--bg-base': activeBackground.colors.base,
        '--bg-c1': activeBackground.colors.c1,
        '--bg-c2': activeBackground.colors.c2,
        '--bg-c3': activeBackground.colors.c3,
        '--bg-c4': activeBackground.colors.c4,
        '--bg-grid-opacity': activeBackground.gridOpacity ?? 0.04,
        '--bg-grid-size': activeBackground.gridSize ?? '26px',
      }}
    >
      {isDesktopPointer && <CustomCursor activeCursorId={activeCursorId} />}
      {/* Header */}
      <header className="bg-white/16 backdrop-blur-md border-b-2 border-white/35 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.7)]">
        <div
          className="flex items-center space-x-3 cursor-pointer select-none group"
          onClick={() => setCurrentDay(liveDay)}
        >
          <div className="p-1.5 bg-slate-900/50 border border-purple-500/40 rounded-lg group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300 ease-out">
            <img src="/favicon.svg" alt="BasePaint" className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-wider text-white flex items-center gap-2">
              BasePaint <span className="text-purple-400 animate-glow">Pulse</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase hidden xs:block">
              Canvas Intelligence Studio
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsBackgroundModalOpen(true)}
            className="hover-glow flex items-center space-x-1.5 text-xs font-bold px-3 py-2 bg-white/24 backdrop-blur-md border-2 border-white/45 hover:bg-white/40 hover:border-white/60 rounded-lg text-slate-100 transition-all active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Backgrounds</span>
          </button>

          {isDesktopPointer && (
            <button
              onClick={() => setIsArmoryOpen(true)}
              className="hover-glow flex items-center space-x-1.5 text-xs font-bold px-3 py-2 bg-purple-500/30 backdrop-blur-md border border-purple-400/40 hover:bg-purple-500/40 hover:border-purple-300/60 rounded-lg text-white transition-all active:scale-95"
            >
              <MousePointer className="h-4 w-4" />
              <span className="hidden sm:inline">Cursor Armory</span>
              <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-black ml-1">
                {unlockedCursorIds.length}/{CURSORS.length}
              </span>
            </button>
          )}

          <a
            href="https://basepaint.xyz"
            target="_blank"
            rel="noreferrer"
            className="hover-glow flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 bg-white/24 backdrop-blur-md border-2 border-white/45 hover:bg-white/40 hover:border-white/60 rounded-lg text-slate-100 hover:text-white transition-all active:scale-95"
          >
            <span>basepaint.xyz</span>
            <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Navigation & Cycle Bar */}
        <section className="bg-white/24 backdrop-blur-md border-2 border-white/45 p-3.5 sm:p-4 rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.65)] space-y-3 hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.75)] transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-600/50 px-3 py-1.5 rounded-lg hover:border-purple-400/80 hover:bg-purple-900/60 transition-all duration-300">
                <Calendar className="h-4 w-4 text-purple-400" />
                <span className="font-bold text-sm sm:text-base text-purple-300">
                  Day #{padDay(currentDay)}
                </span>
              </div>

              {currentDay === liveDay ? (
                <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400 transition-all duration-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline">Live Canvas</span>
                  <span className="text-emerald-500/60 hidden sm:inline">|</span>
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-emerald-300 animate-bounce-smooth">{timeLeft}</span>
                </div>
              ) : (
                <span className="text-xs bg-gradient-to-r from-slate-800 to-slate-700 text-slate-300 border border-slate-600/50 px-2.5 py-1.5 rounded-lg font-medium hover:from-slate-700 hover:to-slate-600 transition-all duration-300">
                  Archived Canvas
                </span>
              )}
            </div>

            {/* Prev / Today / Next Controls */}
            <div className="flex items-center space-x-1.5 xs:space-x-2">
              <button
                onClick={() => setCurrentDay((prev) => Math.max(1, prev - 1))}
                className="hover-glow px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 active:scale-95 border border-slate-600/60 hover:border-slate-500 rounded-lg text-xs font-bold transition-all duration-300"
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentDay(liveDay)}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-95 border border-cyan-400/50 hover:border-cyan-300 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Today</span>
              </button>
              <button
                onClick={() => setCurrentDay((prev) => prev + 1)}
                disabled={currentDay >= liveDay}
                className="hover-glow px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-600/60 hover:border-slate-500 rounded-lg text-xs font-bold transition-all duration-300"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="w-full bg-slate-900/50 rounded-full h-2 overflow-hidden border border-slate-800/80 shadow-lg">
            <div
              className="bg-gradient-to-r from-purple-500 via-blue-500 via-cyan-400 to-emerald-400 h-full transition-all duration-700 animate-rainbow shadow-lg"
              style={{ width: `${progressPercent}%`, boxShadow: '0 0 16px rgba(168, 85, 247, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.2)' }}
            />
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Canvas Display Viewport */}
          <div className="md:col-span-7 bg-white/24 backdrop-blur-md border-2 border-white/45 p-4 sm:p-5 rounded-xl flex flex-col items-center justify-between space-y-4 shadow-[0_16px_50px_-10px_rgba(0,0,0,0.7)] hover:shadow-[0_20px_60px_-8px_rgba(0,0,0,0.8)] transition-shadow duration-300 group animate-float">
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="bg-white/24 backdrop-blur-sm border-2 border-white/35 px-2 py-0.5 rounded text-slate-200 font-mono">
                  {size}x{size}px
                </span>
                <span className="text-slate-500 text-[11px]">CC0 Public Domain</span>
              </div>

              {currentDay < liveDay && (
                <div className="flex bg-white/24 backdrop-blur-sm border-2 border-white/35 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('image')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                      viewMode === 'image'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold hover:from-purple-500 hover:to-blue-400'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>Art</span>
                  </button>
                  <button
                    onClick={() => setViewMode('timelapse')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                      viewMode === 'timelapse'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold hover:from-purple-500 hover:to-blue-400'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Video className="h-3 w-3" />
                    <span>Timelapse</span>
                  </button>
                </div>
              )}
            </div>

            {/* Render Canvas Box */}
            <div className="relative aspect-square w-full max-w-[380px] sm:max-w-[420px] bg-black/20 backdrop-blur-sm border-2 border-white/40 rounded-lg overflow-hidden flex items-center justify-center shadow-[0_10px_35px_-6px_rgba(0,0,0,0.75)] transition-all duration-300 hover:shadow-[0_14px_45px_-6px_rgba(34,211,238,0.35)] hover:border-white/60">
              {currentDay === liveDay ? (
                <img
                  src={canvasImgUrl}
                  alt={`Active canvas day ${currentDay}`}
                  className="w-full h-full object-contain pixelated"
                />
              ) : viewMode === 'timelapse' ? (
                <video
                  src={`https://basepaint.net/animations/${padDay(currentDay)}.mp4`}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <img
                  src={canvasImgUrl}
                  alt={`BasePaint Day ${currentDay}`}
                  className="w-full h-full object-contain pixelated"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://basepaint.xyz/api/art/image?day=painting&scale=1';
                  }}
                />
              )}

              {/* Expand Button */}
              <button
                onClick={handleExpandModal}
                className="hover-glow absolute top-2 right-2 p-2 bg-white/32 backdrop-blur-sm border-2 border-white/55 hover:bg-white/46 hover:border-white/70 text-slate-200 hover:text-white rounded-lg transition-all duration-300 hover:scale-110 active:scale-95"
                title="Expand Artwork"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between w-full text-[11px] text-slate-500 pt-1">
              <span>
                {currentDay === liveDay
                  ? '• Updating live in real time'
                  : '• Tap expand to inspect pixels'}
              </span>
              <span className="font-mono text-slate-400">Day #{currentDay}</span>
            </div>
          </div>

          {/* Canvas Metadata & Palette Section */}
          <div className="md:col-span-5 bg-white/24 backdrop-blur-md border-2 border-white/45 p-5 sm:p-6 rounded-xl flex flex-col justify-between space-y-5 shadow-[0_16px_50px_-10px_rgba(0,0,0,0.7)] hover:shadow-[0_20px_60px_-8px_rgba(0,0,0,0.8)] transition-shadow duration-300 group animate-float-delay">
            <div>
              <div className="flex items-center space-x-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Daily Theme</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                {loading ? (
                  <span className="animate-pulse text-slate-600">Loading...</span>
                ) : (
                  themeData?.theme || 'Untitled Canvas'
                )}
              </h2>

              {themeData?.proposer && (
                <div className="bg-white/24 backdrop-blur-sm border-2 border-white/35 px-2 py-0.5 rounded text-xs text-slate-300 font-mono">
                  Proposed by: <span className="text-yellow-300 font-bold">{themeData.proposer}</span>
                </div>
              )}
            </div>

            {/* Interactive Palette */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-yellow-400" />
                  <span>Color Palette ({themeData?.palette?.length || 0})</span>
                </h3>
                <span className="text-[10px] text-slate-500">Tap color to copy</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {themeData?.palette?.map((hex, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyToClipboard(hex)}
                    className="group relative flex flex-col items-center p-1.5 rounded-lg bg-white/24 backdrop-blur-sm border-2 border-white/35 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)] hover:bg-white/40 hover:border-white/60 hover:shadow-[0_6px_20px_-4px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <div
                      className="w-full h-8 rounded border-2 border-white/45 shadow-inner group-hover:shadow-lg group-hover:border-white/70 transition-all duration-200"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200 mt-1 flex items-center space-x-0.5 transition-colors duration-200">
                      {copiedHex === hex ? (
                        <Check className="h-3 w-3 text-emerald-400 animate-bounce-smooth" />
                      ) : (
                        <span>{hex}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paint Launch Button */}
            <div className="pt-2">
              <a
                href="https://basepaint.xyz/paint"
                target="_blank"
                rel="noreferrer"
                onClick={handleVisitPaint}
                className="hover-glow w-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 hover:from-purple-500 hover:via-blue-400 hover:to-cyan-300 active:scale-95 text-white font-extrabold text-center py-3 px-4 rounded-lg border border-cyan-300/50 hover:border-cyan-200 transition-all duration-300 flex items-center justify-center space-x-2 text-sm"
              >
                <Paintbrush className="h-4 w-4" />
                <span>Paint & Contribute on BasePaint</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Background Modal */}
      {isBackgroundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="bg-white/32 backdrop-blur-lg border-2 border-white/55 rounded-2xl p-5 sm:p-6 max-w-3xl w-full space-y-5 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] relative">
            <button
              onClick={() => setIsBackgroundModalOpen(false)}
              className="hover-glow absolute top-4 right-4 p-1.5 bg-white/40 backdrop-blur-sm border-2 border-white/55 hover:bg-white/52 hover:border-white/70 text-slate-200 hover:text-white rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-600/30 border border-purple-400/50 rounded-xl">
                <Sparkles className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Background Gallery</h3>
                <p className="text-xs text-slate-300">Unlock and apply new page backgrounds by using the app.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {BACKGROUND_VARIANTS.map((variant) => {
                const isUnlocked = variant.taskKey === null || unlockedBackgroundIds.includes(variant.id);
                const isActive = activeBackgroundId === variant.id;

                return (
                  <div
                    key={variant.id}
                    className={`rounded-2xl p-3.5 border transition-all ${
                      isActive
                        ? 'bg-purple-600/40 backdrop-blur-md border-2 border-purple-300/60'
                        : isUnlocked
                        ? 'bg-white/24 backdrop-blur-md border-white/45 hover:bg-white/32 hover:border-white/60'
                        : 'bg-white/16 backdrop-blur-md border-white/25 opacity-60'
                    }`}
                  >
                    <div className="relative overflow-hidden rounded-2xl mb-3 h-24 bg-black/20">
                      <div
                        className="absolute inset-0 animated-mesh-bg animated-mesh-bg-mini"
                        style={{
                          '--bg-base': variant.colors.base,
                          '--bg-c1': variant.colors.c1,
                          '--bg-c2': variant.colors.c2,
                          '--bg-c3': variant.colors.c3,
                          '--bg-c4': variant.colors.c4,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{variant.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-tight">{variant.description}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        onClick={() => isUnlocked && setActiveBackgroundId(variant.id)}
                        disabled={!isUnlocked}
                        className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                          isActive
                            ? 'bg-emerald-400 text-black cursor-default'
                            : isUnlocked
                            ? 'hover-glow bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isActive ? 'Active' : isUnlocked ? 'Apply' : 'Locked'}
                      </button>
                      {!isUnlocked && (
                        <span className="rounded-full bg-yellow-400/10 border border-yellow-400/30 px-2 py-1 text-[10px] text-yellow-300 font-mono">
                          {variant.requirementText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cursor Armory Modal */}
      {isArmoryOpen && isDesktopPointer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="bg-white/32 backdrop-blur-lg border-2 border-white/55 rounded-2xl p-5 sm:p-6 max-w-3xl w-full space-y-5 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] relative">
            <button
              onClick={() => setIsArmoryOpen(false)}
              className="hover-glow absolute top-4 right-4 p-1.5 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-yellow-400/10 border border-yellow-400/30 rounded-xl">
                <Trophy className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Cursor Armory</h3>
                <p className="text-xs text-slate-400">Unlock retro pixel cursors by using the app.</p>
              </div>
            </div>

            {/* Cursor Cards List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {CURSORS.map((cursor) => {
                // A cursor is unlocked if it's in unlockedCursorIds OR if it has no task (default)
                const isUnlocked = unlockedCursorIds.includes(cursor.id) || cursor.taskKey === null;
                const isEquipped = activeCursorId === cursor.id;

                return (
                  <div
                    key={cursor.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isEquipped
                        ? 'bg-purple-600/40 backdrop-blur-md border-2 border-purple-300/60'
                        : isUnlocked
                        ? 'bg-white/24 backdrop-blur-md border-white/45 hover:bg-white/32 hover:border-white/60'
                        : 'bg-white/16 backdrop-blur-md border-white/25 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 bg-white/32 backdrop-blur-sm border-2 border-white/45 rounded-lg w-10 h-10 flex items-center justify-center">
                        <img
                          src={cursor.previewImage}
                          alt={cursor.name}
                          className="w-7 h-7 object-contain pixelated"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-white">{cursor.name}</h4>
                          {isEquipped && (
                            <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase">
                              Equipped
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{cursor.description}</p>
                        {!isUnlocked && (
                          <div className="flex items-center space-x-1 text-[11px] text-yellow-400/90 mt-1 font-mono">
                            <Lock className="h-3 w-3" />
                            <span>{cursor.requirementText}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <button
                          onClick={() => setActiveCursorId(cursor.id)}
                          disabled={isEquipped}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isEquipped
                              ? 'bg-slate-800 text-slate-500 cursor-default'
                              : 'hover-glow bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                          }`}
                        >
                          {isEquipped ? 'Active' : 'Equip'}
                        </button>
                      ) : (
                        <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40 text-slate-500">
                          <Lock className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unlock Toast Notification */}
      {unlockToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gradient-to-r from-purple-600 to-blue-600 border-2 border-purple-300 p-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-bounce scale-in">
          <div className="text-3xl animate-bounce-smooth">{unlockToast.icon}</div>
          <div>
            <div className="text-xs text-purple-200 font-bold uppercase tracking-wider">
              New Cursor Unlocked!
            </div>
            <div className="text-sm font-extrabold text-white">{unlockToast.name}</div>
            <div className="text-[11px] text-purple-100">Available in Cursor Armory</div>
          </div>
        </div>
      )}

      {/* Color Copy Notification */}
      {copyNotification && (
        <div className="fixed top-24 right-5 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-300/50">
            <Check className="h-5 w-5 animate-bounce-smooth" />
            <div>
              <div className="text-sm font-bold">Color Copied!</div>
              <div className="text-xs text-white/80 font-mono">{copyNotification}</div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Inspector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-4 flex flex-col items-center justify-center">
          <button
            onClick={() => setIsModalOpen(false)}
            className="hover-glow absolute top-4 right-4 p-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="max-w-2xl max-h-[80vh] aspect-square w-full flex items-center justify-center p-2">
            <img
              src={canvasImgUrl}
              alt={`BasePaint Day ${currentDay}`}
              className="max-w-full max-h-full object-contain pixelated rounded-lg border border-slate-800"
            />
          </div>
          <p className="text-xs text-slate-400 mt-3 font-mono">
            Day #{padDay(currentDay)} — Full Pixel Inspector
          </p>
        </div>
      )}

      {/* Tracking Beacon */}
      <img
        src="https://basepaint.xyz/api/beacon.gif?ref=basepaint-pulse"
        width="1"
        height="1"
        alt=""
        className="hidden"
      />
    </div>
  );
}
