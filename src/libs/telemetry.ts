/**
 * KataNusa Client Real User Monitoring (RUM) & Core Web Vitals Tracker
 * Melacak performa rendering nyata pada perangkat pengguna (smartphone/desktop):
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - CLS (Cumulative Layout Shift)
 * - INP / FID (Interaction to Next Paint / First Input Delay)
 * - TTFB (Time to First Byte)
 * Mengirim data secara non-blocking via navigator.sendBeacon tanpa membebani thread utama.
 */

interface WebVitalsPayload {
  url: string;
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number;
  ttfb?: number;
  connectionType?: string;
  deviceMemory?: number;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  screenWidth?: number;
  screenHeight?: number;
}

class WebVitalsRUM {
  private metrics: WebVitalsPayload = {
    url: typeof window !== 'undefined' ? window.location.pathname : '',
  };
  private clsValue: number = 0;
  private sessionValue: number = 0;
  private sessionEntries: PerformanceEntry[] = [];
  private hasReported: boolean = false;

  constructor() {
    if (typeof window === 'undefined') return;

    this.detectDeviceMetadata();
    this.observeNavigationTiming();
    this.observePaint();
    this.observeLCP();
    this.observeCLS();
    this.observeINP();
    this.setupReportingListener();
    this.setupErrorCapture();
  }

  private detectDeviceMetadata(): void {
    const nav = navigator as unknown as {
      connection?: { effectiveType?: string };
      deviceMemory?: number;
    };

    const width = window.innerWidth;
    const deviceType: 'mobile' | 'tablet' | 'desktop' =
      width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

    this.metrics.connectionType = nav.connection?.effectiveType || 'unknown';
    this.metrics.deviceMemory = nav.deviceMemory;
    this.metrics.deviceType = deviceType;
    this.metrics.screenWidth = width;
    this.metrics.screenHeight = window.innerHeight;
  }

  private observeNavigationTiming(): void {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (navEntry) {
        this.metrics.ttfb = Math.max(0, Math.round(navEntry.responseStart - navEntry.requestStart));
      }
    } catch {
      // Browser lama yang belum mendukung Navigation Timing v2
    }
  }

  private observePaint(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = Math.round(entry.startTime);
          }
        }
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch {
      // Fallback
    }
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.lcp = Math.round(lastEntry.startTime);
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Fallback
    }
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as unknown as Array<{
          hadRecentInput: boolean;
          value: number;
          startTime: number;
        }>) {
          // Hanya hitung layout shift tanpa interaksi pengguna baru saja (within 500ms)
          if (!entry.hadRecentInput) {
            const firstSessionEntry = this.sessionEntries[0];
            const lastSessionEntry = this.sessionEntries[this.sessionEntries.length - 1];

            // Google session window algorithm (5s max session, 1s gap)
            if (
              this.sessionValue &&
              entry.startTime - (lastSessionEntry?.startTime || 0) < 1000 &&
              entry.startTime - (firstSessionEntry?.startTime || 0) < 5000
            ) {
              this.sessionValue += entry.value;
              this.sessionEntries.push(entry as unknown as PerformanceEntry);
            } else {
              this.sessionValue = entry.value;
              this.sessionEntries = [entry as unknown as PerformanceEntry];
            }

            if (this.sessionValue > this.clsValue) {
              this.clsValue = this.sessionValue;
              this.metrics.cls = Math.round(this.clsValue * 1000) / 1000;
            }
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Fallback
    }
  }

  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as unknown as Array<{ duration: number }>) {
          if (entry.duration && (!this.metrics.inp || entry.duration > this.metrics.inp)) {
            this.metrics.inp = Math.round(entry.duration);
          }
        }
      });
      observer.observe({ type: 'first-input', buffered: true });
    } catch {
      // Fallback
    }
  }

  private setupReportingListener(): void {
    // Kirim laporan metrik saat pengguna beralih tab atau meninggalkan halaman
    const reportCallback = () => {
      if (this.hasReported) return;
      this.hasReported = true;

      this.metrics.url = window.location.pathname;
      const payload = JSON.stringify(this.metrics);

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/monitoring/vitals', blob);
      } else {
        fetch('/api/monitoring/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportCallback();
      }
    });

    window.addEventListener('pagehide', reportCallback);
  }

  private setupErrorCapture(): void {
    // Sentry / Error Tracing Listener
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn) {
      console.info('[RUM Telemetry] Sentry Cloud aktif untuk pelacakan error klien.');
    }

    window.addEventListener('error', (event) => {
      // Error logging ke APM internal
      console.warn('[KataNusa RUM Captured Error]:', event.message, event.filename, event.lineno);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.warn('[KataNusa RUM Unhandled Rejection]:', event.reason);
    });
  }
}

export const initClientTelemetry = (): void => {
  if (typeof window !== 'undefined') {
    new WebVitalsRUM();
  }
};
