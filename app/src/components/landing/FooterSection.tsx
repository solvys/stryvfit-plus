// [claude-code 2026-05-14] Added Insignia to left of BrandWordmark in brand column

'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BrandWordmark } from '@/components/BrandWordmark';
import { Insignia } from '@/components/Insignia';

export default function FooterSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.22], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.22], [30, 0]);

  return (
    <section
      id="footer"
      ref={ref}
      className="relative h-[130dvh] bg-bg"
    >
      <div className="sticky top-0 flex h-dvh items-center px-6 py-20">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

        <div className="max-w-6xl w-full mx-auto">
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-12" style={{ opacity, y }}>
          {/* Brand column */}
          <div>
            <div className="flex items-start gap-2">
              <a href="#hero" aria-label="Stryv Society Fitness home" className="text-text shrink-0">
                <Insignia className="w-14 h-14" />
              </a>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <a href="#hero" aria-label="Stryv Society Fitness home" className="text-text">
                  <BrandWordmark className="w-[240px] max-w-full" />
                </a>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent my-3" />
                <p className="font-body text-text-muted text-xs tracking-[0.15em] uppercase">
                  Fitness
                </p>
              </div>
            </div>
            <p className="font-body text-text-muted text-sm leading-relaxed max-w-xs mt-4">
              Train with Intention. Build with Purpose.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-caption text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Book a Session', href: '/book' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Contact', href: 'mailto:info@stryvsocietyfit.com' },
                { label: 'Privacy Policy', href: '#footer' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-body text-text-muted text-sm hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-caption text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
              Get In Touch
            </h4>
            <ul className="space-y-3">
              <li className="font-body text-text-muted text-sm">info@stryvsocietyfit.com</li>
              <li className="font-body text-text-muted text-sm">
                <a href="/book" className="hover:text-gold transition-colors duration-200">
                  Book a Free Session
                </a>
              </li>
              <li>
                <a
                  href="/book"
                  className="inline-block glass-button text-gold font-caption text-[10px] tracking-[0.15em] uppercase px-4 py-2"
                >
                  Claim Your Free Session →
                </a>
              </li>
            </ul>
          </div>
          </motion.div>

          <motion.div
            className="border-t border-gold/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ opacity: useTransform(scrollYProgress, [0.28, 0.48], [0, 1]) }}
          >
            <p className="font-caption text-[10px] tracking-[0.1em] text-text-dim">
              &copy; {new Date().getFullYear()} Stryv Society Fitness. All rights reserved.
            </p>
            <p className="font-caption text-[10px] tracking-[0.1em] text-text-dim">
              Train With Intention. Build With Purpose.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
