import { useToast } from '@/components/app/toast-context';
import { useEffect, useRef, type DependencyList } from 'react';

/**
 * Runs an async function when `deps` change; aborts the previous run on re-run/unmount.
 * On rejection, shows an error toast unless the effect was aborted.
 * After each `await`, check `signal.aborted` before calling `setState`.
 */
export function useAbortableAsyncEffect(
  factory: (signal: AbortSignal) => Promise<void>,
  deps: DependencyList,
  errorTitle: string,
): void {
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        await factory(ac.signal);
      } catch (err) {
        if (ac.signal.aborted) return;
        showToastRef.current({
          title: errorTitle,
          description: err instanceof Error ? err.message : undefined,
          variant: 'error',
        });
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: `deps` is the full dependency list passed in by the caller (often includes `listParams`, `workoutId`, etc.)
  }, deps);
}
