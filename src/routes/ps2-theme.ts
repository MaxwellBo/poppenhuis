import { useLayoutEffect } from 'react';
import './ps2.css';

/** First-party collection whose pages use the memory-card browser theme. */
export const PS2_COLLECTION_ID = 'ps2-save-icons';

export function usePs2Theme(collectionId: string | undefined) {
  const active = collectionId === PS2_COLLECTION_ID;
  useLayoutEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute('data-ps2', '');
    return () => {
      document.documentElement.removeAttribute('data-ps2');
    };
  }, [active]);
}
