import React from 'react';

export const PlayerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="black"
    strokeWidth="1"
    {...props}
  >
    <circle cx="12" cy="6" r="3" />
    <path d="M12 9c-2.76 0-5 2.24-5 5v7h10v-7c0-2.76-2.24-5-5-5z" />
  </svg>
);
