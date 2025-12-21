import React from 'react';

// Export SVG string for printing purposes (no React dependencies inside the string)
export const LOGO_SVG_STRING = `
<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="60" height="60" rx="14" fill="url(#print_logo_gradient)"/>
  <path d="M16 42V18L30 31L44 18V42" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="30" cy="12" r="3" fill="#34D399"/>
  <defs>
    <linearGradient id="print_logo_gradient" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4F46E5"/>
      <stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
</svg>
`;

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 60 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <rect width="60" height="60" rx="14" fill="url(#paint0_linear_logo_main)" />
      <path d="M16 42V18L30 31L44 18V42" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="30" cy="12" r="3" fill="#34D399"/>
      <defs>
        <linearGradient id="paint0_linear_logo_main" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5"/>
          <stop offset="1" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>
    </svg>
  );
};