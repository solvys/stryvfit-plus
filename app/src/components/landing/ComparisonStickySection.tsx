// [claude-code 2026-05-14] Fade in cards on scroll, removed connecting box-shadow grid border

'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

const comparisons = [
  {
    without: {
      title: 'Without StryvFit',
      feeling: 'You wake up tired. Motivation fades by week three.',
      body: 'Joints ache. Energy crashes mid-day. You talk yourself out of it.',
    },
    with: {
      title: 'With StryvFit',
      feeling: 'You wake up ready. Every session builds momentum.',
      body: 'Joints move freely. Energy is steady. Your coach expects you to show up.',
    },
  },
  {
    without: {
      title: 'Without StryvFit',
      feeling: 'You guess at the gym. Results stall.',
      body: 'No progression. No form correction. Spinning your wheels.',
    },
    with: {
      title: 'With StryvFit',
      feeling: 'Every rep has a purpose. Progress is measurable.',
      body: 'Progressive overload. Form corrected in real time. You see the numbers move.',
    },
  },
  {
    without: {
      title: 'Without StryvFit',
      feeling: 'You try to eat clean but have no roadmap.',
      body: 'Meal prep is overwhelming. Nutrition is inconsistent.',
    },
    with: {
      title: 'With StryvFit',
      feeling: 'Your nutrition is dialed in. Fuel meets demand.',
      body: 'Personalized meal plan. Macros calculated. Meal prep streamlined.',
    },
  },
  {
    without: {
      title: 'Without StryvFit',
      feeling: 'Burnout is inevitable. You quit again.',
      body: 'No structured recovery. Motivation tanks. You stop showing up.',
    },
    with: {
      title: 'With StryvFit',
      feeling: 'Recovery is built in. Progress compounds.',
      body: 'Deload weeks. Mobility sessions. Long-term consistency.',
    },
  },
];

const CARD_PEEK = 80;

export default function ComparisonStickySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const total = comparisons.length;

  return (
    <section
      id="comparison"
      ref={sectionRef}
      className="relative"
      style={{ height: `${total * 70 + 120}vh` }}
    >
      <div className="sticky top-0 h-dvh overflow-hidden bg-bg flex flex-col">
        {/* Header */}
        <motion.div
          className="flex-shrink-0 flex flex-col items-center justify-center text-center px-6 pt-20 pb-2 z-50 relative"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.12], [1, 0]),
            y: useTransform(scrollYProgress, [0, 0.12], [0, -20]),
          }}
        >
          <p className="font-caption text-[10px] tracking-[0.2em] uppercase text-gold/60 mb-3">
            The Difference
          </p>
          <h2 className="font-hero text-3xl md:text-5xl tracking-[0.04em] text-text leading-[1.1]">
            Without StryvFit vs.
            <br />
            <span className="text-gold">With StryvFit</span>
          </h2>
          <p className="font-body text-text-muted text-xs md:text-sm max-w-xl mt-3 leading-relaxed">
            Scroll through to see how your body feels, performs, and recovers —
            with and without expert coaching.
          </p>
        </motion.div>

        {/* Solitaire card pile */}
        <div className="flex-1 relative max-w-5xl mx-auto w-full px-4 md:px-6">
          {comparisons.map((item, i) => (
            <ComparisonCard
              key={i}
              item={item}
              index={i}
              total={total}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>

        {/* Progress dots */}
        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
          {comparisons.map((_, i) => (
            <ProgressDot
              key={i}
              index={i}
              total={total}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonCard({
  item,
  index,
  total,
  scrollYProgress,
}: {
  item: (typeof comparisons)[0];
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const segStart = index / total;
  const segEnd = (index + 1) / total;

  const stackY = index * CARD_PEEK;

  const slideIn = useTransform(
    scrollYProgress,
    [segStart, segStart + 0.5 / total],
    [400 + stackY, stackY]
  );

  const scale = useTransform(
    scrollYProgress,
    [segStart, segStart + 0.3 / total],
    [0.92, 1]
  );

  const fadeIn = useTransform(
    scrollYProgress,
    [segStart, segStart + 0.4 / total],
    [0, 1]
  );

  const zIndex = index + 1;

  const activeProgress = useTransform(
    scrollYProgress,
    [segStart, segStart + 0.4 / total, segEnd - 0.2 / total, segEnd],
    [0, 1, 1, 0]
  );

  return (
    <motion.div
      className="absolute left-0 right-0"
      style={{ y: slideIn, scale, zIndex, opacity: fadeIn }}
    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3"
      >
        {/* Without StryvFit */}
        <div className="glass-card-intense border-red-900/20 overflow-hidden">
          <div className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span className="font-caption text-[9px] tracking-[0.15em] uppercase text-red-400/60">
                {item.without.title}
              </span>
            </div>
            <p className="font-hero text-xs md:text-sm tracking-[0.02em] text-red-300/80 mb-1">
              {item.without.feeling}
            </p>
            <p className="font-body text-text-muted text-[11px] leading-relaxed line-clamp-2">
              {item.without.body}
            </p>
          </div>
        </div>

        {/* With StryvFit */}
        <div className="glass-card-intense border-gold/15 overflow-hidden">
          <div className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="font-caption text-[9px] tracking-[0.15em] uppercase text-gold/80">
                {item.with.title}
              </span>
            </div>
            <p className="font-hero text-xs md:text-sm tracking-[0.02em] text-gold mb-1">
              {item.with.feeling}
            </p>
            <p className="font-body text-text-muted text-[11px] leading-relaxed line-clamp-2">
              {item.with.body}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProgressDot({
  index,
  total,
  scrollYProgress,
}: {
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const backgroundColor = useTransform(
    scrollYProgress,
    [index / total, (index + 1) / total],
    ['rgba(242,79,9,1)', 'rgba(242,79,9,0.2)']
  );

  return <motion.div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor }} />;
}
