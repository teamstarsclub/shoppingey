import React from 'react';
import { navigateTo } from '../utils/router';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export const Link: React.FC<LinkProps> = ({ to, onClick, children, ...rest }) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(event);
    }
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      rest.target === '_blank'
    ) {
      return;
    }

    if (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:')) {
      return;
    }

    if (to.startsWith('#')) {
      return;
    }

    event.preventDefault();
    navigateTo(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
