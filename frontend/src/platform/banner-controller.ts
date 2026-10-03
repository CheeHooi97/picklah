type BannerOptions = { adId: string; margin: number };

export function inlineBannerMargin(bounds: { top: number; bottom: number; width: number } | undefined, contentBottom: number, safeTop: number): number | null {
  if (!bounds || bounds.top < safeTop || bounds.bottom > contentBottom - 8 || bounds.width < 320) return null;
  return Math.max(0, Math.round(bounds.top - safeTop));
}

// AdMob has one banner per WebView. Serialize ownership across StrictMode,
// focus changes and resizing so stale cleanup cannot remove a newer banner.
export function createBannerController(driver: {
  prepare: () => Promise<boolean>;
  show: (options: BannerOptions) => Promise<void>;
  remove: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  let queue = Promise.resolve();
  let current: object | null = null;
  let displayed: object | null = null;
  const enqueue = (operation: () => Promise<void>) => {
    queue = queue.then(operation).catch(driver.onError);
  };
  return {
    acquire(options: BannerOptions) {
      const owner = {};
      current = owner;
      enqueue(async () => {
        if (current !== owner) return;
        if (displayed) { await driver.remove(); displayed = null; }
        if (!await driver.prepare() || current !== owner) return;
        displayed = owner;
        await driver.show(options);
      });
      return () => {
        if (current === owner) current = null;
        enqueue(async () => {
          if (displayed !== owner) return;
          await driver.remove(); displayed = null;
        });
      };
    },
    settled: () => queue,
  };
}
