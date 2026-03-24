type ExerciseProgressBadgeProps = {
  value: number
  label?: string
}

export default function ExerciseProgressBadge({
  value,
  label = 'Progression',
}: ExerciseProgressBadgeProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div className="inline-flex items-center gap-3">
      <span className="text-[10px] font-bold text-brand-sage uppercase tracking-widest">
        {label}: {safeValue}%
      </span>
      <div className="w-24 h-1.5 rounded-full bg-brand-navy/10 overflow-hidden">
        <div className="h-full rounded-full bg-brand-sage" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}

