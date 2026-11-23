import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'synthetic';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-white/5 text-[#f4f2ff] border-[rgba(160,140,255,0.2)]',
    success: 'bg-[#35d6a0]/15 text-[#35d6a0] border-[#35d6a0]/30 shadow-[0_0_8px_rgba(53,214,160,0.2)]',
    warning: 'bg-[#f5c66b]/15 text-[#f5c66b] border-[#f5c66b]/30 shadow-[0_0_8px_rgba(245,198,107,0.2)]',
    danger: 'bg-[#ff718a]/15 text-[#ff718a] border-[#ff718a]/30 shadow-[0_0_8px_rgba(255,113,138,0.2)]',
    purple: 'bg-[#7957e8]/20 text-[#9875ff] border-[#9875ff]/35 shadow-[0_0_8px_rgba(152,117,255,0.2)]',
    synthetic: 'bg-[#7957e8]/15 text-[#9875ff] border-[#7957e8]/30 font-mono text-[11px] shadow-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm',
        variantStyles[variant],
        className
      )}
    >
      {variant === 'synthetic' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#9875ff] mr-1.5 animate-pulse shadow-[0_0_6px_#9875ff]" />
      )}
      {children}
    </span>
  );
};
