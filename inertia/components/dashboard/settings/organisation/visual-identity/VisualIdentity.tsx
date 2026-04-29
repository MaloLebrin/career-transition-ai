import Button from "~/components/ui/Button";
import Card from "~/components/ui/Card";
import { Organization } from "~/types/organization";

interface VisualIdentityProps {
  organization: Organization;
}

export const VisualIdentity = ({ organization }: VisualIdentityProps) => {
  return (
    <Card className="p-10 text-center space-y-6 opacity-60 cursor-not-allowed">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
        Identité Visuelle
      </h3>
      <div className="relative group mx-auto w-32 h-32">
        <div className="w-32 h-32 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[32px] flex items-center justify-center text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-400 transition-all overflow-hidden">
          {organization.logoUrl ? (
            <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        <Button
          size="sm"
          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </Button>
      </div>
      <p className="text-xs text-slate-500 font-medium">
        Format carré, PNG ou SVG conseillé (Max 1Mo).
      </p>
    </Card>
  );
};
