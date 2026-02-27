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
    <div className="cp-modal-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="cp-modal-header">
          <h3 className="cp-modal-title">{title}</h3>
          <button type="button" className="cp-icon-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </header>
        <div className="cp-modal-body">{children}</div>
        {footer && <footer className="cp-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
};
