import type { PropsWithChildren, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  footer?: ReactNode;
}

export const Modal = ({
  open,
  title,
  children,
  onClose,
  footer,
}: PropsWithChildren<ModalProps>) => {
  if (!open) {
    return null;
  }

  return (
    <div className="apc-modal-overlay" onClick={onClose}>
      <div
        className="apc-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="apc-modal-header">
          <h3 className="apc-modal-title">{title}</h3>
          <button
            type="button"
            className="apc-icon-btn"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </header>
        <div className="apc-modal-body">{children}</div>
        {footer && (
          <footer className="apc-modal-footer">{footer}</footer>
        )}
      </div>
    </div>
  );
};
