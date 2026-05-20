'use client';

import Lenis from 'lenis';
import { useCallback } from 'react';

export function useScrollTo() {
  return useCallback(
    (id: string, offset?: number, mobileOffset?: number) => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY + (offset ?? 0);
        window.scrollTo({ top, behavior: 'smooth' });
      });
    },
    []
  );
}
