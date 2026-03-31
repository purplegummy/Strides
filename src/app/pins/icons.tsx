import React from 'react';
 
interface IconProps {
  color: string;
  size?: number;
}
 
export const UpvoteIcon: React.FC<IconProps> = ({ color, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 4L21 13H3L12 4Z" />
  </svg>
);
 
export const DownvoteIcon: React.FC<IconProps> = ({ color, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 20L3 11H21L12 20Z" />
  </svg>
);