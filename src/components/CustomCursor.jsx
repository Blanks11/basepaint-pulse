import React, { useEffect, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { CURSORS } from '../utils/cursors';

export default function CustomCursor({ activeCursorId }) {
  // Position is applied directly to the DOM via a ref + requestAnimationFrame,
  // NOT via React state. Driving position through setState on every mousemove
  // forces a full re-render 60-120+ times/sec, which is the main source of
  // perceived lag. Only rare, low-frequency changes (visibility, hover state)
  // go through React state.
  const cursorRef = useRef(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const rafId = useRef(null);

  const [isHoveringPointer, setIsHoveringPointer] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(false);

  const activeCursor =
    CURSORS.find((c) => c.id === activeCursorId) || CURSORS[0];

  const isDesktopPointer =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  useEffect(() => {
    // If not desktop, don't attach tracking
    if (!isDesktopPointer) return;

    const applyPosition = () => {
      rafId.current = null;
      if (cursorRef.current) {
        const { x, y } = targetPos.current;
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    const handleMouseMove = (e) => {
      const insideViewport =
        e.clientX >= 0 &&
        e.clientY >= 0 &&
        e.clientX <= window.innerWidth &&
        e.clientY <= window.innerHeight;

      targetPos.current = { x: e.clientX, y: e.clientY };

      // Batch the actual DOM write to the browser's next paint frame,
      // and skip scheduling a new one if one is already pending.
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(applyPosition);
      }

      // Only trigger a React re-render when these booleans actually flip,
      // not on every pixel of movement.
      setIsCursorVisible((prev) => (prev !== insideViewport ? insideViewport : prev));

      const target = e.target;
      const isClickable =
        target instanceof Element &&
        target.closest('button, a, [role="button"], input, select') !== null;
      setIsHoveringPointer((prev) => (prev !== isClickable ? isClickable : prev));
    };

    const handlePageLeave = () => {
      setIsCursorVisible(false);
    };

    const handlePageEnter = () => {
      setIsCursorVisible(true);
    };

    const handleMouseOut = (e) => {
      if (!e.relatedTarget) {
        handlePageLeave();
      }
    };

    const handlePointerOut = (e) => {
      if (!e.relatedTarget) {
        handlePageLeave();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handlePageLeave, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('pointerout', handlePointerOut, true);
    window.addEventListener('blur', handlePageLeave);
    window.addEventListener('focus', handlePageEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handlePageLeave, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('pointerout', handlePointerOut, true);
      window.removeEventListener('blur', handlePageLeave);
      window.removeEventListener('focus', handlePageEnter);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isDesktopPointer]);

  const cursorImageSrc = isHoveringPointer
    ? activeCursor.pointerCursor
    : activeCursor.defaultCursor;

  if (!isDesktopPointer) {
    return (
      <div className="p-6 bg-[#121721] border border-slate-800 rounded-2xl text-center space-y-3 max-w-md mx-auto my-8">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-full w-fit mx-auto text-slate-400">
          <Smartphone className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">Desktop Feature Only</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Custom cursor equip and preview features are disabled on mobile and touch devices. Switch to a desktop browser with a mouse or trackpad to use the Armory.
        </p>
      </div>
    );
  }

  const selectedCursor = { url: cursorImageSrc };

  return (
    <>
      {/* Custom Cursor Follower */}
      {isCursorVisible && (
        <div
          ref={cursorRef}
          className="fixed top-0 left-0 pointer-events-none z-[9999]"
          style={{ willChange: 'transform' }}
        >
          <img src={selectedCursor.url} alt="cursor" className="w-8 h-8 object-contain" />
        </div>
      )}
    </>
  );
}
