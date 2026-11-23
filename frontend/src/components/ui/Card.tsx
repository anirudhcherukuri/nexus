import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className,
  headerClassName,
  bodyClassName,
}) => {
  return (
    <div className={clsx('glass-card overflow-hidden', className)}>
      {(title || subtitle || action) && (
        <div className={clsx('px-5 py-4 border-b border-[rgba(160,140,255,0.12)] flex items-center justify-between', headerClassName)}>
          <div>
            {title && <h3 className="text-sm font-semibold text-[#f4f2ff] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-[#a6a4c3] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={clsx('p-5', bodyClassName)}>{children}</div>
    </div>
  );
};
