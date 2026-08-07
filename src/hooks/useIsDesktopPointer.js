import { useState, useEffect } from 'react';

export function useIsDesktopPointer() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    // Check if primary input is a fine pointer (mouse / trackpad)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    
    const updatePointer = (e) => setIsDesktop(e.matches);
    setIsDesktop(mediaQuery.matches);

    mediaQuery.addEventListener('change', updatePointer);
    return () => mediaQuery.removeEventListener('change', updatePointer);
  }, []);

  return isDesktop;
}