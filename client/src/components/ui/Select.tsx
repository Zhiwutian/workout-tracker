import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

/** Native `<select>` styled like {@link Input}. */
export function Select({ className, ...props }: Props) {
  return (
    <select
      className={cn(
        'box-border w-full max-w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-indigo-500 transition focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}
