import { AppShell } from '@/components/layout/AppShell';
import { MealPrepPlanner } from '@/components/meals/MealPrepPlanner';

export default function MealsPage() {
  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-section text-3xl tracking-normal">MEAL PREP</h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Ideal Nutrition picks for your weekly training rhythm.
        </p>
      </header>
      <MealPrepPlanner />
    </AppShell>
  );
}
