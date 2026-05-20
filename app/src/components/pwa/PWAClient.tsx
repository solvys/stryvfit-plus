'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { reportIncident } from '@/lib/reportIncident';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'stryvfit-pwa-install-dismissed';
const HAPTIC_SELECTOR = 'button, a[href], [role="button"], summary';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PWAClient() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setIsOnline(window.navigator.onLine);
    setIsInstalled(isStandalone());
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true');

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportIncident({
        source: 'client',
        severity: 'high',
        message: event.message || 'Unhandled browser error',
        stack: event.error?.stack,
        context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
        admin_action: 'Auto-filed from global error listener.',
      });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      void reportIncident({
        source: 'client',
        severity: 'medium',
        message: reason instanceof Error ? reason.message : 'Unhandled promise rejection',
        stack: reason instanceof Error ? reason.stack : undefined,
        context: { reason: String(reason) },
        admin_action: 'Auto-filed from unhandled promise rejection.',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    let lastPulse = 0;

    const onClick = (event: MouseEvent) => {
      if (typeof navigator.vibrate !== 'function') return;

      const target = event.target instanceof Element ? event.target : null;
      const action = target?.closest<HTMLElement>(HAPTIC_SELECTOR);
      if (!action || action.dataset.haptic === 'off') return;
      if (action.hasAttribute('disabled') || action.getAttribute('aria-disabled') === 'true') return;

      const now = Date.now();
      if (now - lastPulse < 80) return;
      lastPulse = now;
      navigator.vibrate(action.dataset.haptic === 'strong' ? [12, 18, 12] : 10);
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let mounted = true;

    async function clearDevelopmentWorker() {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        void reportIncident({
          source: 'pwa',
          severity: 'low',
          message: 'Local service worker cleanup failed',
          admin_action: 'Auto-filed from PWA setup.',
        });
      }
    }

    async function registerServiceWorker() {
      if (process.env.NODE_ENV !== 'production') {
        await clearDevelopmentWorker();
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await registration.update();

        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (mounted && worker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      } catch (error) {
        void reportIncident({
          source: 'pwa',
          severity: 'medium',
          message: error instanceof Error ? error.message : 'Service worker registration failed',
          stack: error instanceof Error ? error.stack : undefined,
          admin_action: 'Auto-filed from PWA setup.',
        });
      }
    }

    void registerServiceWorker();

    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const banner = useMemo(() => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        tone: 'border-border bg-surface-2 text-text',
        title: 'Offline mode',
        body: 'Book, Notes, Meals, and Coach are saved for quick access. Live actions resume when you reconnect.',
        action: null,
      };
    }

    if (updateReady) {
      return {
        icon: RefreshCw,
        tone: 'border-gold/30 bg-surface-2 text-text',
        title: 'Update ready',
        body: 'Refresh once to load the newest StryvFit+ app shell.',
        action: 'update' as const,
      };
    }

    if (!isInstalled && !dismissed && (installPrompt || isIos())) {
      return {
        icon: Download,
        tone: 'border-gold/25 bg-surface-2 text-text',
        title: 'Install StryvFit+',
        body: installPrompt
          ? 'Add the app to your home screen for one-tap booking and coach access.'
          : 'On iPhone, use Share, then Add to Home Screen.',
        action: installPrompt ? ('install' as const) : null,
      };
    }

    return null;
  }, [dismissed, installPrompt, isInstalled, isOnline, updateReady]);

  if (!banner) return null;

  const Icon = banner.icon;

  async function handleAction() {
    if (banner?.action === 'install' && installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    }

    if (banner?.action === 'update') {
      const registration = await navigator.serviceWorker.getRegistration();
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      if (!registration?.waiting) {
        window.location.reload();
      }
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  return (
    <aside className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md">
      <div className={`flex items-start gap-3 rounded-md border px-4 py-3 shadow-glass ${banner.tone}`}>
        <Icon className="mt-0.5 h-5 w-5 flex-none text-gold" strokeWidth={1.7} />
        <div className="min-w-0 flex-1">
          <p className="font-caption text-[10px] uppercase tracking-[0.16em] text-text">
            {banner.title}
          </p>
          <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">{banner.body}</p>
          {banner.action ? (
            <button
              type="button"
              onClick={handleAction}
              className="ios-pill mt-3 inline-flex min-h-9 items-center justify-center rounded-full bg-gold px-4 font-control text-[11px] font-semibold uppercase tracking-[0.08em] text-bg transition-colors hover:bg-gold-deep"
            >
              {banner.action === 'install' ? 'Install app' : 'Refresh app'}
            </button>
          ) : null}
        </div>
        {isOnline && !updateReady ? (
          <button
            type="button"
            aria-label="Dismiss install prompt"
            onClick={dismiss}
            className="ios-pill rounded-full p-1 text-text-dim transition-colors hover:text-text"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
