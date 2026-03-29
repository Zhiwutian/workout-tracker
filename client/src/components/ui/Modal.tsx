import { Button } from '@/components/ui/Button';
import { effectiveDarkShell } from '@/lib/display-shell';
import { cn } from '@/lib';
import { useSystemPrefersDark } from '@/lib/use-system-prefers-dark';
import { useAppState } from '@/state';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/** z-[75] backdrop — below panel; toasts use z-[100] (see ToastProvider). */
const BACKDROP_Z = 'z-[75]';
/** z-[85] — above app menu drawer (z-[80]). */
const PANEL_Z = 'z-[85]';

export type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Ref to the control that opened the modal — focus returns here on close. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * Accessible modal: dialog role, overlay click + Escape, body scroll lock,
 * focus restore. Renders via portal to `document.body`.
 */
export function Modal({
  open,
  title,
  children,
  onClose,
  initialFocusRef,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const appState = useAppState();
  const systemDark = useSystemPrefersDark();
  const darkShell = effectiveDarkShell(
    appState.highContrast,
    appState.themeMode,
    systemDark,
  );
  const panelSurface = appState.highContrast
    ? 'border-slate-400 bg-white text-black'
    : darkShell
      ? 'border-slate-600 bg-slate-900 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900';
  const titleClass = appState.highContrast
    ? 'text-black'
    : darkShell
      ? 'text-slate-100'
      : 'text-slate-900';

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const returnFocusTo = initialFocusRef?.current ?? previouslyFocused;

    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? panel).focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      body.style.overflow = prevOverflow;
      returnFocusTo?.focus?.();
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close dialog"
        className={cn(
          'fixed inset-0 bg-black/35 motion-safe:transition-opacity',
          BACKDROP_Z,
        )}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'fixed left-1/2 top-1/2 flex max-h-[min(90vh,32rem)] w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border p-4 shadow-lg motion-safe:transition-opacity motion-reduce:transition-none',
          panelSurface,
          PANEL_Z,
          className,
        )}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 id={titleId} className={cn('text-lg font-semibold', titleClass)}>
            {title}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
