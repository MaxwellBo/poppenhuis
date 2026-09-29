import { useLayoutEffect } from 'react';
import './ps2.css';

/** First-party collection whose pages use the memory-card browser theme. */
export const PS2_COLLECTION_ID = 'ps2-save-icons';

const ARIMO_HREF = 'https://fonts.googleapis.com/css2?family=Arimo:wght@700&display=swap';

export function usePs2Theme(collectionId: string | undefined, surface: 'collection' | 'item' = 'item') {
  const active = collectionId === PS2_COLLECTION_ID;
  useLayoutEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute('data-ps2', surface);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ARIMO_HREF;
    link.dataset.ps2Font = '';
    document.head.appendChild(link);
    return () => {
      document.documentElement.removeAttribute('data-ps2');
      link.remove();
    };
  }, [active, surface]);
}
