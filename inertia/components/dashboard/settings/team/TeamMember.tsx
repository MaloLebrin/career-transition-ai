import Badge from '~/components/ui/Badge'
import Button from '~/components/ui/Button'
import { AdvisorRole } from "~/types"

interface TeamMemberProps {
  name: string
  role: AdvisorRole
  email: string
  isMe?: boolean
}

export const TeamMember = ({ name, role, email, isMe = false }: TeamMemberProps) => {
  const roleDisplay = {
    admin: { label: 'Admin', variant: 'violet' as const },
    expert: { label: 'Expert', variant: 'indigo' as const },
    consultant: { label: 'Consultant', variant: 'cyan' as const },
  }[role] || { label: 'Inconnu', variant: 'slate' as const }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all group">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black text-sm border border-slate-100 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-black text-slate-900 flex items-center">
            {name}
            {isMe && (
              <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] rounded-full uppercase tracking-widest font-black">
                Moi
              </span>
            )}
            <span className="ml-2">
              <Badge variant={roleDisplay.variant}>{roleDisplay.label}</Badge>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold">{email}</div>
        </div>
      </div>
      {!isMe && (
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"
          title="Retirer l'accès"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      )}
    </div>
  )
}
