import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'classnames';

interface CardProps {
  title?: ReactNode;
  extra?: ReactNode;
  padding?: number;
  className?: string;
  noPadding?: boolean;
}

export const Card = ({
  children,
  title,
  extra,
  padding = 20,
  className,
  noPadding,
}: PropsWithChildren<CardProps>) => {
  return (
    <section
      className={clsx('apc-card', className)}
      style={noPadding ? undefined : { padding }}
    >
      {(title || extra) && (
        <header className="apc-card-header">
          <h3 className="apc-card-title">{title}</h3>
          {extra && <span className="apc-card-extra">{extra}</span>}
        </header>
      )}
      {children}
    </section>
  );
};
