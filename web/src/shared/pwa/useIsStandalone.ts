import { useEffect, useState } from 'react';

function checkStandalone(): boolean {
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isDisplayModeStandalone || isIosStandalone;
}

export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(checkStandalone);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = () => setIsStandalone(checkStandalone());
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isStandalone;
}
