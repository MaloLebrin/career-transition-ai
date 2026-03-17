import Button from '~/components/ui/Button';
import Card from '~/components/ui/Card';

interface LogoutModalProps {
  onClose: () => void
  onLogout: () => void
}

export const LogoutModal = ({ onClose, onLogout }: LogoutModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-200 flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <Card className="w-full max-w-md p-8 animate-slideUp">
        <h2 id="logout-modal-title" className="text-xl font-bold text-brand-navy mb-2">
          Déconnexion
        </h2>
        <p className="text-brand-navy/60 text-sm mb-8">
          Êtes-vous sûr de vouloir vous déconnecter ?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button variant="danger" size="md" onClick={onLogout}>
            Se déconnecter
          </Button>
        </div>
      </Card>
    </div>
  );
};
