
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'danger' | 'lime' | 'terracotta';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all active:scale-95  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-sage text-white shadow-lg shadow-brand-sage/10 hover:bg-brand-sage/90",
    secondary: "border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white",
    terracotta: "bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20 hover:bg-brand-terracotta/90",
    lime: "bg-brand-sage text-white hover:bg-brand-sage/90",
    outline: "bg-white border-2 border-brand-navy/10 text-brand-navy/60 hover:border-brand-navy hover:text-brand-navy",
    ghost: "bg-transparent text-brand-navy/40 hover:text-brand-navy",
    dark: "bg-brand-navy text-white shadow-xl shadow-brand-navy/20 hover:bg-brand-navy/90",
    danger: "bg-rose-500 text-white shadow-lg shadow-rose-100 hover:bg-rose-600"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] uppercase tracking-wider rounded-xl",
    md: "px-6 py-3.5 text-sm rounded-2xl",
    lg: "px-10 py-5 text-base rounded-3xl"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
