import React from 'react';

export const EnemyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="black"
    strokeWidth="1"
    {...props}
  >
    <path d="M12 2c-3.86 0-7 3.14-7 7 0 2.64 1.48 4.94 3.65 6.13-.5.8-.93 1.66-1.22 2.54-.29.88-.34 1.83.13 2.69.47.86 1.39 1.4 2.44 1.4h6c1.05 0 1.97-.54 2.44-1.4.47-.86.42-1.81.13-2.69-.29-.88-.72-1.74-1.22-2.54C17.52 13.94 19 11.64 19 9c0-3.86-3.14-7-7-7zm-3 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);
