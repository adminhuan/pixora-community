import type { PropsWithChildren } from 'react';

interface TooltipProps {
  title: string;
}

export const Tooltip = ({ title, children }: PropsWithChildren<TooltipProps>) => (
  <span className="apc-tooltip-wrapper" data-tooltip={title}>
    {children}
  </span>
);
