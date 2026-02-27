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
        'cp-btn',
        `cp-btn--${variant}`,
        `cp-btn--${size}`,
        block && 'cp-btn--block',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
