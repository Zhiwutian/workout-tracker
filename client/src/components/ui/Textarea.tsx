import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Multi-line control styled like {@link Input}. */
export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        'box-border min-h-[4rem] w-full max-w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-indigo-500 transition focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}
