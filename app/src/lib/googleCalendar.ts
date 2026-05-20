export interface CalendarEventDraft {
  title: string;
  details: string;
  start: Date;
  end: Date;
  location?: string;
}

function googleDate(date: Date): string {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

export function googleCalendarEventUrl(event: CalendarEventDraft): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.details,
    dates: `${googleDate(event.start)}/${googleDate(event.end)}`,
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}
