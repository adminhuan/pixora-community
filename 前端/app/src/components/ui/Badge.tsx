import type { PropsWithChildren } from 'react';
import clsx from 'classnames';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = ({
  children,
  variant = 'default',
  className,
}: PropsWithChildren<BadgeProps>) => (
  <span className={clsx('apc-badge', `apc-badge--${variant}`, className)}>
    {children}
  </span>
);
