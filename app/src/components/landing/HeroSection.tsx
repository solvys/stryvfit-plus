'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function HeroSection({ animateIn }: { animateIn: boolean }) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.95]);
  const imgParallax = useTransform(scrollY, [0, 300], [0, 40]);

  return (
    <section
      id="hero"
      className="relative min-h-dvh overflow-hidden bg-bg"
    >
      <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,14,19,0.98)_0%,rgba(7,14,19,0.92)_38%,rgba(7,14,19,0.38)_68%,rgba(7,14,19,0.8)_100%)] md:bg-[linear-gradient(90deg,rgba(7,14,19,0.98)_0%,rgba(7,14,19,0.9)_37%,rgba(7,14,19,0.2)_72%,rgba(7,14,19,0.74)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-bg to-transparent" />

      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.img
          src="/images/hero-training.jpg"
          alt="Stryv Society athlete training in the gym"
          className="h-full w-full object-cover object-[63%_42%] md:object-[72%_44%]"
          style={{ y: imgParallax }}
          draggable={false}
        />
      </div>

      <motion.div
        className="relative z-20 mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-6 pb-14 pt-20 text-left"
        style={{ opacity, scale }}
      >
        <motion.p
          className="font-caption text-xs tracking-[0.2em] uppercase text-gold mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={animateIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Stryv Society Fitness
        </motion.p>

        <h1 className="font-hero max-w-[820px] text-[3.55rem] font-medium uppercase leading-[0.98] tracking-[0.03em] text-text sm:text-7xl md:text-[5.6rem] lg:text-[6.35rem] xl:text-[6.85rem]">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40 }}
            animate={animateIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            Results you can see.
          </motion.span>
          <motion.span
            className="block text-gold"
            initial={{ opacity: 0, y: 40 }}
            animate={animateIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Training you can feel.
          </motion.span>
        </h1>

        <motion.p
          className="font-accent text-sm md:text-base tracking-[0.18em] uppercase text-text-muted mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={animateIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Train With Intention. Build With Purpose.
        </motion.p>

        <motion.p
          className="font-body text-text-muted max-w-xl mt-6 leading-relaxed text-sm md:text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={animateIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          Every session is designed around your goals, your body, and your schedule.
          No cookie-cutter programs. No wasted reps. Just focused, expert-guided training
          that gets you where you want to be, faster.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-10"
          initial={{ opacity: 0, y: 10 }}
          animate={animateIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <a
            href="/book"
            className="inline-flex w-fit items-center px-10 py-4 bg-gold text-bg font-sub text-sm
                       uppercase tracking-[0.15em] transition-all duration-300 hover:bg-gold/90
                       rounded-lg shadow-gold-glow"
          >
            Claim Your Free Session
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden flex-col items-center gap-2 md:flex"
        style={{ opacity: useTransform(scrollY, [0, 200], [1, 0]) }}
      >
        <span className="font-caption text-[10px] tracking-[0.15em] uppercase text-text-dim">
          Scroll
        </span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-gold/50 to-transparent" />
      </motion.div>
    </section>
  );
}
