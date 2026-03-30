import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib';

type Props = InputHTMLAttributes<HTMLInputElement>;

/**
 * Shared text input primitive for simple forms.
 */
export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        'box-border w-full max-w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-indigo-500 transition focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}
