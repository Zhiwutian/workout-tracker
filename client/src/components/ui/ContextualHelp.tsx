import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib';
import { useAppState } from '@/state';
import { effectiveDarkShell } from '@/lib/display-shell';
import { useSystemPrefersDark } from '@/lib/use-system-prefers-dark';
import { type ReactNode, useCallback, useRef, useState } from 'react';

export type ContextualHelpProps = {
  /** Accessible name for the trigger, e.g. "About dashboard metrics". */
  label: string;
  /** Modal dialog title. */
  title: string;
  children: ReactNode;
  className?: string;
};

/**
 * Compact help trigger (?) opening an accessible modal — keeps primary surfaces minimal.
 */
export function ContextualHelp({
  label,
  title,
  children,
  className,
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const appState = useAppState();
  const systemDark = useSystemPrefersDark();
  const darkShell = effectiveDarkShell(
    appState.highContrast,
    appState.themeMode,
    systemDark,
  );

  const onClose = useCallback(() => setOpen(false), []);

  const triggerSurface = appState.highContrast
    ? 'border-black bg-white text-black hover:bg-slate-100'
    : darkShell
      ? 'border-slate-500 bg-slate-800 text-slate-200 hover:bg-slate-700'
      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-semibold leading-none shadow-sm outline-none ring-indigo-500 transition focus-visible:ring-2 motion-reduce:transition-none',
          triggerSurface,
          className,
        )}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}>
        <span aria-hidden="true">?</span>
      </button>
      <Modal
        open={open}
        title={title}
        onClose={onClose}
        initialFocusRef={triggerRef}>
        <div className="space-y-3 text-sm opacity-90">{children}</div>
      </Modal>
    </>
  );
}
