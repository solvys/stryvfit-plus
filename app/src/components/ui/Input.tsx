import { forwardRef, InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full bg-surface-3 border border-border focus:border-gold rounded-sm px-3 py-2.5 text-sm font-body text-text placeholder:text-text-dim outline-none transition-colors ${className}`}
        {...rest}
      />
    );
  }
);
