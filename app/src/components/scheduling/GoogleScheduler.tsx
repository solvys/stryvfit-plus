'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, Lock, Unlock } from 'lucide-react';
import { combineDateAndTime, googleCalendarEventUrl } from '@/lib/googleCalendar';
import { reportIncident } from '@/lib/reportIncident';
import {
  buildAvailableTimes,
  dateKey,
  DEFAULT_BOOKING_AVAILABILITY,
  readBookingAvailability,
  saveBookingAvailability,
  toggleBlockedSlot,
  type BookingAvailability,
} from '@/lib/bookingAvailability';

const durationOptions = [30, 60];

function normalizeDuration(durationMinutes: number): number {
  return durationOptions.includes(durationMinutes) ? durationMinutes : durationOptions[0];
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function buildDateCycle(cycleIndex: number): { days: Date[]; label: string; eyebrow: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (cycleIndex === 0) {
    const days = Array.from({ length: 10 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index + 1);
      return date;
    });
    const start = days[0];
    const end = days[days.length - 1];
    return {
      days,
      label: `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(start)} ${start.getDate()}-${end.getDate()}`,
      eyebrow: 'Next 10 days',
    };
  }

  const monthOffset = Math.ceil(cycleIndex / 2);
  const slide = (cycleIndex - 1) % 2;
  const monthStart = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), monthOffset);
  const startDay = slide === 0 ? 1 : 11;
  const days = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(monthStart);
    date.setDate(startDay + index);
    return date;
  });

  return {
    days,
    label: `${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthStart)} ${startDay}-${startDay + 9}`,
    eyebrow: `Window ${slide + 1} of 2`,
  };
}

function formatDay(date: Date): { weekday: string; day: string; month: string } {
  return {
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
  };
}

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function GoogleScheduler({
  title,
  description,
  durationMinutes = 45,
  location = 'Stryv Society Fitness',
  context,
  variant = 'card',
  onBookSession,
  manageAvailability = false,
}: {
  title: string;
  description: string;
  durationMinutes?: number;
  location?: string;
  context?: string;
  variant?: 'card' | 'timeline';
  onBookSession?: () => void;
  manageAvailability?: boolean;
}) {
  const [availability, setAvailability] = useState<BookingAvailability>(DEFAULT_BOOKING_AVAILABILITY);
  const [selectedDuration, setSelectedDuration] = useState(() => normalizeDuration(durationMinutes));
  const [cycleIndex, setCycleIndex] = useState(0);
  const cycle = useMemo(() => buildDateCycle(cycleIndex), [cycleIndex]);
  const days = cycle.days;
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const times = useMemo(() => buildAvailableTimes(availability, selectedDuration), [availability, selectedDuration]);
  const [selectedTime, setSelectedTime] = useState(times[0]);
  const [mockBooked, setMockBooked] = useState(false);
  const selectedDateKey = dateKey(selectedDate);
  const blockedTimes = useMemo(
    () => availability.blockedSlots[selectedDateKey] ?? [],
    [availability.blockedSlots, selectedDateKey]
  );
  const selectedTimeBlocked = blockedTimes.includes(selectedTime);

  useEffect(() => {
    const refresh = () => setAvailability(readBookingAvailability());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('stryvfit-booking-availability', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('stryvfit-booking-availability', refresh);
    };
  }, []);

  useEffect(() => {
    const nextAvailable = times.find((time) => !blockedTimes.includes(time)) ?? times[0];
    if (!times.includes(selectedTime) || (!manageAvailability && blockedTimes.includes(selectedTime))) {
      setSelectedTime(nextAvailable);
    }
  }, [blockedTimes, manageAvailability, selectedTime, times]);

  function updateAvailability(patch: Partial<BookingAvailability>) {
    const next = { ...availability, ...patch };
    setAvailability(next);
    saveBookingAvailability(next);
  }

  function toggleSelectedBlock() {
    const next = toggleBlockedSlot(availability, selectedDate, selectedTime);
    setAvailability(next);
    saveBookingAvailability(next);
  }

  const goToCycle = (nextCycle: number) => {
    const safeCycle = Math.max(0, nextCycle);
    const next = buildDateCycle(safeCycle);
    setCycleIndex(safeCycle);
    setSelectedDate(next.days[0]);
  };

  const eventUrl = useMemo(() => {
    try {
      const start = combineDateAndTime(selectedDate, selectedTime);
      const end = new Date(start.getTime() + selectedDuration * 60 * 1000);
      return googleCalendarEventUrl({
        title,
        details: [description, context].filter(Boolean).join('\n\n'),
        start,
        end,
        location,
      });
    } catch (error) {
      void reportIncident({
        source: 'google-calendar',
        severity: 'high',
        message: error instanceof Error ? error.message : 'Google Calendar event URL generation failed',
        stack: error instanceof Error ? error.stack : undefined,
        context: { title, durationMinutes: selectedDuration, selectedTime },
        admin_action: 'Auto-filed from themed Google scheduler.',
      });
      return 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    }
  }, [context, description, location, selectedDate, selectedDuration, selectedTime, title]);

  if (variant === 'timeline') {
    const selectedLabel = formatFullDate(selectedDate);

    return (
      <section className="rounded-md border border-[#dedbd4] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-caption text-[10px] uppercase tracking-[0.16em] text-[#f24f09]">
              Schedule
            </p>
            <h2 className="mt-1 font-section text-4xl leading-none tracking-normal text-[#151515]">
              Sprint timeline
            </h2>
            <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-[#66615a]">
              Map appointment blocks, client check-ins, and publishing windows before sending them to Google Calendar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-[auto_auto]">
            <label className="px-1 py-1 text-right">
              <p className="font-caption text-[9px] uppercase tracking-[0.14em] text-[#817b72]">Duration</p>
              <select
                value={selectedDuration}
                onChange={(event) => setSelectedDuration(Number(event.target.value))}
                className="mt-1 bg-transparent font-headline text-lg uppercase text-[#151515] outline-none"
              >
                {durationOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes}m
                  </option>
                ))}
              </select>
            </label>
            <a
              href={eventUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-md border border-[#f24f09] bg-transparent px-4 font-caption text-[10px] uppercase tracking-[0.14em] text-[#151515]"
            >
              <span className="absolute inset-0 origin-left scale-x-0 bg-[#f24f09] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              <span className="relative z-10 inline-flex items-center gap-2 transition-colors group-hover:text-white">
                Add to Calendar <ExternalLink className="h-4 w-4" strokeWidth={1.7} />
              </span>
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0 rounded-md border border-[#e6e2da] bg-[#fbfaf8] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[#817b72]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#f24f09]" strokeWidth={1.7} />
                <div>
                  <p className="font-caption text-[10px] uppercase tracking-[0.16em]">Sprint dates</p>
                  <p className="mt-1 font-body text-xs text-[#66615a]">
                    <span className="font-semibold text-[#151515]">{cycle.label}</span> · {cycle.eyebrow}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToCycle(cycleIndex - 1)}
                  disabled={cycleIndex === 0}
                  aria-label="Previous calendar cycle"
                  className="ios-pill flex h-9 w-9 items-center justify-center rounded-full border border-[#dedbd4] bg-white text-[#151515] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => goToCycle(cycleIndex + 1)}
                  aria-label="Next calendar cycle"
                  className="ios-pill flex h-9 w-9 items-center justify-center rounded-full border border-[#f24f09]/35 bg-white text-[#f24f09]"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[860px] grid-cols-10 gap-2">
                {days.map((date, index) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const label = formatDay(date);
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`relative min-h-[116px] overflow-hidden rounded-md border p-3 text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-[#f24f09] bg-[radial-gradient(circle_at_50%_18%,rgba(242,79,9,0.24),rgba(255,255,255,0)_58%),#fffaf6] text-[#f24f09] shadow-[0_0_0_1px_rgba(242,79,9,0.28),0_0_26px_rgba(242,79,9,0.34),inset_0_1px_0_rgba(255,255,255,0.82)]'
                          : 'border-[#dedbd4] bg-white text-[#151515] shadow-[0_8px_22px_rgba(21,21,21,0.04)] hover:border-[#f24f09]/60 hover:text-[#f24f09] hover:shadow-[0_0_0_1px_rgba(242,79,9,0.12),0_0_18px_rgba(242,79,9,0.16)]'
                      }`}
                    >
                      {isSelected ? (
                        <span className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#f24f09]/20 blur-xl" />
                      ) : null}
                      <span className="block font-caption text-[9px] uppercase tracking-[0.13em] text-[#817b72]">
                        Day {index + 1}
                      </span>
                      <span className="mt-3 block font-caption text-[9px] uppercase tracking-[0.13em]">
                        {label.weekday}
                      </span>
                      <span className="mt-1 block font-headline text-3xl leading-none">{label.day}</span>
                      <span
                        className={`absolute inset-x-3 bottom-3 h-1 rounded-full shadow-[0_0_14px_currentColor] ${
                          isSelected ? 'bg-[#f24f09] text-[#f24f09]' : 'bg-[#dedbd4] text-transparent'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="rounded-md border border-[#e6e2da] bg-[#fbfaf8] p-3">
            <div className="flex items-center gap-2 text-[#817b72]">
              <Clock className="h-4 w-4 text-[#f24f09]" strokeWidth={1.7} />
              <p className="font-caption text-[10px] uppercase tracking-[0.16em]">Scheduling</p>
            </div>
            <p className="mt-3 font-headline text-2xl uppercase leading-none text-[#151515]">{selectedLabel}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {times.map((time) => {
                const isSelected = selectedTime === time;
                const isBlocked = blockedTimes.includes(time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    disabled={isBlocked && !manageAvailability}
                    className={`min-h-11 rounded-full border px-3 font-caption text-[10px] uppercase tracking-[0.14em] transition-all duration-300 ${
                      isSelected
                        ? isBlocked
                          ? 'border-[#151515] bg-[#151515] text-white shadow-[0_0_0_1px_rgba(21,21,21,0.18),0_0_20px_rgba(21,21,21,0.18)]'
                          : 'border-[#f24f09] bg-[radial-gradient(circle_at_50%_0%,rgba(242,79,9,0.22),rgba(255,255,255,0)_64%),#fffaf6] text-[#f24f09] shadow-[0_0_0_1px_rgba(242,79,9,0.22),0_0_20px_rgba(242,79,9,0.28)]'
                        : isBlocked
                          ? 'border-[#dedbd4] bg-[#eeeae4] text-[#aaa39a] line-through opacity-60'
                        : 'border-[#dedbd4] bg-white text-[#6d675f] hover:border-[#f24f09]/60 hover:text-[#f24f09] hover:shadow-[0_0_18px_rgba(242,79,9,0.14)]'
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                );
              })}
            </div>
            {manageAvailability ? (
              <button
                type="button"
                onClick={toggleSelectedBlock}
                className={`ios-pill mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 font-control text-xs font-semibold uppercase tracking-[0.08em] ${
                  selectedTimeBlocked
                    ? 'border border-[#151515] bg-white text-[#151515]'
                    : 'border border-[#151515] bg-[#151515] text-white'
                }`}
              >
                {selectedTimeBlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {selectedTimeBlocked ? 'Unblock time' : 'Block this time'}
              </button>
            ) : null}
            <div className="mt-4 rounded-md border border-[#dedbd4] bg-white p-3">
              <p className="font-caption text-[9px] uppercase tracking-[0.14em] text-[#817b72]">Selected block</p>
              <p className="mt-2 font-body text-sm font-semibold text-[#151515]">{title}</p>
              <p className="mt-1 font-body text-xs leading-relaxed text-[#66615a]">{description}</p>
            </div>
          </aside>
        </div>
        {manageAvailability ? (
          <BookingAvailabilityControls
            availability={availability}
            durationMinutes={selectedDuration}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onChange={updateAvailability}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="bg-transparent p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
            <p className="font-caption text-[10px] uppercase tracking-[0.16em] text-gold">
            Schedule
          </p>
          <h2 className="mt-2 font-section text-3xl leading-none tracking-normal text-text">Choose a block</h2>
        </div>
        <label className="p-1 text-right">
          <p className="font-caption text-[9px] uppercase tracking-[0.14em] text-text-dim">
            Duration
          </p>
          <select
            value={selectedDuration}
            onChange={(event) => setSelectedDuration(Number(event.target.value))}
            className="mt-1 bg-transparent font-headline text-lg text-text outline-none"
          >
            {durationOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes}m
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3 py-2 text-text-muted sm:mb-3 sm:py-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" strokeWidth={1.7} />
            <div>
              <p className="font-caption text-[10px] uppercase tracking-[0.16em]">Choose date</p>
              <p className="mt-1 font-body text-xs text-text-muted">
                <span className="font-semibold text-text">{cycle.label}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToCycle(cycleIndex - 1)}
              disabled={cycleIndex === 0}
              aria-label="Previous calendar cycle"
              className="ios-pill flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg/70 text-text disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => goToCycle(cycleIndex + 1)}
              aria-label="Next calendar cycle"
              className="ios-pill flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-bg/70 text-gold"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {days.map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const label = formatDay(date);
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`relative min-h-[74px] overflow-hidden rounded-md border px-2 py-3 text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-gold bg-[radial-gradient(circle_at_50%_14%,rgba(242,79,9,0.34),rgba(242,79,9,0.10)_48%,rgba(255,255,255,0)_72%)] text-gold shadow-[0_0_0_1px_rgba(242,79,9,0.26),0_0_24px_rgba(242,79,9,0.34),inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'border-border bg-bg/70 text-text shadow-[0_8px_22px_rgba(0,0,0,0.04)] hover:border-gold/50 hover:shadow-[0_0_0_1px_rgba(242,79,9,0.12),0_0_18px_rgba(242,79,9,0.16)]'
                }`}
              >
                {isSelected ? (
                  <span className="pointer-events-none absolute -right-5 -top-5 h-14 w-14 rounded-full bg-gold/25 blur-xl" />
                ) : null}
                <span className="block font-caption text-[9px] uppercase tracking-[0.13em] opacity-70">
                  {label.weekday}
                </span>
                <span className="mt-1 block font-headline text-2xl leading-none">{label.day}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-text-muted">
          <Clock className="h-4 w-4 text-gold" strokeWidth={1.7} />
          <p className="font-caption text-[10px] uppercase tracking-[0.16em]">Choose time</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {times.map((time) => {
            const isSelected = selectedTime === time;
            const isBlocked = blockedTimes.includes(time);
            return (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                disabled={isBlocked}
                className={`min-h-11 rounded-full border px-3 font-caption text-[10px] uppercase tracking-[0.14em] transition-all duration-300 ${
                  isSelected
                    ? 'border-gold bg-[radial-gradient(circle_at_50%_0%,rgba(242,79,9,0.34),rgba(242,79,9,0.10)_58%,rgba(255,255,255,0)_82%)] text-gold shadow-[0_0_0_1px_rgba(242,79,9,0.24),0_0_20px_rgba(242,79,9,0.3)]'
                    : isBlocked
                      ? 'border-border bg-bg/40 text-text-dim line-through opacity-45'
                    : 'border-border bg-bg/70 text-text-muted hover:border-gold/50 hover:text-text hover:shadow-[0_0_18px_rgba(242,79,9,0.14)]'
                }`}
              >
                {formatTime(time)}
              </button>
            );
          })}
        </div>
      </div>

      {onBookSession ? (
        <button
          type="button"
          onClick={() => {
            setMockBooked(true);
            onBookSession();
          }}
          className="ios-pill mt-5 inline-flex min-h-14 w-full flex-col items-center justify-center rounded-full bg-gold px-4 text-bg transition-colors hover:bg-gold-deep"
        >
          <span className="font-control text-sm font-semibold uppercase tracking-[0.08em]">
            {mockBooked ? 'Session Booked' : 'Book Session'}
          </span>
          <span className="mt-1 font-caption text-[8px] uppercase tracking-[0.12em] opacity-75">
            {mockBooked ? 'Ready to continue' : 'Mock booking flow'}
          </span>
        </button>
      ) : (
        <a
          href={eventUrl}
          target="_blank"
          rel="noreferrer"
          className="ios-pill mt-5 inline-flex min-h-14 w-full flex-col items-center justify-center rounded-full bg-gold px-4 text-bg transition-colors hover:bg-gold-deep"
        >
          <span className="inline-flex items-center gap-2 font-control text-sm font-semibold uppercase tracking-[0.08em]">
            Book Session <ExternalLink className="h-4 w-4" strokeWidth={1.7} />
          </span>
          <span className="mt-1 font-caption text-[8px] uppercase tracking-[0.12em] opacity-75">
            Add to Google Calendar
          </span>
        </a>
      )}
    </section>
  );
}

function BookingAvailabilityControls({
  availability,
  durationMinutes,
  selectedDate,
  selectedTime,
  onChange,
}: {
  availability: BookingAvailability;
  durationMinutes: number;
  selectedDate: Date;
  selectedTime: string;
  onChange: (patch: Partial<BookingAvailability>) => void;
}) {
  const selectedKey = dateKey(selectedDate);
  const blockedSlots = availability.blockedSlots[selectedKey] ?? [];
  const generatedTimes = buildAvailableTimes(availability, durationMinutes);

  return (
    <section className="mt-4 rounded-md border border-[#e6e2da] bg-[#fbfaf8] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-[#f24f09]" strokeWidth={1.7} />
            <p className="font-caption text-[10px] uppercase tracking-[0.16em] text-[#817b72]">
              Booking rules
            </p>
          </div>
          <h3 className="mt-2 font-headline text-2xl uppercase leading-none text-[#151515]">
            Start times and buffers
          </h3>
          <p className="mt-2 max-w-2xl font-body text-xs leading-relaxed text-[#66615a]">
            These controls set the start-time range clients can book, add buffer time between sessions, and block off
            exact times for the selected calendar day.
          </p>
        </div>
        <div className="rounded-full border border-[#dedbd4] bg-white px-3 py-2 font-caption text-[9px] uppercase tracking-[0.12em] text-[#817b72]">
          {generatedTimes.length} starts · {durationMinutes}m session
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="block rounded-md border border-[#dedbd4] bg-white p-3">
          <span className="font-caption text-[9px] uppercase tracking-[0.13em] text-[#817b72]">First start</span>
          <input
            type="time"
            value={availability.firstStart}
            onChange={(event) => onChange({ firstStart: event.target.value })}
            className="mt-2 min-h-11 w-full rounded-full border border-[#dedbd4] bg-[#fbfaf8] px-3 font-control text-sm font-semibold text-[#151515] outline-none focus:border-[#f24f09]"
          />
        </label>
        <label className="block rounded-md border border-[#dedbd4] bg-white p-3">
          <span className="font-caption text-[9px] uppercase tracking-[0.13em] text-[#817b72]">Last start</span>
          <input
            type="time"
            value={availability.lastStart}
            onChange={(event) => onChange({ lastStart: event.target.value })}
            className="mt-2 min-h-11 w-full rounded-full border border-[#dedbd4] bg-[#fbfaf8] px-3 font-control text-sm font-semibold text-[#151515] outline-none focus:border-[#f24f09]"
          />
        </label>
        <label className="block rounded-md border border-[#dedbd4] bg-white p-3">
          <span className="font-caption text-[9px] uppercase tracking-[0.13em] text-[#817b72]">
            Buffer between
          </span>
          <select
            value={availability.bufferMinutes}
            onChange={(event) => onChange({ bufferMinutes: Number(event.target.value) })}
            className="mt-2 min-h-11 w-full rounded-full border border-[#dedbd4] bg-[#fbfaf8] px-3 font-control text-sm font-semibold text-[#151515] outline-none focus:border-[#f24f09]"
          >
            {[0, 15, 30, 45, 60].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-md border border-[#dedbd4] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-caption text-[9px] uppercase tracking-[0.13em] text-[#817b72]">
              Blocked on {formatFullDate(selectedDate)}
            </p>
            <p className="mt-1 font-body text-xs text-[#66615a]">
              Selected time: <span className="font-semibold text-[#151515]">{formatTime(selectedTime)}</span>
            </p>
          </div>
          <p className="font-caption text-[9px] uppercase tracking-[0.12em] text-[#f24f09]">
            {blockedSlots.length} blocked
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {generatedTimes.map((time) => {
            const blocked = blockedSlots.includes(time);
            return (
              <button
                key={time}
                type="button"
                onClick={() => {
                  const next = toggleBlockedSlot(availability, selectedDate, time);
                  onChange({ blockedSlots: next.blockedSlots });
                }}
                className={`ios-pill inline-flex min-h-9 items-center gap-2 rounded-full px-3 font-control text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  blocked
                    ? 'border border-[#151515] bg-[#151515] text-white'
                    : 'border border-[#dedbd4] bg-[#fbfaf8] text-[#66615a]'
                }`}
              >
                {blocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {formatTime(time)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
