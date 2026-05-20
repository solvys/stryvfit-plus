export function smsHref(phoneE164: string | null | undefined, body?: string): string | null {
  if (!phoneE164) return null;
  const cleaned = phoneE164.replace(/[^\d+]/g, '');
  if (!/^\+\d{10,15}$/.test(cleaned)) return null;
  const encoded = body ? `&body=${encodeURIComponent(body)}` : '';
  return `sms:${cleaned}${encoded}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone.replace(/[^\d+]/g, ''));
}
