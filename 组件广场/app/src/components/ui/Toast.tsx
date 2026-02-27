import clsx from 'classnames';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const Toast = ({ message, type = 'info' }: ToastProps) => (
  <div role="status" className={clsx('cp-toast', `cp-toast--${type}`)}>
    {message}
  </div>
);
