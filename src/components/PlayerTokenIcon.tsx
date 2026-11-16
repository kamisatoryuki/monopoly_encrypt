import React from 'react';
import { TokenShape } from '../types/game';

interface PlayerTokenIconProps {
  shape: TokenShape;
  color: string;
  size?: number;
  className?: string;
}

export const PlayerTokenIcon: React.FC<PlayerTokenIconProps> = ({
  shape,
  color,
  size = 16,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {shape === 'hex' && (
        <polygon
          points="12,2 21,7 21,17 12,22 3,17 3,7"
          fill={color}
          stroke="#0B1120"
          strokeWidth="2"
        />
      )}
      {shape === 'diamond' && (
        <polygon
          points="12,2 22,12 12,22 2,12"
          fill={color}
          stroke="#0B1120"
          strokeWidth="2"
        />
      )}
      {shape === 'triangle' && (
        <polygon
          points="12,3 22,20 2,20"
          fill={color}
          stroke="#0B1120"
          strokeWidth="2"
        />
      )}
      {shape === 'circle' && (
        <circle
          cx="12"
          cy="12"
          r="9"
          fill={color}
          stroke="#0B1120"
          strokeWidth="2"
        />
      )}
      {shape === 'shield' && (
        <path
          d="M12 2L4 5.5V11.5C4 16.8 7.4 20.9 12 22C16.6 20.9 20 16.8 20 11.5V5.5L12 2Z"
          fill={color}
          stroke="#0B1120"
          strokeWidth="2"
        />
      )}
      {shape === 'star' && (
        <polygon
          points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
          fill={color}
          stroke="#0B1120"
          strokeWidth="1.8"
        />
      )}
      {shape === 'square' && (
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
          fill={color}
          stroke="#0B1120"
          strokeWidth="2"
        />
      )}
      {shape === 'cross' && (
        <path
          d="M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z"
          fill={color}
          stroke="#0B1120"
          strokeWidth="2"
        />
      )}
    </svg>
  );
};
