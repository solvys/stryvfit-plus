import type { IdealNutritionMeal } from '@/types';

export type ClientRequestKind = 'trainer-note' | 'meal-plan-change';

export interface ClientRequest {
  id: string;
  kind: ClientRequestKind;
  clientName: string;
  message: string;
  suggestedActions: string[];
  meals: Array<Pick<IdealNutritionMeal, 'id' | 'name' | 'protein_g' | 'calories' | 'product_url'>>;
  createdAt: string;
  status: 'new' | 'reviewed';
}

export const CLIENT_REQUESTS_STORAGE_KEY = 'stryvfit-client-requests';

export function enrichClientRequest(kind: ClientRequestKind, message: string, meals: IdealNutritionMeal[]): string[] {
  const lower = message.toLowerCase();
  const actions = new Set<string>();

  if (kind === 'meal-plan-change') {
    actions.add('Review requested meal swaps against the trainer-approved plan.');
    actions.add('Send one updated 4-meal recommendation set back to the client.');
  } else {
    actions.add('Review note before the next check-in.');
  }

  if (lower.includes('allerg') || lower.includes('dairy') || lower.includes('gluten')) {
    actions.add('Check dietary restriction tags before approving substitutions.');
  }
  if (lower.includes('hungry') || lower.includes('more food') || lower.includes('portion')) {
    actions.add('Rebalance calories or add a trainer-approved flex meal.');
  }
  if (lower.includes('protein')) {
    actions.add('Bias replacements toward higher-protein Ideal Nutrition meals.');
  }
  if (lower.includes('schedule') || lower.includes('time')) {
    actions.add('Confirm meal timing around the next scheduled workout.');
  }

  if (meals.length > 0) {
    actions.add(`Use current ${meals.length}-meal plan as the baseline for the response.`);
  }

  return Array.from(actions).slice(0, 5);
}

export function readClientRequests(): ClientRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CLIENT_REQUESTS_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as ClientRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveClientRequest(input: Omit<ClientRequest, 'id' | 'createdAt' | 'status'>): ClientRequest {
  const request: ClientRequest = {
    ...input,
    id: `req-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  const next = [request, ...readClientRequests()].slice(0, 40);
  window.localStorage.setItem(CLIENT_REQUESTS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('stryvfit-client-request', { detail: request }));
  return request;
}
