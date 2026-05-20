import { AppShell } from '@/components/layout/AppShell';
import { MealPrepPlanner } from '@/components/meals/MealPrepPlanner';

export default function AdminNutritionPage() {
  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-section text-3xl tracking-normal">StryvAdmin · Nutrition</h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Select Ideal Nutrition meals, copy the client brief, then schedule the client check-in.
        </p>
      </header>
      <MealPrepPlanner admin />
    </AppShell>
  );
}
