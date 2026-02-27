import clsx from 'classnames';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const Toast = ({ message, type = 'info' }: ToastProps) => (
  <div role="status" className={clsx('apc-toast', `apc-toast--${type}`)}>
    {message}
  </div>
);
