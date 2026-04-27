export function getProgress(plan: { completed: boolean }[]): {
  completed: number
  total: number
  percent: number
} {
  const total = plan.length
  const completed = plan.filter((s) => s.completed).length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percent }
}
