// [claude-code 2026-05-14] Scroll-triggered wordmark-to-insignia swap in navbar

'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV_ITEMS } from '@/hooks/useActiveSection';
import type { SectionId } from '@/hooks/useActiveSection';
import { BrandWordmark } from '@/components/BrandWordmark';
import { Insignia } from '@/components/Insignia';

export default function NavBar({
  activeSection,
  isDark,
}: {
  activeSection: SectionId;
  isDark: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ios-safe-top"
      style={{ backgroundColor: isDark ? 'rgba(12, 10, 8, 0.8)' : 'rgba(12, 10, 8, 0.6)' }}
    >
      <div className="backdrop-blur-xl border-b border-gold/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            aria-label="Stryv Society Fitness home"
            className="inline-flex items-center text-text"
          >
            <motion.div
              animate={{ opacity: scrolled ? 0 : 1, width: scrolled ? 0 : 'auto' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden whitespace-nowrap"
            >
              <BrandWordmark className="w-[220px] md:w-[260px]" />
            </motion.div>
            <motion.div
              animate={{ opacity: scrolled ? 1 : 0, width: scrolled ? 'auto' : 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden whitespace-nowrap"
            >
              <Insignia className="w-14 h-14" />
            </motion.div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.filter((item) => item.label).map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`font-caption text-[10px] tracking-[0.15em] uppercase transition-all duration-300 ${
                  activeSection === item.id
                    ? 'text-gold'
                    : 'text-text-dim hover:text-text-muted'
                }`}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/book"
              className="ml-4 px-4 py-2 glass-button text-gold font-caption text-[10px] tracking-[0.15em] uppercase"
            >
              Claim Your Free Session
            </a>
          </nav>

          {/* Mobile hamburger */}
          <MobileMenu activeSection={activeSection} />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ activeSection }: { activeSection: SectionId }) {
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.label);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-sm border border-gold/15 bg-bg/30"
      >
        <span className={`w-5 h-[1px] bg-text block rounded-full transition-transform ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
        <span className={`w-5 h-[1px] bg-text block rounded-full transition-opacity ${open ? 'opacity-0' : 'opacity-100'}`} />
        <span className={`w-5 h-[1px] bg-text block rounded-full transition-transform ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-4 right-4 top-[calc(100%+8px)] overflow-hidden rounded-md border border-gold/10 bg-bg/95 shadow-glass backdrop-blur-glass"
          >
            <nav className="flex flex-col p-2">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 font-caption text-[11px] uppercase tracking-[0.15em] transition-colors ${
                    activeSection === item.id ? 'text-gold' : 'text-text-muted'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="/book"
                onClick={() => setOpen(false)}
                className="mx-2 mt-2 rounded-sm bg-gold px-4 py-3 text-center font-caption text-[11px] uppercase tracking-[0.15em] text-bg"
              >
                Claim Your Free Session
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
