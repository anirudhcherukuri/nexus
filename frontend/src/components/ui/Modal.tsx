import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with dark purple ambient blur */}
      <div
        className="fixed inset-0 bg-[#080817]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={clsx(
          'relative w-full bg-[#0d1024]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(152,117,255,0.15)] border border-[rgba(160,140,255,0.25)] overflow-hidden z-10 flex flex-col max-h-[90vh]',
          widthStyles[maxWidth]
        )}
      >
        {/* Subtle top violet accent */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#9875ff] to-transparent w-full" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(160,140,255,0.12)] flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-base font-semibold text-[#f4f2ff] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#a6a4c3] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a6a4c3] hover:text-[#f4f2ff] hover:bg-white/5 transition-colors border border-transparent hover:border-[rgba(160,140,255,0.2)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 text-[#f4f2ff]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 bg-white/[0.02] border-t border-[rgba(160,140,255,0.12)] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
