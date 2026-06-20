import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:opacity-90',
  secondary: 'border border-line-strong text-ink-soft hover:bg-paper',
  ghost: 'text-muted hover:text-ink',
  danger: 'bg-clay text-paper hover:opacity-90',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-card-in px-4 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
