import { CHAT_PATHS } from '#shared/constants/chat'
import NavLink from '../ui/NavLink'

/** Menu de gauche du candidat, affiché sur les pages qui le demandent (`DashboardLayout`). */
export function CandidateSidebar() {
  return (
    <aside className="lg:col-span-1 flex flex-col min-h-0">
      <div className="bg-surface rounded-2xl border border-hairline p-3 shadow-card lg:sticky lg:top-24">
        <nav aria-label="Navigation candidat" className="flex flex-col space-y-0.5">
          <NavLink href="/dashboard/candidat" icon="dashboard" label="Mon espace" />
          <NavLink href="/dashboard/candidat/exercises" icon="target" label="Exercices" />
          <NavLink href="/dashboard/candidat/synthesis" icon="pdf" label="Synthèse" />
          <NavLink href={CHAT_PATHS.candidate} icon="message" label="Discuter avec un expert" />
          <NavLink href="/dashboard/candidat/profile" icon="user" label="Mon profil" />
        </nav>
      </div>
    </aside>
  )
}
