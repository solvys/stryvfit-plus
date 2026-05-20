'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

const plans = [
  {
    name: 'First Session',
    price: 'FREE',
    period: '',
    description: 'Your first training session and full assessment, on the house. Walk in, get evaluated, train.',
    features: [
      '60-minute training session',
      'Movement & strength assessment',
      'Goal-setting consultation',
      'Personalized recommendation',
    ],
    cta: 'Book a Session',
    highlighted: true,
  },
  {
    name: 'Coaching',
    price: '$100',
    period: '/Month',
    description: 'Online coaching for clients training anywhere. Programming and accountability, no studio required.',
    features: [
      'Custom weekly workout plan',
      'Exercise breakdowns',
      'Weekly check-ins',
      'Form review (video feedback)',
    ],
    cta: 'Book a Session',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$200',
    period: '/Month',
    description: 'The full Stryv online experience. Eight live coaching sessions a month, plus everything in Coaching.',
    features: [
      '8 online coaching sessions (1 hr each)',
      'Custom weekly workout plan',
      'Weekly check-ins',
      'Form review (video feedback)',
    ],
    cta: 'Book a Session',
    highlighted: false,
  },
];

export default function PricingSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      id="pricing"
      ref={ref}
      className="relative min-h-dvh flex flex-col items-center justify-center px-6 py-0"
    >
      <div className="max-w-6xl w-full mx-auto">
        <motion.div
          className="text-center mb-16"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.1], [0, 1]),
            y: useTransform(scrollYProgress, [0, 0.1], [30, 0]),
          }}
        >
          <p className="font-caption text-[10px] tracking-[0.2em] uppercase text-gold/60 mb-4">
            Find Your Path
          </p>
          <h2 className="font-hero text-4xl md:text-6xl tracking-[0.04em] text-text leading-[1.1]">
            Choose Your
            <br />
            <span className="text-gold">Experience</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} scrollYProgress={scrollYProgress} />
          ))}
        </div>

        <motion.p
          className="font-body text-text-muted text-center text-sm mt-12 max-w-2xl mx-auto leading-relaxed"
          style={{
            opacity: useTransform(scrollYProgress, [0.6, 0.75], [0, 1]),
          }}
        >
          Assessment & Expression: Your first training session is FREE. A full movement and strength assessment
          paired with a 60-minute session so we can see where you are and map out where you are going.
          No card required.
        </motion.p>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  index,
  scrollYProgress,
}: {
  plan: (typeof plans)[0];
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const opacity = useTransform(scrollYProgress, [0.1 + index * 0.08, 0.25 + index * 0.08], [0, 1]);
  const y = useTransform(scrollYProgress, [0.1 + index * 0.08, 0.25 + index * 0.08], [30, 0]);

  return (
    <motion.div
      className={`relative overflow-hidden ${
        plan.highlighted ? 'glass-card-intense border-gold/20' : 'glass-card'
      }`}
      style={{ opacity, y }}
    >
      <div className="p-6 md:p-8 flex flex-col h-full">
        {plan.highlighted && (
          <div className="mb-5 inline-flex w-fit rounded-sm bg-gold px-3 py-1 font-caption text-[9px] uppercase tracking-[0.15em] text-bg shadow-gold-glow">
            No Card Required
          </div>
        )}

        <h3 className="font-body text-2xl md:text-3xl font-semibold tracking-normal text-text mb-2">
          {plan.name}
        </h3>

        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-price text-4xl md:text-5xl font-semibold text-gold">
            {plan.price}
          </span>
          {plan.period && (
            <span className="font-price text-text-muted text-sm">
              {plan.period}
            </span>
          )}
        </div>

        <p className="font-body text-text-muted text-sm leading-relaxed mb-6">
          {plan.description}
        </p>

        <p className="font-caption text-[10px] tracking-[0.15em] uppercase text-gold/60 mb-3">
          What&apos;s Included
        </p>
        <ul className="space-y-2 mb-8 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="font-body text-text-muted text-sm flex items-start gap-2">
              <span className="text-gold mt-0.5">—</span>
              {f}
            </li>
          ))}
        </ul>

        <a
          href="/book"
          className={`block text-center w-full py-3 font-sub text-sm uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${
            plan.highlighted
              ? 'bg-gold text-bg hover:bg-gold/90 shadow-gold-glow'
              : 'glass-button text-gold hover:text-gold-light'
          }`}
        >
          {plan.cta}
        </a>
      </div>
    </motion.div>
  );
}
