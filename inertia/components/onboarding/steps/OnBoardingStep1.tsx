import Button from '~/components/ui/Button';
import { Employee } from '~/types';

interface OnBoardingStep1Props {
  employee: Employee
  onNext: () => void
}

export const OnBoardingStep1 = ({ employee, onNext }: OnBoardingStep1Props) => (
  <div className="text-center space-y-8 animate-slideUp">
    <div className="w-24 h-24 bg-brand-sage/10 rounded-[32px] flex items-center justify-center text-brand-sage mx-auto">
      <svg
        className="w-12 h-12 stroke-[1.5]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    </div>
    <div className="space-y-4">
      <h2 className="text-4xl font-bold text-brand-navy tracking-tight">
        Bonjour, {employee.name.split(' ')[0]}
      </h2>
      <p className="text-brand-navy/60 text-lg leading-relaxed max-w-lg mx-auto">
        Prêt à lancer votre nouvelle étape de carrière ? Commençons par structurer votre
        profil professionnel.
      </p>
    </div>
    <Button onClick={onNext} size="lg" variant="emphasis">
      Compléter mon Profil
    </Button>
  </div>
)
