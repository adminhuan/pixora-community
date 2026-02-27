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
      className={clsx('cp-card', className)}
      style={noPadding ? undefined : { padding }}
    >
      {(title || extra) && (
        <header className="cp-card-header">
          <h3 className="cp-card-title">{title}</h3>
          {extra && <span className="cp-card-extra">{extra}</span>}
        </header>
      )}
      {children}
    </section>
  );
};
