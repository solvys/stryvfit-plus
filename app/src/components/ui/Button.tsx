import { forwardRef, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-bg hover:bg-secondary active:bg-deep',
  secondary: 'border border-border text-primary hover:border-primary',
  ghost: 'text-text-muted hover:text-text',
  gold: 'bg-gold text-bg hover:bg-gold-deep',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className = '', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`ios-pill font-control font-semibold uppercase tracking-[0.08em] rounded-full transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
});
