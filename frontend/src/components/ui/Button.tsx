import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#9875ff]/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-4.5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#7957e8] to-[#9875ff] text-white hover:brightness-110 shadow-[0_0_20px_rgba(152,117,255,0.35)] border border-[#9875ff]/40',
    secondary: 'bg-[rgba(25,25,55,0.7)] text-[#f4f2ff] border border-[rgba(160,140,255,0.22)] hover:bg-[rgba(75,65,130,0.25)] hover:border-[#9875ff]/40 backdrop-blur-md shadow-sm',
    danger: 'bg-gradient-to-r from-[#e11d48] to-[#ff718a] text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,113,138,0.35)] border border-[#ff718a]/30',
    outline: 'border border-[rgba(160,140,255,0.25)] text-[#f4f2ff] hover:bg-white/5 hover:border-[#9875ff]/50 backdrop-blur-sm',
    ghost: 'text-[#a6a4c3] hover:text-[#f4f2ff] hover:bg-white/5',
  };

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-inherit" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
