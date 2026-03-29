import { cn } from '@/lib';

type AppMenuHeaderProps = {
  onClose: () => void;
  title: string;
  className?: string;
  titleClassName?: string;
  closeButtonClassName?: string;
};

/** Sticky row at top of overlay nav drawer (title + close). */
export function AppMenuHeader({
  onClose,
  title,
  className,
  titleClassName,
  closeButtonClassName,
}: AppMenuHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 mb-4 flex items-center justify-between border-b pb-3',
        className,
      )}>
      <span className={cn('text-base font-semibold', titleClassName)}>
        {title}
      </span>
      <button
        type="button"
        className={cn(
          'rounded-md px-2 py-1 text-sm font-medium hover:bg-slate-100',
          closeButtonClassName,
        )}
        onClick={onClose}>
        Close
      </button>
    </div>
  );
}
