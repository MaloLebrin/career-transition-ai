
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat' | 'dark' | 'amber';
}

const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: "bg-white border border-brand-navy/5 shadow-sm",
    flat: "bg-brand-ivory/50 border border-brand-navy/5",
    dark: "bg-brand-navy text-white shadow-2xl",
    amber: "bg-brand-terracotta/5 border border-brand-terracotta/10"
  };

  return (
    <div className={`p-8 rounded-3xl ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
