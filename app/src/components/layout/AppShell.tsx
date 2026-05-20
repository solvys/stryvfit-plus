import { TabBar } from './TabBar';
import { BrandWordmark } from '@/components/BrandWordmark';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="px-5 h-14 flex items-center justify-between">
          <a href="/" aria-label="Stryv Society Fitness home" className="inline-flex items-center text-text">
            <BrandWordmark className="w-[210px]" />
          </a>
        </div>
      </header>
      <main className="px-5 pt-6">{children}</main>
      <TabBar />
    </div>
  );
}
