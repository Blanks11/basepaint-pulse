import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { CURSORS } from '../utils/cursors';

export default function CustomCursor({ activeCursorId }) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
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

    const handleMouseMove = (e) => {
      const insideViewport =
        e.clientX >= 0 &&
        e.clientY >= 0 &&
        e.clientX <= window.innerWidth &&
        e.clientY <= window.innerHeight;

      setPosition({ x: e.clientX, y: e.clientY });
      setIsCursorVisible(insideViewport);

      const target = e.target;
      const isClickable =
        target instanceof Element &&
        target.closest('button, a, [role="button"], input, select') !== null;
      setIsHoveringPointer(isClickable);
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

    window.addEventListener('mousemove', handleMouseMove);
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
          className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          }}
        >
          <img src={selectedCursor.url} alt="cursor" className="w-8 h-8 object-contain" />
        </div>
      )}
    </>
  );
}