import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'classnames';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  block,
  className,
  ...props
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      className={clsx(
        'apc-btn',
        `apc-btn--${variant}`,
        `apc-btn--${size}`,
        block && 'apc-btn--block',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
