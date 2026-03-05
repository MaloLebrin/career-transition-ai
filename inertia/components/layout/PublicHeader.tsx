
import React from 'react';
import Button from '../ui/Button';
import Logo from '../ui/Logo';

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
    <nav className="fixed top-0 w-full z-100 bg-white/80 backdrop-blur-xl border-b border-brand-navy/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center space-x-3 cursor-pointer group border-none bg-transparent p-0"
        >
          <Logo size="md" />
        </button>
        
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
