
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'violet' | 'lime' | 'orange' | 'pink' | 'cyan' | 'slate' | 'indigo' | 'emerald' | 'amber';
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate' }) => {
  // Define themes mapping variant names to Tailwind CSS utility classes.
  // Added 'indigo', 'emerald', and 'amber' to support existing usage across the application.
  const themes = {
    violet: "bg-brand-sage/10 text-brand-sage border-brand-sage/20",
    lime: "bg-brand-sage/10 text-brand-sage border-brand-sage/20",
    orange: "bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20",
    pink: "bg-rose-50 text-rose-600 border-rose-100",
    cyan: "bg-sky-50 text-sky-600 border-sky-100",
    slate: "bg-brand-navy/5 text-brand-navy/60 border-brand-navy/10",
    indigo: "bg-brand-sage/10 text-brand-sage border-brand-sage/20",
    emerald: "bg-brand-sage/10 text-brand-sage border-brand-sage/20",
    amber: "bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${themes[variant as keyof typeof themes] || themes.slate}`}>
      {children}
    </span>
  );
};

export default Badge;
