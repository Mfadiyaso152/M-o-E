import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'dark'
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', text: 'text-sm font-black' },
    md: { icon: 'w-12 h-12', text: 'text-lg font-black' },
    lg: { icon: 'w-20 h-20', text: 'text-2xl font-black' },
    xl: { icon: 'w-28 h-28', text: 'text-3xl font-black' }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* SVG Icon matching exactly the architectural emblem in the uploaded logo */}
      <div className={`${sizeMap[size].icon} relative flex items-center justify-center`}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Main Tall Right Tower (Sand / Beige) */}
          <path
            d="M104 22 L116 26 V96 L104 93 Z"
            fill="#C5B198"
          />
          <path
            d="M104 107 C116 110 128 116 142 124 L142 150 L132 150 V136 C124 130 114 125 104 121 Z"
            fill="#C5B198"
          />

          {/* Middle Medium Tower (Sand / Beige) */}
          <path
            d="M80 50 L91 53 V136 L59 150 L80 141 Z"
            fill="#C5B198"
          />
          <path
            d="M80 50 L91 53 V136 L80 132 Z"
            fill="#C5B198"
          />

          {/* Left Dark Green Architectural Windows & Block */}
          <path
            d="M58 80 H69 V102 H58 Z"
            fill="#1C3022"
          />
          <path
            d="M58 108 H69 V132 H58 Z"
            fill="#1C3022"
          />

          {/* Bottom Right Green Accent Door/Opening */}
          <path
            d="M104 135 H115 V150 H104 Z"
            fill="#1C3022"
          />
        </svg>
      </div>

      {showText && (
        <div className={`mt-2 tracking-wide font-black ${sizeMap[size].text} ${textColor === 'light' ? 'text-[#F5F3EF]' : 'text-[#1C3022]'}`}>
          نماذج التميز
        </div>
      )}
    </div>
  );
};
