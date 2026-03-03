
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  sizeVariant?: 'sm' | 'md' | 'lg';
}

const Input: React.FC<InputProps> = ({ label, error, sizeVariant = 'md', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-4 text-sm',
    lg: 'p-5 text-base'
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          {label}
        </label>
      )}
      <input 
        className={`w-full bg-white border border-brand-navy/10 rounded-2xl outline-none font-medium transition-all focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/5 placeholder:text-brand-navy/20 ${error ? 'border-rose-300 bg-rose-50' : ''} ${sizeClasses[sizeVariant]} ${className}`}
        {...props}
      />
      {error && <p className="text-[9px] font-bold text-rose-500 px-2">{error}</p>}
    </div>
  );
};

export default Input;
