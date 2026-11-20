import React from 'react';
import { navigateTo, withBasePath } from '../utils/router';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export const Link: React.FC<LinkProps> = ({ to, onClick, children, ...rest }) => {
  const isExternal =
    to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:');
  const isHashOnly = to.startsWith('#');
  const resolvedHref = isExternal || isHashOnly ? to : withBasePath(to);

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

    if (isExternal || isHashOnly) {
      return;
    }

    event.preventDefault();
    navigateTo(to);
  };

  return (
    <a href={resolvedHref} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
