'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'What makes Stryv Society different from a regular gym?',
    a: "We don't do cookie-cutter programs. Every client gets a 1-on-1 coach, a customized training plan, and nutrition guidance. You are not a membership number — you are an athlete with a program built for your body and your goals.",
  },
  {
    q: 'How does the free first session work?',
    a: 'Your first session is completely free with no card required. You get a full 60-minute training session, a movement and strength assessment, and a goal-setting consultation. We evaluate where you are and map out where you are going.',
  },
  {
    q: 'What does 1-on-1 coaching actually look like?',
    a: 'Every session is 60 minutes of focused, coach-guided training. Your coach designs the workout, corrects your form in real time, and adjusts exercises based on how you are feeling that day. You never guess — you just execute.',
  },
  {
    q: 'Do I need to be in shape to start?',
    a: 'Absolutely not. We work with all fitness levels — from complete beginners to competitive athletes. Your program is scaled to your current ability and progresses as you get stronger. The only requirement is showing up.',
  },
  {
    q: 'How does nutrition coaching work?',
    a: 'Your coach works with you to build a nutrition plan that matches your training and lifestyle. We focus on whole foods, proper macros, and meal timing. Meal prep services are also available through our in-house chef.',
  },
  {
    q: 'What is StryvDash?',
    a: 'StryvDash is our custom booking and progress-tracking platform. Book sessions, track your body composition changes, review your training history, and communicate with your coach — all in one place.',
  },
  {
    q: 'Can I train online if I cannot make it to the studio?',
    a: 'Yes. Our Coaching and Premium plans are fully online. You get custom programming, video form review, weekly check-ins, and live coaching sessions — no studio required.',
  },
  {
    q: 'How do I get started?',
    a: 'Click "Claim Your Free Session" above. We will get you scheduled for your first session and assessment. No commitment, no card required — just show up and train.',
  },
];

export default function FAQSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const firstPanelOpacity = useTransform(scrollYProgress, [0, 0.44, 0.56], [1, 1, 0]);
  const firstPanelY = useTransform(scrollYProgress, [0.42, 0.58], [0, -48]);
  const secondPanelOpacity = useTransform(scrollYProgress, [0.44, 0.58, 1], [0, 1, 1]);
  const secondPanelY = useTransform(scrollYProgress, [0.42, 0.58], [48, 0]);

  return (
    <section
      id="faqs"
      ref={sectionRef}
      className="relative h-[180dvh]"
    >
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden px-6 py-20">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-9 md:grid-cols-[0.85fr_1.15fr] md:gap-12">
          <motion.div
            className="text-center md:text-left"
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.12], [0, 1]),
              y: useTransform(scrollYProgress, [0, 0.12], [20, 0]),
            }}
          >
            <p className="font-caption text-[10px] tracking-[0.2em] uppercase text-gold/60 mb-4">
              Got Questions?
            </p>
            <h2 className="font-hero text-4xl md:text-6xl tracking-[0.04em] text-text leading-[1.1]">
              Frequently Asked
              <br />
              <span className="text-gold">Questions</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md font-body text-sm leading-relaxed text-text-muted md:mx-0">
              Quick answers before you book. The page pauses here just long enough
              to move through the essentials without leaving dead space.
            </p>
          </motion.div>

          <div className="relative min-h-[345px] md:min-h-[430px]">
            <motion.div
              className="absolute inset-x-0 top-0 space-y-3"
              style={{ opacity: firstPanelOpacity, y: firstPanelY }}
            >
              {faqs.slice(0, 4).map((faq) => (
                <FAQCard key={faq.q} faq={faq} />
              ))}
            </motion.div>

            <motion.div
              className="absolute inset-x-0 top-0 space-y-3"
              style={{ opacity: secondPanelOpacity, y: secondPanelY }}
            >
              {faqs.slice(4).map((faq) => (
                <FAQCard key={faq.q} faq={faq} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQCard({ faq }: { faq: (typeof faqs)[0] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="glass-card-intense overflow-hidden"
      animate={{
        boxShadow: isOpen
          ? '0 0 0 1px rgba(242,79,9,0.22), 0 10px 36px rgba(0,0,0,0.42)'
          : '0 0 0 1px rgba(242,79,9,0.08), 0 8px 28px rgba(0,0,0,0.32)',
      }}
      transition={{ duration: 0.2 }}
    >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-5 md:px-6 py-4 md:py-5 text-left"
        >
          <span className="font-body text-sm md:text-base text-text pr-4">
            {faq.q}
          </span>
          <motion.span
            className="text-gold text-lg flex-shrink-0"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            +
          </motion.span>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="font-body text-text-muted text-sm leading-relaxed px-5 md:px-6 pb-5 md:pb-6">
                {faq.a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  );
}
