
import React from 'react';
import Button from '../ui/Button';

export interface PublicHeaderProps {
  onLogoClick: () => void;
  onMethodologyClick?: () => void;
  onAiClick?: () => void;
  onActionClick?: () => void;
  actionLabel?: string;
  showAction?: boolean;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ 
  onLogoClick, 
  onMethodologyClick,
  onAiClick,
  onActionClick, 
  actionLabel = "Accès Expert", 
  showAction = true 
}) => {
  return (
    <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-brand-navy/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={onLogoClick}>
          <div className="w-10 h-10 bg-brand-sage rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-sage/10 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tighter text-brand-navy">FTC <span className="text-brand-sage">Portal</span></span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={onMethodologyClick} 
            className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-sage transition-colors"
          >
            Méthodologie
          </button>
          <button 
            onClick={onAiClick} 
            className="text-xs font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-sage transition-colors"
          >
            Intelligence Artificielle
          </button>
          {showAction && onActionClick && (
            <Button onClick={onActionClick} variant="dark" size="sm">{actionLabel}</Button>
          )}
          {!showAction && (
            <button onClick={onLogoClick} className="text-xs font-bold uppercase tracking-widest text-brand-sage hover:underline">
              Retour à l'accueil
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default PublicHeader;
