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
    <div className={clsx('bg-white border border-slate-200/80 rounded-lg shadow-sm overflow-hidden', className)}>
      {(title || subtitle || action) && (
        <div className={clsx('px-5 py-4 border-b border-slate-100 flex items-center justify-between', headerClassName)}>
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={clsx('p-5', bodyClassName)}>{children}</div>
    </div>
  );
};
