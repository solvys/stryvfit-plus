import { describe, expect, test } from 'bun:test';
import {
  fingerprintIncident,
  linearPriorityForSeverity,
  validateIncidentPayload,
} from '../src/lib/incidents';

describe('incident utilities', () => {
  test('normalizes volatile fingerprints', () => {
    const first = fingerprintIncident({
      source: 'browserbase',
      route: '/admin/pulse',
      message: 'Failed https://example.com/items/1234567890 token abcdefabcdefabcdefabcdef',
    });
    const second = fingerprintIncident({
      source: 'browserbase',
      route: '/admin/pulse',
      message: 'Failed https://example.com/items/9999999999 token 111111111111111111111111',
    });

    expect(first).toBe(second);
  });

  test('validates payload defaults', () => {
    const payload = validateIncidentPayload({
      source: 'unknown',
      route: '',
      message: 'Calendar failed',
      severity: 'nope',
    });

    expect(payload).toMatchObject({
      source: 'client',
      route: '/',
      message: 'Calendar failed',
      severity: 'medium',
    });
    expect(payload?.fingerprint).toContain('client:/');
  });

  test('maps severity to Linear priority', () => {
    expect(linearPriorityForSeverity('critical')).toBe(1);
    expect(linearPriorityForSeverity('high')).toBe(2);
    expect(linearPriorityForSeverity('medium')).toBe(3);
    expect(linearPriorityForSeverity('low')).toBe(4);
  });
});
