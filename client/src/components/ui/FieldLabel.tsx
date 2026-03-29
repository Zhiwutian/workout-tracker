import { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib';

type Props = LabelHTMLAttributes<HTMLLabelElement>;

/** Consistent label styling for native controls next to {@link Input} / {@link Select}. */
export function FieldLabel({ className, ...props }: Props) {
  return (
    <label
      className={cn('mb-1 block text-xs font-medium text-slate-600', className)}
      {...props}
    />
  );
}
