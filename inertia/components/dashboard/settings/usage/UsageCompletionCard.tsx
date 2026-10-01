import { MAX_LICENSES_ADVISORS } from '#shared/constants/organisation'
import Card from '~/components/ui/Card'

interface UsageCompletionCardProps {
  numberOfLicenses: number
}

export const UsageCompletionCard = ({ numberOfLicenses }: UsageCompletionCardProps) => {
  return (
    <Card variant="dark" className="p-10 space-y-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest relative z-10">
        Usage Plateforme
      </h3>
      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-end">
          <span className="text-3xl font-black text-white">
            {numberOfLicenses} / {MAX_LICENSES_ADVISORS}
          </span>
          <span className="text-[10px] font-black text-indigo-300 uppercase">Licences experts</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400"
            style={{ width: `${(numberOfLicenses / MAX_LICENSES_ADVISORS) * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-indigo-200/60 font-medium italic pt-4">
          Besoin de plus de licences ? Contactez votre gestionnaire de compte Transition Carrière.
        </p>
      </div>
    </Card>
  )
}
