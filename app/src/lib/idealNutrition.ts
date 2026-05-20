import type { CalendarEventDraft } from '@/lib/googleCalendar';
import { googleCalendarEventUrl } from '@/lib/googleCalendar';
import type { IdealNutritionMeal } from '@/types';

const IDEAL_NUTRITION_URL = 'https://idealnutritionnow.com/';

const FALLBACK_MEALS: IdealNutritionMeal[] = [
  {
    id: 'island-jerk-chicken',
    name: 'Island Jerk Chicken',
    subtitle: 'with Garlic Mashed Potatoes and Roasted Green Beans',
    price_cents: 849,
    calories: 460,
    protein_g: 45,
    fat_g: 20,
    carbs_g: 29,
    image_url: null,
    product_url: `${IDEAL_NUTRITION_URL}collections/homepage-meals/products/03-island-jerk-chicken-with-garlic-mashed-potatoes-and-roasted-green-beans-gf`,
    tags: ['high protein'],
  },
  {
    id: 'teriyaki-meatballs',
    name: 'Teriyaki Meatballs',
    subtitle: 'with Roasted Vegetables and Sticky Rice',
    price_cents: 849,
    calories: 586,
    protein_g: 39,
    fat_g: 22,
    carbs_g: 63,
    image_url: null,
    product_url: `${IDEAL_NUTRITION_URL}collections/homepage-meals/products/teriyaki-meatballs`,
    tags: ['performance carbs'],
  },
  {
    id: 'keto-beef-bolognese',
    name: 'Keto Beef Bolognese',
    subtitle: 'with Roasted Spaghetti Squash',
    price_cents: 849,
    calories: 413,
    protein_g: 25,
    fat_g: 33,
    carbs_g: 9,
    image_url: null,
    product_url: `${IDEAL_NUTRITION_URL}collections/homepage-meals/products/keto-beef-bolognese`,
    tags: ['keto'],
  },
];

function decodeHtml(value: string): string {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '));
}

function absoluteUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return new URL(url, IDEAL_NUTRITION_URL).toString();
  return url;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function tagsForMeal(meal: Omit<IdealNutritionMeal, 'tags'>): string[] {
  const text = `${meal.name} ${meal.subtitle}`.toLowerCase();
  const tags = new Set<string>();

  if (meal.protein_g >= 35) tags.add('high protein');
  if (meal.carbs_g <= 15 || text.includes('keto')) tags.add('keto');
  if (text.includes('vegan')) tags.add('vegan');
  if (text.includes('paleo')) tags.add('paleo');
  if (text.includes('gf') || text.includes('gluten')) tags.add('gluten conscious');
  if (meal.calories <= 420) tags.add('lean');
  if (meal.carbs_g >= 50) tags.add('performance carbs');

  return Array.from(tags);
}

export function parseIdealNutritionMeals(html: string): IdealNutritionMeal[] {
  const cards = html.match(/<li class="splide__slide">[\s\S]*?<\/li>/g) ?? [];

  const meals = cards
    .map((card) => {
      const href = card.match(/<a href="([^"]+)" class="featured-collection-item">/)?.[1];
      const name = stripTags(card.match(/featured-collection__title-line1">([\s\S]*?)<\/h3>/)?.[1] ?? '');
      const subtitle = stripTags(
        card.match(/featured-collection__title-line2"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''
      );
      const priceText = stripTags(card.match(/featured-collection__price">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const image = absoluteUrl(card.match(/background-image: url\(([^)]+)\)/)?.[1]);
      const macroValues = [...card.matchAll(/featured-collection__nutrition-macro-value">\s*([\d.]+)/g)].map(
        (match) => Number(match[1])
      );

      if (!href || !name || macroValues.length < 4) return null;

      const price_cents = Math.round(Number(priceText.replace(/[^0-9.]/g, '')) * 100);
      const meal = {
        id: slugify(name),
        name,
        subtitle,
        price_cents: Number.isFinite(price_cents) ? price_cents : 849,
        calories: macroValues[0],
        protein_g: macroValues[1],
        fat_g: macroValues[2],
        carbs_g: macroValues[3],
        image_url: image,
        product_url: absoluteUrl(href) ?? IDEAL_NUTRITION_URL,
      };

      return { ...meal, tags: tagsForMeal(meal) };
    })
    .filter((meal): meal is IdealNutritionMeal => Boolean(meal));

  return meals.length > 0 ? meals : FALLBACK_MEALS;
}

async function fetchWithBrowserbase(): Promise<string | null> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.browserbase.com/v1/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BB-API-Key': apiKey,
    },
    body: JSON.stringify({
      url: IDEAL_NUTRITION_URL,
      allowRedirects: true,
      proxies: true,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { content?: string; statusCode?: number };
  if (data.statusCode && data.statusCode >= 400) return null;
  return data.content ?? null;
}

export async function fetchIdealNutritionMeals(): Promise<IdealNutritionMeal[]> {
  const browserbaseHtml = await fetchWithBrowserbase().catch(() => null);
  if (browserbaseHtml) {
    return parseIdealNutritionMeals(browserbaseHtml);
  }

  const res = await fetch(IDEAL_NUTRITION_URL, {
    next: { revalidate: 60 * 30 },
    headers: { 'User-Agent': 'StryvFit-PWA/1.0' },
  });

  if (!res.ok) return FALLBACK_MEALS;
  const html = await res.text();
  return parseIdealNutritionMeals(html);
}

export async function fetchIdealNutritionMealsWithDiagnostics(): Promise<{
  meals: IdealNutritionMeal[];
  source: 'browserbase' | 'direct' | 'fallback';
  browserbase_error?: string;
  direct_error?: string;
}> {
  let browserbase_error: string | undefined;

  try {
    const browserbaseHtml = await fetchWithBrowserbase();
    if (browserbaseHtml) {
      return { meals: parseIdealNutritionMeals(browserbaseHtml), source: 'browserbase' };
    }
    if (process.env.BROWSERBASE_API_KEY) {
      browserbase_error = 'Browserbase returned no content';
    }
  } catch (error) {
    browserbase_error = error instanceof Error ? error.message : 'Browserbase fetch failed';
  }

  try {
    const res = await fetch(IDEAL_NUTRITION_URL, {
      next: { revalidate: 60 * 30 },
      headers: { 'User-Agent': 'StryvFit-PWA/1.0' },
    });
    if (!res.ok) {
      throw new Error(`Ideal Nutrition direct fetch failed with ${res.status}`);
    }
    return { meals: parseIdealNutritionMeals(await res.text()), source: 'direct', browserbase_error };
  } catch (error) {
    return {
      meals: FALLBACK_MEALS,
      source: 'fallback',
      browserbase_error,
      direct_error: error instanceof Error ? error.message : 'Ideal Nutrition direct fetch failed',
    };
  }
}

export function buildPulseBrief(meals: IdealNutritionMeal[], context: string): string {
  const chosen = meals.slice(0, 8);
  const totals = chosen.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein_g,
      fat: sum.fat + meal.fat_g,
      carbs: sum.carbs + meal.carbs_g,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  return [
    'StryvFit+ client brief',
    '',
    context,
    '',
    'Selected Ideal Nutrition meals:',
    ...chosen.map(
      (meal, index) =>
        `${index + 1}. ${meal.name} ${meal.subtitle ? `- ${meal.subtitle}` : ''} (${meal.calories} cal, ${meal.protein_g}g protein, ${meal.carbs_g}g carbs, ${meal.fat_g}g fat)`
    ),
    '',
    `Weekly macro snapshot: ${totals.calories} calories, ${totals.protein}g protein, ${totals.carbs}g carbs, ${totals.fat}g fat across ${chosen.length} meals.`,
    '',
    'Use this to prepare a concise daily workout and nutrition plan: what to eat, when to train, what to watch for, and what question to ask the client tomorrow.',
  ].join('\n');
}

export function googleCalendarMealPrepUrl(meals: IdealNutritionMeal[]): string {
  const start = new Date();
  start.setDate(start.getDate() + ((7 - start.getDay()) % 7 || 7));
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const details = buildPulseBrief(meals, 'Meal-prep review for StryvFit+ client.');
  const event: CalendarEventDraft = {
    title: 'StryvFit+ meal prep review',
    details,
    start,
    end,
    location: 'Stryv Society Fitness',
  };

  return googleCalendarEventUrl(event);
}
