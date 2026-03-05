import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-lg' },
  md: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-xl' },
  lg: { container: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl' },
} as const;

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const s = sizeMap[size];

  return (
    <div className="flex items-center space-x-3">
      <div
        className={`${s.container} bg-brand-navy rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-navy/20`}
      >
        <svg className={`${s.icon} stroke-[1.5]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tighter text-brand-navy`}>
          FTC <span className="text-brand-sage">Portal</span>
        </span>
      )}
    </div>
  );
};

export default Logo;

