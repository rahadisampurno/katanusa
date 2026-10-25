const RECOVERY_KEY_PREFIX = 'katanusa:asset-recovery:';
const RECOVERY_WINDOW_MS = 60_000;

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
};

export const isChunkLoadError = (error: unknown): boolean => {
  const message = errorMessage(error);

  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror|loading chunk \S+ failed/i.test(
    message,
  );
};

const recoveryKey = (): string =>
  `${RECOVERY_KEY_PREFIX}${window.location.pathname}${window.location.search}`;

/**
 * Memulihkan SPA yang masih memegang nama asset versi deployment sebelumnya.
 * Hanya satu hard reload yang diizinkan per URL agar kegagalan server tidak
 * berubah menjadi reload loop.
 */
export const recoverFromStaleChunk = (error: unknown): boolean => {
  if (typeof window === 'undefined' || !isChunkLoadError(error)) return false;

  const key = recoveryKey();
  const previousAttempt = Number(window.sessionStorage.getItem(key) ?? 0);
  const now = Date.now();

  if (previousAttempt > 0 && now - previousAttempt < RECOVERY_WINDOW_MS) {
    return false;
  }

  window.sessionStorage.setItem(key, String(now));
  window.location.reload();
  return true;
};

export const retryCurrentPage = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(recoveryKey());
  window.location.reload();
};
